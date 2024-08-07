const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();
const PORT = 3001;

AWS.config.update({
    region: 'us-east-1'
    // Use environment variables or AWS CLI configuration for credentials
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ComicUsers';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the root URL to serve starting page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/signup', (req, res) => {
    const { username, email, password, attributes, comicTitle, timeZone} = req.body;
    console.log('Signup request body:', req.body); // Log the request body for debugging
    if (!username || !email || !password || !attributes) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = {
        TableName: TABLE_NAME,
        Item: {
            userID: username,
            email: email,
            password: password,
            attributes: attributes,
            comicTitle: comicTitle,
            timeZone: timeZone,
            imageUrls: []
        }
    };

    docClient.put(user, (err, data) => {
        if (err) {
            console.error('Error adding user:', JSON.stringify(err, null, 2));
            return res.status(500).json({ success: false, message: 'Error signing up.' });
        } else {
            return res.status(201).json({ success: true, message: 'User signed up successfully.' });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login request body:', req.body); // Log the request body for debugging
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: {
            userID: username
        }
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error('Error logging in:', JSON.stringify(err, null, 2));
            return res.status(500).json({ success: false, message: 'Error logging in.' });
        } else {
            if (data.Item && data.Item.password === password) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid username or password.' });
            }
        }
    });
});

app.get('/getUserData', async (req, res) => {
    const userID = req.query.userID;

    if (!userID) {
        return res.status(400).json({ error: 'Missing userID parameter' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: {
            userID: userID
        }
    };

    try {
        const data = await docClient.get(params).promise();
        if (!data.Item) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(data.Item);
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
        Key: {
            userID: userID
        },
        UpdateExpression: 'set comicTitle = :comicTitle',
        ExpressionAttributeValues: {
            ':comicTitle': comicTitle
        }
    };

    try {
        const data = await docClient.update(params).promise();
        console.log(data);
        res.status(200).json({ message: 'Comic title updated successfully' });
    } catch (err) {
        console.log('Error setting comicTitle: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});