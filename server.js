const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();
const PORT = 3000;

AWS.config.update({
    region: 'us-east-1', // replace with your region
    accessKeyId: 'your-access-key-id', // replace with your access key ID
    secretAccessKey: 'your-secret-access-key' // replace with your secret access key
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'users';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.json({ success: false, message: 'All fields are required.' });
    }

    const user = {
        TableName: TABLE_NAME,
        Item: {
            userId: username,
            email: email,
            password: password
        }
    };

    docClient.put(user, (err, data) => {
        if (err) {
            console.error('Error adding user:', JSON.stringify(err, null, 2));
            return res.json({ success: false, message: 'Error signing up.' });
        } else {
            return res.json({ success: true, message: 'User signed up successfully.' });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password are required.' });
    }

    const params = {
        TableName: TABLE_NAME,
        Key: {
            userId: username
        }
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error('Error logging in:', JSON.stringify(err, null, 2));
            return res.json({ success: false, message: 'Error logging in.' });
        } else {
            if (data.Item && data.Item.password === password) {
                return res.json({ success: true });
            } else {
                return res.json({ success: false, message: 'Invalid username or password.' });
            }
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
