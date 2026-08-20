import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || 'Complaints';

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const complaintId = event.pathParameters?.id;

    if (!complaintId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'complaintId is required' }),
      };
    }

    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ complaintId }),
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Complaint not found' }),
      };
    }

    const complaint = unmarshall(result.Item);
    console.log('Complaint found:', complaint);

    return {
      statusCode: 200,
      body: JSON.stringify(complaint),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
