const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const path = require('path');
const { DynamoDB, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3'); // AWS SDK v3
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { NovitaSDK, TaskStatus } = require("novita-sdk");
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const { Readable } = require('stream');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000;

// Configure AWS S3 Client
const s3 = new S3Client({
    region: "us-east-1",  // Change to your S3 region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const novitaClient = new NovitaSDK(process.env.NOVITA_KEY);

const s3_BUCKET_NAME = 'avatargenerationimages';

const upload = multer({ storage: multer.memoryStorage() }); // Keep files in memory for processing

const docClient = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = 'ComicUsers';
const COUNTER_TABLE_NAME = 'UserIDCounter';

app.use(express.json({ limit: '10mb'})); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data (optional)
app.use(express.static(path.join(__dirname, 'Public'))); // Serves static files

async function convertImageToJPEGBuffer(blob, mimeType) {
    try {
        console.log('Converting File: ', blob);
        const buffer = blob.buffer;

        // Check if the image is already in JPEG format
        if (mimeType === 'image/jpeg') {
            console.log('Image is already JPEG, resizing and compressing if necessary...');
            return await sharp(buffer)
                .resize({ // Resize to a maximum of 16 megapixels
                    width: 4000,
                    height: 4000,
                    fit: 'inside', // Maintain aspect ratio
                })
                .jpeg({ quality: 80 }) // Compress to 80% quality
                .toBuffer();
        }

        // Convert HEIC if needed
        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
            console.log('Processing HEIC image...');
            const jpegBuffer = await heicConvert({
                buffer: buffer,
                format: 'JPEG',
                quality: 0.8,
            });
            return await sharp(jpegBuffer)
                .resize({ // Resize to a maximum of 16 megapixels
                    width: 4000,
                    height: 4000,
                    fit: 'inside', // Maintain aspect ratio
                })
                .jpeg({ quality: 80 }) // Compress to 80% quality
                .toBuffer();
        }

        // Process other formats with Sharp
        console.log('Processing non-HEIC image...');
        return await sharp(buffer)
            .resize({ // Resize to a maximum of 16 megapixels
                width: 4000,
                height: 4000,
                fit: 'inside', // Maintain aspect ratio
            })
            .jpeg({ quality: 80 }) // Compress to 80% quality
            .toBuffer();
    } catch (error) {
        console.error('Error in convertImageToJPEG:', error);
        throw new Error('Failed to convert image to JPEG');
    }
}

// Generate Avatar Image
async function generateWithDeepImage(formDataParams) {
    const response = await fetch('https://deep-image.ai/rest_api/process', {
        method: 'POST',
        headers: {
            'x-api-key': `${process.env.DEEP-IMAGE_KEY}`,
        },
        body: formDataParams
    });
    
    if (!response.ok) throw new Error('API request failed');
    return response.json();
}

async function updateS3Keys(username, oldImageObjects, newImageObjects) {
    for (let i = 0; i < newImageObjects.length; i++) {
        const newKey = newImageObjects[i].key;
        const oldKey = oldImageObjects[i]?.key;

        // If the key has changed, update the S3 object key
        if (newKey !== oldKey) {
            console.log(`Updating S3 key from ${oldKey} to ${newKey}`);


            // Copy the object to the new key
            const copyParams = {
                Bucket: s3_BUCKET_NAME,
                CopySource: `${s3_BUCKET_NAME}/avatargenerationimages/${username}/${oldKey}`,
                Key: `avatargenerationimages/${username}/${newKey}`,
            };
            await s3.send(new CopyObjectCommand(copyParams));

            // Delete the old object
            const deleteParams = {
                Bucket: s3_BUCKET_NAME,
                Key: `avatargenerationimages/${username}/${oldKey}`,
            };
            await s3.send(new DeleteObjectCommand(deleteParams));
        }
    }
}

app.post('/generatePhoto', upload.single('image'), async (req, res) => {
    const { username, prompt, isAvatar, position } = req.body;
    const file = req.file || null;

    console.log('--- /generatePhoto Request Received ---');
    console.log('Request Body:', req.body);
    console.log('Uploaded File:', file);

    if (!username || ((!file && isAvatar) || (file && !isAvatar)) || !prompt) {
        console.error('Validation Error: Missing required parameters.');
        return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }

    try {
        let imageBuffer;

        if (isAvatar) {
            console.log('Processing avatar image...');
            // Convert the uploaded file to a JPEG buffer
            imageBuffer = await convertImageToJPEGBuffer(file, file.mimetype);
            console.log('Converted Avatar Image Buffer (First 100 Bytes):', imageBuffer.subarray(0, 100));
        } else {
            console.log('Fetching avatar from S3...');
            // Fetch the avatar from S3 as a buffer
            const getObjectParams = {
                Bucket: s3_BUCKET_NAME,
                Key: `avatargenerationimages/users/${username}/avatar.jpeg`,
            };
            const command = new GetObjectCommand(getObjectParams);
            const data = await s3.send(command);
            imageBuffer = await data.Body.toBuffer();
            console.log('Fetched Avatar Image Buffer (First 100 Bytes):', imageBuffer.subarray(0, 100));
        }

        // Create a readable stream from the buffer
        const imageStream = new Readable();
        imageStream.push(imageBuffer); // Push the buffer into the stream
        imageStream.push(null); // Signal the end of the stream

        console.log('Preparing parameters for DeepImage.ai...');
        // Set parameters for image generation
        const params = {
            "width": 1024,
            "height": 1024,
            "background": {
                "generate": {
                    "description": prompt,
                    "adapter_type": "face",
                    "face_id": true,
                    "output_format": "jpeg",
                    "quality": 90,
                },
            },
        };

        console.log('Parameters for DeepImage.ai:', params);

        // Prepare the form data for the DeepImage.ai API
        const formData = new FormData();
        formData.append('image', imageStream, file ? file.originalname : 'avatar.jpeg'); // Attach the readable stream
        formData.append('parameters', JSON.stringify(params)); // Attach the parameters

        console.log('Sending request to DeepImage.ai...');
        // Generate image with DeepImage.ai
        const resultJson = await generateWithDeepImage(formData);
        console.log('DeepImage.ai Response:', resultJson);

        const jobId = resultJson.job;
        console.log('DeepImage.ai Job ID:', jobId);

        let resultStatus = 'received';
        let s3Key = '';

        while (["received", "in_progress", "not_started"].includes(resultStatus)) {
            console.log(`Checking job status for Job ID: ${jobId}...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const resultResponse = await fetch(`https://deep-image.ai/rest_api/result/${jobId}`, { headers });
            const resultJson = await resultResponse.json();
            resultStatus = resultJson.status;
            console.log(`Job Status: ${resultStatus}`);
        }

        if (resultStatus === 'complete') {
            const resultUrl = resultJson.result_url;
            console.log('Generated Image URL:', resultUrl);

            // Fetch the generated image as a buffer
            const imageBuffer = await fetch(resultUrl).then((response) => response.arrayBuffer());
            const buffer = Buffer.from(imageBuffer); // Convert ArrayBuffer to Buffer
            console.log('Generated Image Buffer (First 100 Bytes):', buffer.subarray(0, 100));

            if (!isAvatar) {
                console.log('Processing non-avatar image...');
                // Fetch the user's current imageObjects from DynamoDB
                const getParams = {
                    TableName: TABLE_NAME,
                    Key: { userID: username },
                };
                const userData = await docClient.get(getParams);
                console.log('Fetched User Data from DynamoDB:', userData);

                const oldImageObjects = userData.Item.imageObjects || [];
                console.log('Old Image Objects:', oldImageObjects);

                // Insert the new image at the specified position
                const newImageObject = {
                    key: `${position}_image.jpeg`,
                    description: prompt,
                    order: position,
                };
                const newImageObjects = [...oldImageObjects];
                newImageObjects.splice(position, 0, newImageObject);

                // Reorder the imageObjects and update their keys
                newImageObjects.forEach((obj, index) => {
                    obj.order = index;
                    obj.key = `${index}_image.jpeg`;
                });

                console.log('New Image Objects:', newImageObjects);

                // Update S3 keys if necessary
                console.log('Updating S3 keys...');
                await updateS3Keys(username, oldImageObjects, newImageObjects);

                // Save the generated image to S3
                const s3Key = `avatargenerationimages/${username}/${newImageObject.key}`;
                console.log('Saving generated image to S3 with key:', s3Key);

                const uploadParams = new PutObjectCommand({
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                    Body: buffer, // Use the buffer directly
                    ContentType: 'image/jpeg',
                });

                await s3.send(uploadParams);

                // Update the user's imageObjects in DynamoDB
                console.log('Updating DynamoDB with new imageObjects...');
                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { username: username },
                    UpdateExpression: "set imageObjects = :objects",
                    ExpressionAttributeValues: {
                        ":objects": newImageObjects,
                    },
                    ReturnValues: "UPDATED_NEW",
                };

                await docClient.update(updateParams);
            } else if (isAvatar) {
                console.log('Processing avatar image...');
                // Save avatar to S3
                s3Key = `avatargenerationimages/users/${username}/avatar.jpeg`;
                console.log('Saving avatar image to S3 with key:', s3Key);

                const uploadParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: 'image/jpeg',
                };
                await s3.send(new PutObjectCommand(uploadParams));
            }
        } else {
            console.error('Image generation failed.');
            throw new Error('Image generation failed.');
        }

        console.log('Image generation workflow completed successfully.');
        res.status(200).json({ success: true, message: 'Image generated successfully.', s3Key });
    } catch (error) {
        console.error('Error generating photo:', error);
        res.status(500).json({ success: false, message: 'Photo generation failed.', error: error.message });
    }
});

const isValidEmail = email => {
    // Regular expression for validating an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(email);
}

// Generate a new userID using an atomic counter
async function generateUserID() {
    const params = {
        TableName: COUNTER_TABLE_NAME,
        Key: { CounterName: 'UserID' },
        UpdateExpression: 'SET userID = if_not_exists(userID, :start) + :increment',
        ExpressionAttributeValues: {
            ':start': 1000,
            ':increment': 1
        },
        ReturnValues: 'UPDATED_NEW'
    };

    const result = await docClient.update(params);
    return result.Attributes.userID;
}

// Define a route for the root URL to serve starting page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'login.html'));
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'heroics.daily@gmail.com',
        pass: 'xnls espx vxmb jnbt',
    },
});

app.post('/recover-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    console.log(email);
    try {
        // Query DynamoDB using email as the GSI
        const params = {
            TableName: TABLE_NAME,  // Your DynamoDB table name
            IndexName: 'email', // Your GSI index name
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email,
            },
        };

        const result = await docClient.query(params);
        if (result.Items.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const user = result.Items[0];
        const username = user.username;
        const password = user.password;

        // Send the email
        const mailOptions = {
            from: 'heroics.daily@gmail.com',
            to: email,
            subject: 'Password Recovery',
            text: `Here is your password ${username}: ${password} \nDon't forget it this time! :)\n\nIf you didn't request this email, please make sure your Daily Heroics account information is secure and consider changing your password.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password recovery email sent successfully.' });

    } catch (error) {
        console.error('Error retrieving password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/signup', async (req, res) => {
    const { username, email, password, attributes, comicTitle, lastLogin } = req.body;
    console.log('Signup request body:', req.body); // Log the request body for debugging
    if (!username || !email || !password || !attributes) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const userID = await generateUserID();
        const user = {
            TableName: TABLE_NAME,
            Item: {
                userID: userID.toString(),
                username: username,
                email: email,
                password: password,
                attributes: attributes,
                comicTitle: comicTitle,
                lastLogin: lastLogin,
                imageObjects: [],
            }
        };

        await docClient.put(user);
        return res.status(201).json({ success: true, message: 'User signed up successfully.' });
    } catch (err) {
        console.error('Error adding user:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error signing up.' });
    }
});

app.post('/check-username', async (req, res) => {
    const { username, email } = req.body;

    const emailParams = {
        TableName: 'ComicUsers',
        IndexName: 'email',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email
        },
        Limit: 1
    };

    const usernameParams = {
        TableName: 'ComicUsers',
        IndexName: 'username',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        },
        Limit: 1
    };

    try {
        const [emailData, usernameData] = await Promise.all([
            docClient.query(emailParams),
            docClient.query(usernameParams)
        ]);

        const emailExists = emailData.Items.length > 0;
        const usernameExists = usernameData.Items.length > 0;

        res.json({ emailExists: emailExists, usernameExists: usernameExists });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request body:', req.body); // Log the request body for debugging
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    if(isValidEmail(username)){
        var params = {
            TableName: TABLE_NAME,
            IndexName: 'email', // Using GSI (secondary index)
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': username
            }
        };
    }else{
        var params = {
            TableName: TABLE_NAME,
            IndexName: 'username', // Using GSI (secondary index)
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            }
        };
    }

    try {
        const data = await docClient.query(params);
        if (data.Items.length > 0 && data.Items[0].password == password) {
            const userID = data.Items[0].userID;
            return res.status(200).json({ success: true, userID: userID });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Error logging in:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error logging in.' });
    }
});

app.get('/getUserData', async (req, res) => {
    const userID = req.query.userID;

    if (!userID) {
        return res.status(400).json({ error: 'Missing userID parameter' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
    };

    try {
        const data = await docClient.get(params);
        if (!data.Item) {
            return res.status(404).json({ error: 'User not found' });
        }

        const imageObjects = data.Item.imageObjects || [];

        // Generate presigned URLs for each image
        const updatedImageObjects = await Promise.all(
            imageObjects.map(async (imageObject) => {
                const getObjectParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: `avatargenerationimages/${data.Item.username}/${imageObject.key}`,
                };

                const presignedUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
                    expiresIn: 3600, // URL expires in 1 hour
                });

                return {
                    ...imageObject,
                    image: presignedUrl, // Replace the image field with the presigned URL
                };
            })
        );

        res.json({ item: { ...data.Item, imageObjects: updatedImageObjects } });
    } catch (error) {
        console.error('Error fetching data from DynamoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/setComicTitle', async (req, res) => {
    const { userID, comicTitle } = req.body;

    if (!userID || !comicTitle) {
        return res.status(400).json({ error: 'Missing userID or comicTitle parameter' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set comicTitle = :comicTitle',
        ExpressionAttributeValues: { ':comicTitle': comicTitle }
    };

    try {
        await docClient.update(params);
        res.status(200).json({ message: 'Comic title updated successfully' });
    } catch (err) {
        console.log('Error setting comicTitle: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getUserAttributes', async (req, res) => {
    const userID = req.query.userID;

    console.log(`Received request for user attributes with userID: ${userID}`);

    if (!userID) {
        return res.status(400).json({ error: 'Missing userID parameter' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID }
    };

    try {
        const data = await docClient.get(params);
        if (!data.Item) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`Successfully fetched attributes for userID: ${userID}`);
        res.json(data.Item.attributes); // Return only the attributes
    } catch (error) {
        console.error('Error fetching data from DynamoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/editAttributes', async (req, res) => {
    const { userID, attributes } = req.body;

    if (!userID || !attributes) {
        return res.status(400).json({ error: 'Missing userID or attributes parameter' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set attributes = :attributes',
        ExpressionAttributeValues: { ':attributes': attributes }
    };

    try {
        await docClient.update(params);
        res.status(200).json({ message: 'Attributes updated successfully' });
    } catch (err) {
        console.log('Error updating attributes: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to change username
app.post('/changeUsername', async (req, res) => {
    const { userID, newUsername } = req.body;

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set username = :newUsername',
        ExpressionAttributeValues: { ':newUsername': newUsername }
    };

    try {
        await docClient.update(params);
        res.status(200).json({ message: 'Username updated successfully' });
    } catch (error) {
        console.log('Error changing username: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to change password
app.post('/changePassword', async (req, res) => {
    const { userID, newPassword } = req.body;

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set password = :newPassword',
        ExpressionAttributeValues: { ':newPassword': newPassword }
    };

    try {
        await docClient.update(params);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/deleteImage', async (req, res) => {
    const { userID, imageKey } = req.body;

    if (!userID || !imageKey) {
        return res.status(400).json({ success: false, message: 'User ID and image key are required.' });
    }

    // Fetch the user's data from DynamoDB
    const getParams = {
        TableName: TABLE_NAME,
        Key: { userID: userID }
    };

    try {
        const data = await docClient.get(getParams);
        if (!data.Item) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Remove the image object from the user's imageObjects list
        let imageObjects = data.Item.imageObjects || [];
        imageObjects = imageObjects.filter(obj => obj.key !== imageKey);

        // Reassign orders to maintain the correct sequence
        imageObjects.forEach((obj, index) => {
            obj.order = index + 1;
        });

        // Update the user's data in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
            UpdateExpression: "set imageObjects = :objects",
            ExpressionAttributeValues: {
                ":objects": imageObjects
            },
            ReturnValues: "UPDATED_NEW"
        };

        await docClient.update(updateParams);

        return res.status(200).json({ success: true, message: 'Image object deleted successfully.' });
    } catch (err) {
        console.error('Error deleting image object:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error deleting image object.' });
    }
});

app.post('/saveImage', upload.single('imageBlob'), async (req, res) => {
    const { userID, username, imageObjects } = req.body;

    if (!userID || !username || !imageObjects) {
        return res.status(400).json({ success: false, message: 'User ID, username, and image objects are required.' });
    }

    try {
        const parsedImageObjects = JSON.parse(imageObjects);

        // Fetch the user's current imageObjects from DynamoDB
        const getParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
        };
        const userData = await docClient.get(getParams);
        const oldImageObjects = userData.Item.imageObjects || [];

        // Update S3 keys if necessary
        await updateS3Keys(username, oldImageObjects, parsedImageObjects);

        // Upload each image to S3
        for (const imageObject of parsedImageObjects) {
            const s3Key = `avatargenerationimages/${username}/${imageObject.key}`;
            const uploadParams = {
                Bucket: s3_BUCKET_NAME,
                Key: s3Key,
                Body: imageObject.image, // The uploaded image blob
                ContentType: 'image/jpeg',
            };

            await s3.send(new PutObjectCommand(uploadParams));
        }

        // Update the user's imageObjects in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
            UpdateExpression: "set imageObjects = :objects",
            ExpressionAttributeValues: {
                ":objects": parsedImageObjects,
            },
            ReturnValues: "UPDATED_NEW",
        };

        await docClient.update(updateParams);

        res.status(200).json({ success: true, message: 'Image objects saved successfully.' });
    } catch (err) {
        console.error('Error saving image objects:', err);
        res.status(500).json({ success: false, message: 'Error saving image objects.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
