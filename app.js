const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const path = require('path');
const { DynamoDB, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { AWS, S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3'); // AWS SDK v3
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { NovitaSDK } = require("novita-sdk");
const { convertImageToBase64 } = require("./utils.js");
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

// Generate Avatar Image
async function img2img(onFinish) {
  const baseImg = await convertImageToBase64(path.join(__dirname, "test.png"));
  const params = {
    request: {
      model_name: "majicmixRealistic_v7_134792.safetensors",
      image_base64: baseImg,
      prompt: "1girl,sweater,white background",
      negative_prompt: "(worst quality:2),(low quality:2),(normal quality:2),lowres,watermark,",
      width: 512,
      height: 768,
      sampler_name: "Euler a",
      guidance_scale: 7,
      steps: 20,
      image_num: 1,
      seed: -1,
      strength: 0.5,
    },
  };
  novitaClient
    .img2Img(params)
    .then((res) => {
      if (res && res.task_id) {
        const timer = setInterval(() => {
          novitaClient
            .progress({
              task_id: res.task_id,
            })
            .then((progressRes) => {
              if (progressRes.task.status === TaskStatus.SUCCEED) {
                console.log("finished!", progressRes.images);
                clearInterval(timer);
                onFinish(progressRes.images);
              }
              if (progressRes.task.status === TaskStatus.FAILED) {
                console.warn("failed!", progressRes.task.reason);
                clearInterval(timer);
              }
              if (progressRes.task.status === TaskStatus.QUEUED) {
                console.log("queueing");
              }
            })
            .catch((err) => {
              console.error("progress error:", err);
            });
        }, 1000);
      }
    })
    .catch((err) => {
      console.error("img2Img error:", err);
    });
}

// img2img((imgs) => {
//   console.log(imgs);
// });

// Generate Avatar Image
app.get("/getAvatarUrl", async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ success: false, message: "Missing username" });

    try {
        const command = new GetObjectCommand({
            Bucket: "avatargenerationimages",
            Key: `users/${username}/avatar.png`
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ success: true, url: signedUrl });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ success: false, message: "Failed to generate signed URL" });
    }
});

// Get Avatar URL
app.get("/getAvatarUrl", async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ success: false, message: "Missing username" });

    try {
        const command = new GetObjectCommand({
            Bucket: "avatargenerationimages",
            Key: `users/${username}/avatar.png`
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ success: true, url: signedUrl });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ success: false, message: "Failed to generate signed URL" });
    }
});

// Upload Avatar Image to S3
app.post('/uploadAvatar', upload.single('image'), async (req, res) => {
    console.log('Received file:', req.file);  // Debugging output
    console.log('Received username:', req.body.username);

    const { username } = req.body;
    const file = req.file;

    if (!username || !file) {
        return res.status(400).json({ success: false, message: 'Missing username or file' });
    }

    try {
        const s3Key = `users/${username}/avatar.png`;

        // Upload the avatar to S3
        const uploadParams = new PutObjectCommand({
            Bucket: s3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3.send(uploadParams);

        // Generate a pre-signed URL for securely accessing the uploaded avatar
        const url = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: s3_BUCKET_NAME,
            Key: s3Key
        }), { expiresIn: 3600 }); // URL expires in 1 hour

        res.json({ success: true, url });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Generate superhero avatar using Stability AI
app.post('/generateSuperheroAvatar', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'Missing username' });

    try {
        const prompt = `Generate a superhero avatar for ${username} in a comic book style with a dynamic pose.`;
        
        const stabilityAIResponse = await axios.post('https://api.stability.ai/v2beta/generate/core', {
            model: 'stable-diffusion-xl',
            prompt: prompt,
            output_format: 'png'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(stabilityAIResponse.data));
    } catch (error) {
        console.error('Error generating avatar:', error);
        res.status(500).json({ success: false, message: 'Avatar generation failed' });
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
            text: `Here is your password ${username}: ${password} \nDon't forget it this time! :)`,
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
                imageUrls: [],
                imageDescriptions: []
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
    console.log(userID);

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
        console.log('User Data: ', data);

        // Get today's date in the user's local time zone
        const today = parseInt(new Date().toLocaleDateString('en-CA').replace(/-/g, '')); // Format: YYYYMMDD
        // Convert lastLogin to the same format as today
        const lastLogin = parseInt(data.Item.lastLogin);

        let firstLogin = false;
        console.log(today, lastLogin);
        if (!lastLogin || lastLogin < today) {
            firstLogin = true;
            console.log("First login of the day!");

            // Update the last login date in DynamoDB
            const updateParams = {
                TableName: TABLE_NAME,
                Key: { userID: userID },
                UpdateExpression: "SET lastLogin = :date",
                ExpressionAttributeValues: {
                    ":date": today
                }
            };
            await docClient.update(updateParams);
        }

        res.json({ item: data.Item, firstLogin: firstLogin });

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
    const { userID, imageUrl, imageDescription } = req.body;

    if (!userID || !imageUrl || !imageDescription) {
        return res.status(400).json({ success: false, message: 'User ID and image are required.' });
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

        // Remove the image URL from the user's imageUrls list
        const imageUrls = data.Item.imageUrls;
        const updatedImageUrls = imageUrls.filter(url => !imageUrl.includes(url));

        let imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions')) || [];
        updatedImageDescriptions = imageDescriptions.filter(description => description !== imageDescription);

        // Update the user's data in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
            UpdateExpression: "set imageUrls = :urls, imageDescriptions = :descriptions",
            ExpressionAttributeValues: {
                ":urls": updatedImageUrls,
                ":descriptions": updatedImageDescriptions
            },
            ReturnValues: "UPDATED_NEW"
        };

        await docClient.update(updateParams);

        return res.status(200).json({ success: true, message: 'Image removed successfully.' });
    } catch (err) {
        console.error('Error deleting image URL:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error image URL.' });
    }
});

app.get('/get-api-key', (req, res) => {
    const apiKey = process.env.NOVITA_KEY;
    res.json({ apiKey });
});

app.post('/save-image-s3', async (req, res) => {
    const { imageUrl } = req.body;

    try {
        // Download the image from the temporary URL
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Generate a unique filename
        const imageFileName = `comic_image_${Date.now()}.png`;

        // S3 upload parameters
        const s3Params = {
            Bucket: 'novitacomicbookimages',
            Key: imageFileName,
            Body: imageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read'
        };

        // Upload image to S3 using AWS SDK v3
        const command = new PutObjectCommand(s3Params);
        const data = await s3.send(command);

        // Return the S3 URL back to the frontend
        const s3ImageUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;
        res.json({ success: true, s3ImageUrl });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Image upload failed" });
    }
});

app.post('/saveImage', async (req, res) => {
    const { userID, updatedImageUrls, updatedImageDescriptions } = req.body;

    if (!userID || !updatedImageUrls || !updatedImageDescriptions) {
        return res.status(400).json({ success: false, message: `User ID and image are required: userID: ${userID}, image Urls: ${updatedImageUrls}, image descriptions: ${imageDescriptions}` });
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

        // Update the user's data in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: { userID: userID },
            UpdateExpression: "set imageUrls = :urls, imageDescriptions = :descriptions",
            ExpressionAttributeValues: {
                ":urls": updatedImageUrls,
                ":descriptions": updatedImageDescriptions
            },
            ReturnValues: "UPDATED_NEW"
        };

        await docClient.update(updateParams);

        return res.status(200).json({ success: true, message: 'Image URLs saved successfully.' });
    } catch (err) {
        console.error('Error deleting image URL:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error saving image URLs.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
