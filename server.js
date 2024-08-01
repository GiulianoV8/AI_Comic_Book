const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();
const PORT = 3001;

AWS.config.update({
    region: 'us-east-1' // Replace with your region
    // Use environment variables or AWS CLI configuration for credentials
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ComicUsers';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the root URL to serve login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Signup request body:', req.body); // Log the request body for debugging
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = {
        TableName: TABLE_NAME,
        Item: {
            userID: username,
            email: email,
            password: password
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
