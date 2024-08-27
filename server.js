const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
require('dotenv').config();

// Set up session handling
app.use(session({
    secret: process.env.SESSION_SECRET, // Use environment variable for session secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set up the cookie parser
app.use(cookieParser());

// Set up CSRF protection
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 3600000 // 1 hour
    }
});
app.use(csrfProtection);

// AWS configuration
AWS.config.update({
    region: 'us-east-1'
    // Use environment variables or AWS CLI configuration for credentials
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ComicUsers';
const COUNTER_TABLE_NAME = 'UserIDCounter';

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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

    const result = await docClient.update(params).promise();
    return result.Attributes.userID;
}

// Route for the root URL to serve the starting page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for signup
app.post('/signup', async (req, res) => {
    const { username, email, password, attributes, comicTitle, lastLogin } = req.body;
    console.log('Signup request body:', req.body);
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

        await docClient.put(user).promise();
        return res.status(201).json({ success: true, message: 'User signed up successfully.' });
    } catch (err) {
        console.error('Error adding user:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error signing up.' });
    }
});

// Route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request body:', req.body);
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const params = {
        TableName: TABLE_NAME,
        IndexName: 'username',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        }
    };

    try {
        const data = await docClient.query(params).promise();
        const passwordBuffer = Buffer.from(password);
        const storedPasswordBuffer = Buffer.from(data.Items[0].password);

        if (data.Items.length > 0 && passwordBuffer.length === storedPasswordBuffer.length && crypto.timingSafeEqual(passwordBuffer, storedPasswordBuffer)) {
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

// Route to get user data
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
        const data = await docClient.get(params).promise();
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
            await docClient.update(updateParams).promise();
        }

        res.json({ item: data.Item, firstLogin: firstLogin });

    } catch (error) {
        console.error('Error fetching data from DynamoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to set comic title
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
        await docClient.update(params).promise();
        res.status(200).json({ message: 'Comic title updated successfully' });
    } catch (err) {
        console.log('Error setting comicTitle: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get user attributes
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
        const data = await docClient.get(params).promise();
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

// Route to edit attributes
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
        await docClient.update(params).promise();
        res.status(200).json({ message: 'Attributes updated successfully' });
    } catch (err) {
        console.log('Error updating attributes: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to change username
app.post('/changeUsername', async (req, res) => {
    const { userID, newUsername } = req.body;

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set username = :newUsername',
        ExpressionAttributeValues: { ':newUsername': newUsername }
    };

    try {
        await docClient.update(params).promise();
        res.status(200).json({ message: 'Username updated successfully' });
    } catch (error) {
        console.log('Error changing username: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to change password
app.post('/changePassword', async (req, res) => {
    const { userID, newPassword } = req.body;

    const params = {
        TableName: TABLE_NAME,
        Key: { userID: userID },
        UpdateExpression: 'set password = :newPassword',
        ExpressionAttributeValues: { ':newPassword': newPassword }
    };

    try {
        await docClient.update(params).promise();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.log('Error changing password: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to logout
app.post('/logout', (req, res) => {
    res.clearCookie('csrfToken');
    res.status(200).json({ message: 'Logged out successfully' });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
