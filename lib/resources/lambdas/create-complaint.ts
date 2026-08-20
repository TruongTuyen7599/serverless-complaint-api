import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});

const VALID_CATEGORIES = ['billing', 'technical', 'service'];
const TABLE_NAME = process.env.TABLE_NAME || 'Complaints';

interface CreateComplaintRequest {
  customerId?: string;
  category?: string;
  description?: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: CreateComplaintRequest =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    if (!body.customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'customerId is required' }),
      };
    }

    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        }),
      };
    }

    if (!body.description || body.description.length > 1000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'description is required and max 1000 characters',
        }),
      };
    }

    const complaintId = `cmp_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const complaint = {
      complaintId,
      customerId: body.customerId,
      category: body.category,
      status: 'OPEN',
      description: body.description,
      createdAt: now,
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(complaint),
    });

    await dynamoClient.send(command);

    console.log('Complaint created:', complaint);

    return {
      statusCode: 201,
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
