const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const streamPipeline = promisify(require('stream').pipeline);
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const path = require('path');
const { DynamoDB, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3'); // AWS SDK v3
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const nodemailer = require('nodemailer');
const multer = require('multer');
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const { Readable } = require('stream');
const FormData = require('form-data');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000;

// Add X-Content-Type-Options: nosniff header to all responses
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Configure AWS S3 Client
const s3 = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const s3_BUCKET_NAME = 'avatargenerationimages';

const upload = multer({ storage: multer.memoryStorage() }); // Keep files in memory for processing

// Configure DynamoDB client 
const docClient = DynamoDBDocument.from(new DynamoDB({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
}));
const TABLE_NAME = 'ComicUsers';
const COUNTER_TABLE_NAME = 'UserIDCounter';

app.use(express.json({ limit: '10mb'})); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data (optional)
app.use(express.static(path.join(__dirname, 'Public'))); // Serves static files

async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

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

app.get('/getAvatarURL', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Missing username parameter' });
    }

    const getObjectParams = {
        Bucket: s3_BUCKET_NAME,
        Key: `users/${username}/avatar.jpeg`,
    };

    try {
        const avatarUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
            expiresIn: 3600, // URL expires in 1 hour
        });
        console.log('Avatar URL:', avatarUrl);
        res.json({ avatarUrl: avatarUrl });
    } catch (error) {
        console.error('Error fetching avatar URL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/generatePhoto', upload.single('image'), async (req, res) => {
    const { username, userID, prompt, createAvatar, position, description, temporary } = req.body;
    const file = req.file || null;

    let isAvatar = false;
    if (typeof createAvatar === 'string') {
        isAvatar = createAvatar === 'true';
    }

    console.log('--- /generatePhoto Request Received ---');
    console.log('Request Body:', req.body);
    if (file) {console.log('Uploaded File:', file);}

    if (!(username || userID) || ((isAvatar && !file) || (!isAvatar && !description)) || !prompt || !temporary) {
        console.error('Validation Error: Missing required parameters.');
        return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }

    try {
        if (isAvatar) {
            console.log('Processing avatar image...');
            // Convert the uploaded file to a JPEG buffer
            let imageBuffer = await convertImageToJPEGBuffer(file, file.mimetype);
            // save image to s3
            const uploadParams = {
                Bucket: s3_BUCKET_NAME,
                Key: `users/${username}/avatar.jpeg`,
                Body: imageBuffer,
                ContentType: 'image/jpeg',
            };
            console.log('Uploading avatar to S3...');
            await s3.send(new PutObjectCommand(uploadParams));
        }
    
        console.log('Preparing parameters for DeepImage.ai...');

        const headers = {
            'X-API-KEY': `${process.env.DEEP_IMAGE_KEY}`,
            'Content-Type': 'application/json' 
        };
        console.log('Headers for API Call:', headers);

        // Set parameters for image generation
        const params = {
            "url": `storage://${s3_BUCKET_NAME}/users/${username}/avatar.jpeg`, // Use the S3 key for the avatar
            "background": {
                "generate": {
                    "description": prompt,
                    "adapter_type": "face",
                    "face_id": true,
                    "quality": 90,
                },
            },
            "width": 1024,
            "height": 1024,
            "output_format": "jpg",
        };
        console.log('Parameters for DeepImage.ai:', params);

        // Generate image with DeepImage.ai
        console.log(`Sending request to DeepImage.ai...`);
        const response = await fetch(' https://deep-image.ai/rest_api/process_result', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });
        
        let responseJson = await response.json();
        console.log('DeepImage.ai Response:', responseJson);
        if (!response.ok) {
            // throw error
            throw new Error(`Error from DeepImage.ai: ${response.status} - ${responseJson.message}`);
        }
        const jobId = responseJson.job;
        console.log('DeepImage.ai Job ID:', jobId);

        let resultStatus = 'received';
        let updatedImageObjects = [];
        let imageUrl = '';
        let resultImageBuffer = null;
        let resultJson = null;

        while (["received", "in_progress", "not_started"].includes(resultStatus)) {
            console.log(`Checking job status for Job ID: ${jobId}...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const resultResponse = await fetch(`https://deep-image.ai/rest_api/result/${jobId}`, { headers });
            resultJson = await resultResponse.json();
            resultStatus = resultJson.status;
            console.log(`Job Status: ${JSON.stringify(resultJson)}`);
        }

        if (resultStatus === 'complete') {
            const resultUrl = resultJson.result_url;
            console.log('Generated Image URL:', resultUrl);
            
            // Fetch the generated image as a buffer
            const imageBufferRequest = await fetch(resultUrl);
            const imageBuffer = await imageBufferRequest.arrayBuffer();
            resultImageBuffer = Buffer.from(imageBuffer); // Convert ArrayBuffer to Buffer
            console.log('Generated Image Buffer (First 100 Bytes):', resultImageBuffer.subarray(0, 100));

            if (!isAvatar) {
                console.log('Processing non-avatar image...');
                
                // Save the new image to S3
                let s3Key = `users/${username}/image_${Date.now()}.jpeg`; // Generate a unique key for the new image
                console.log('Generated S3 Key for New Image:', s3Key);
                const uploadParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                    Body: resultImageBuffer, // Store as Buffer
                    ContentType: 'image/jpeg',
                };
                console.log('Uploading new image to S3 with key:', s3Key);
                await s3.send(new PutObjectCommand(uploadParams));

                // Fetch the user's current imageObjects from DynamoDB
                const getParams = {
                    TableName: TABLE_NAME,
                    Key: { userID: userID },
                };
                const userData = await docClient.get(getParams);
                console.log('Fetched User Data from DynamoDB:', userData);

                const oldImageObjects = userData.Item.imageObjects || [];
                console.log('Old Image Objects:', oldImageObjects);

                // Generate a presigned URL for the new image
                const getObjectParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                };
                imageUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
                    expiresIn: 3600, // URL expires in 1 hour
                });

                // Insert the new image at the specified position
                const newImageObject = {
                    key: s3Key,
                    description: description,
                    order: position,
                    image: imageUrl
                };
                const newImageObjects = [...oldImageObjects];
                newImageObjects.splice(position, 0, newImageObject);

                // Reorder the imageObjects and update their keys
                newImageObjects.forEach((obj, index) => {
                    obj.order = index;
                });

                updatedImageObjects = newImageObjects;
                console.log('New Image Objects:', newImageObjects);

                // Update the user's imageObjects in DynamoDB
                console.log('Updating DynamoDB with new imageObjects...');
                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { userID: userID },
                    UpdateExpression: "set imageObjects = :objects",
                    ExpressionAttributeValues: {
                        ":objects": newImageObjects,
                    },
                    ReturnValues: "UPDATED_NEW",
                };

                docClient.update(updateParams);
                
            } else if (isAvatar) {
                console.log('Processing avatar image...');
                // Save avatar to S3
                s3Key = temporary? `users/${username}/avatar_t.jpeg` : `users/${username}/avatar.jpeg`; // Use a different key for temporary avatars
                console.log('Saving avatar image to S3 with key:', s3Key);

                const uploadParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                    Body: resultImageBuffer,
                    ContentType: 'image/jpeg',
                };
                await s3.send(new PutObjectCommand(uploadParams));

                // update avatarUrl to presigned url of the avatar
                const getObjectParams = {
                    Bucket: s3_BUCKET_NAME,
                    Key: s3Key,
                };
                imageUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
                    expiresIn: 3600, // URL expires in 1 hour
                });
                console.log('Avatar URL:', imageUrl);
            }
        }

        console.log('Image generation workflow completed successfully.');
        res.status(200).json({ success: true, message: 'Image generated successfully.', imageObjects: updatedImageObjects, imageUrl: imageUrl});
    } catch (error) {
        console.error('Error generating photo:', error);
        res.status(500).json({ success: false, message: 'Photo generation failed.', error: error.message });
    }
});

// Function to delete temporary avatar
app.delete('/deleteAvatar', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    try {
        // Delete the avatar from S3
        const deleteParams = {
            Bucket: s3_BUCKET_NAME,
            Key: `users/${username}/avatar_t.jpeg`,
        };
        await s3.send(new DeleteObjectCommand(deleteParams));

        res.status(200).json({ success: true, message: 'Avatar deleted successfully.' });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        res.status(500).json({ success: false, message: 'Error deleting avatar.', error: error.message });
    }
});

// Function to switch avatar for temporary avatar
app.post('/switchAvatar', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    try {
        // Copy the temporary avatar to the main avatar location
        const copyParams = {
            Bucket: s3_BUCKET_NAME,
            CopySource: `${s3_BUCKET_NAME}/users/${username}/avatar_t.jpeg`,
            Key: `users/${username}/avatar.jpeg`,
        };
        await s3.send(new CopyObjectCommand(copyParams));

        // Delete the temporary avatar
        const deleteParams = {
            Bucket: s3_BUCKET_NAME,
            Key: `users/${username}/avatar_t.jpeg`,
        };
        await s3.send(new DeleteObjectCommand(deleteParams));

        res.status(200).json({ success: true, message: 'Avatar switched successfully.' });
    } catch (error) {
        console.error('Error switching avatar:', error);
        res.status(500).json({ success: false, message: 'Error switching avatar.', error: error.message });
    }
});

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
        return res.status(201).json({ success: true, userID: userID, message: 'User signed up successfully.' });
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
        console.log('Using email for login');
    }else{
        var params = {
            TableName: TABLE_NAME,
            IndexName: 'username', // Using GSI (secondary index)
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            }
        };
        console.log('Using username for login');
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
        return res.status(500).json({ success: 'error', message: 'Error logging in.' });
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

        console.log('User Data: ', data);
    
        // Get today's date in the user's local time zone
        const today = 1 // Format: YYYYMMDD
        // Convert lastLogin to the same format as today
        const lastLogin = parseInt(data.Item.lastLogin);
        console.log(today, lastLogin);

        let firstLogin = false;
        const imageObjects = data.Item.imageObjects || [];

        if (!lastLogin || lastLogin < today) {
            firstLogin = true;
            console.log("First login of the day!");
    
            // Update the last login date in DynamoDB, and delete all imageObjects
            const updateParams = {
                TableName: TABLE_NAME,
                Key: { userID: userID },
                UpdateExpression: "SET lastLogin = :date, imageObjects = :emptyList",
                ExpressionAttributeValues: {
                    ":date": today,
                    ":emptyList": []
                }
            };
            await docClient.update(updateParams);
        }

        let updatedImageObjects;
        if (imageObjects.length > 0 && !firstLogin) {
            // Generate presigned URLs for each image
            updatedImageObjects = await Promise.all(
                imageObjects.map(async (imageObject) => {
                    console.log('Processing image object:', imageObject);
                    if (imageObject.image !== 'https://upload.wikimedia.org/wikipedia/commons/6/63/Icon_Bird_512x512.png') {
                        const getObjectParams = {
                            Bucket: s3_BUCKET_NAME,
                            Key: `${imageObject.key}`,
                        };

                        const presignedUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
                            expiresIn: 3600, // URL expires in 1 hour
                        });
                        console.log(`Generated presigned URL for key ${imageObject.key}: ${presignedUrl}`);

                        imageObject.image = presignedUrl;
                    }
                    return imageObject;
                })
            );
        }
        console.log('Updated Image Objects:', updatedImageObjects);
        
        res.json({ item: { ...data.Item, imageObjects: updatedImageObjects, firstLogin: firstLogin } });
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

app.post('/deleteImages', async (req, res) => {
    const { userID, keys } = req.body;

    if (!userID || !keys) {
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

        // Remove the image objects from the user's imageObjects list
        let imageObjects = data.Item.imageObjects || [];
        imageObjects = imageObjects.filter(obj => !keys.includes(obj.key));

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

        return res.status(200).json({ success: true, message: 'Image object(s) deleted successfully.' });
    } catch (err) {
        console.error('Error deleting image object:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error deleting image object.' });
    }
});

app.post('/saveImages', async (req, res) => {
    const { userID, imageObjects } = req.body;

    if (!userID || !imageObjects) {
        return res.status(400).json({ success: false, message: 'User ID, username, and image objects are required.' });
    }

    try {
        console.log('Saving image objects for user:', userID);
        console.log('Image Objects:', ...imageObjects);
        // Update the user's imageObjects in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
            UpdateExpression: "set imageObjects = :objects",
            ExpressionAttributeValues: {
                ":objects": imageObjects,
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
