const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

const path = require('path');
const { DynamoDB, QueryCommand } = require('@aws-sdk/client-dynamodb');

const app = express();
const PORT = process.env.PORT || 3000;

// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.update({
    region: 'us-east-1'
});

const docClient = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = 'ComicUsers';
const COUNTER_TABLE_NAME = 'UserIDCounter';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

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
    const { username, newEmail } = req.body;

    const emailParams = {
        TableName: 'ComicUsers',
        IndexName: 'email',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': newEmail
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
        
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = data.Item.lastLogin;
        let firstLogin = false;
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
