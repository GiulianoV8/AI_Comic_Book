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
const ddb = new AWS.DynamoDB();
const TABLE_NAME = 'ComicUsers';
const COUNTER_TABLE_NAME = 'UserIDCounter';

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

// Define a route for the root URL to serve starting page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/signup', async (req, res) => {
    const { username, email, password, attributes, comicTitle, timeZone } = req.body;
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
                timeZone: timeZone,
                imageUrls: []
            }
        };

        await docClient.put(user).promise();
        return res.status(201).json({ success: true, message: 'User signed up successfully.' });
    } catch (err) {
        console.error('Error adding user:', JSON.stringify(err, null, 2));
        return res.status(500).json({ success: false, message: 'Error signing up.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request body:', req.body); // Log the request body for debugging
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const params = {
        TableName: TABLE_NAME,
        IndexName: 'username', // Using GSI (secondary index)
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        }
    };

    try {
        const data = await docClient.query(params).promise();
        if (data.Items.length > 0 && data.Items[0].password === password) {
            return res.status(200).json({ success: true });
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
        Key: { userID: userID }
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
        await docClient.update(params).promise();
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
        await docClient.update(params).promise();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});