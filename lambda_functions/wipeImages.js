const AWS = require('aws-sdk');
const docClient = new AWS.docClient.DocumentClient();
const moment = require('moment-timezone');

const TABLE_NAME = 'ComicUsers';

exports.handler = async (event) => {
    try {
        // Scan the table to get all users
        const params = {
            TableName: TABLE_NAME
        };
        const data = await docClient.scan(params).promise();

        const currentTime = moment.utc(); // Current time in UTC

        // Process each user
        for (const user of data.Items) {
            const userTimeZone = user.timeZone;
            const userTime = currentTime.clone().tz(userTimeZone);

            // Check if it's midnight in the user's time zone
            if (userTime.hour() === 0 && userTime.minute() === 0) {
                // Wipe the image list
                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { userId: user.userId },
                    UpdateExpression: 'set imageUrls = :emptyList',
                    ExpressionAttributeValues: {
                        ':emptyList': []
                    }
                };
                await docClient.update(updateParams).promise();
            }
        }

        return { statusCode: 200, body: 'Image lists updated successfully' };
    } catch (error) {
        console.error('Error updating image lists:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
