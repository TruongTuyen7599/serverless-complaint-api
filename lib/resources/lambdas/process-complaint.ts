import { SQSBatchResponse, SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || "Complaints";

// Message structure SNS/SQS
interface ComplaintMessage {
  complaintId: string;
  customerId: string;
  category: string;
  description: string;
  createdAt: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("📨 Received SQS batch with", event.Records.length, "messages");

  const failedMessageIds: string[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const record of event.Records) {
    try {
      // Get retry attempt count from SQS attributes
      const retryAttempt = parseInt(
        record.attributes.ApproximateReceiveCount || "1",
        10
      );

      console.log(`\n🔄 Processing message: ${record.messageId}`);
      console.log(`   📊 Retry attempt: ${retryAttempt}/3`);

      const sqsBody = JSON.parse(record.body);
      const snsMessage = JSON.parse(sqsBody.Message);
      const complaint = snsMessage as ComplaintMessage;
      console.log(`   - ComplaintID: ${complaint.complaintId}`);
      console.log(`   - Category: ${complaint.category}`);
      if (complaint.category === "technical") {
        console.error(`❌ SIMULATED FAILURE (attempt ${retryAttempt}/3) - Testing DLQ`);
        failedMessageIds.push(record.messageId);
        failCount++;
        continue; // ← Skip processing, move to next message
      }
      await processComplaint(complaint);

      successCount++;
      console.log(`✅ Success: ${complaint.complaintId}`);
    } catch (error) {
      failCount++;
      failedMessageIds.push(record.messageId);
      console.error(`❌ Error processing ${record.messageId}:`, error);
    }
  }

  console.log(
    `\n📊 Batch complete: ${successCount} success, ${failCount} failed`,
  );

  // Return failed message IDs
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemId: id })),
  } as any;
};

async function processComplaint(complaint: ComplaintMessage): Promise<void> {
  console.log(`   [Async] Starting process...`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Update DynamoDB: change status from OPEN → PROCESSING
  const updateCommand = new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ complaintId: complaint.complaintId }),
    UpdateExpression: "SET #status = :status, #processedAt = :processedAt",
    ExpressionAttributeNames: {
      "#status": "status",
      "#processedAt": "processedAt",
    },
    ExpressionAttributeValues: marshall({
      ":status": "PROCESSING",
      ":processedAt": new Date().toISOString(),
    }),
  });

  await dynamoClient.send(updateCommand);
  console.log(`   [Async] Status updated: OPEN → PROCESSING`);

  if (complaint.category === "billing") {
    console.log(`   📧 [Billing] Sending email to billing team...`);
    // await sendEmailToBillingTeam(complaint);
  } else if (complaint.category === "technical") {
    console.log(`   🎫 [Technical] Creating support ticket...`);
    // await createSupportTicket(complaint);
  }

  console.log(`   ✅ Async processing complete!`);
}
