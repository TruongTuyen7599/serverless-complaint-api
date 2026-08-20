# 🚀 Async Complaint API - Testing & Demo Guide

**Mục tiêu:** Test full async flow từ create complaint → SNS → SQS → Lambda consumer → update DynamoDB

---

## 📋 Prerequisites

- ✅ Code build thành công (`npm run build` pass)
- ✅ AWS CLI installed & configured
- ✅ 3 terminal windows sẵn sàng

---

## 🎯 STEP 1: Deploy CDK lên AWS

### 1.1 Chạy CDK deploy

```bash
cdk deploy
```

### 1.2 Xác nhận deploy

Khi được hỏi `Do you wish to deploy these changes (y/n)?` → gõ `y`

### 1.3 Chờ deploy hoàn thành

```
✓ ComplaintsApiStack (5/5 done)

Outputs:
ComplaintsApiStack.ApiUrl = https://xxx.execute-api.us-east-1.amazonaws.com/prod/
ComplaintsApiStack.CreateComplaintLogGroup = /aws/lambda/create-complaint
ComplaintsApiStack.ProcessComplaintLogGroup = /aws/lambda/process-complaint
```

**⚠️ COPY API_URL → dùng ở bước sau**

```bash
# Export biến để dùng sau
export API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/prod"
echo $API_URL  # Verify
```

---

## 📊 STEP 2: Setup Monitoring (3 Terminal Windows)

### Terminal 1: Create Complaint Logs

```bash
aws logs tail /aws/lambda/create-complaint --follow
```

**Kỳ vọng output khi create complaint:**
```
[INFO] ✓ Complaint saved to DynamoDB: cmp_abc12345
[INFO] ✓ Event published to SNS: cmp_abc12345
```

### Terminal 2: Process Complaint Logs

```bash
aws logs tail /aws/lambda/process-complaint --follow
```

**Kỳ vọng output khi consumer process:**
```
[INFO] 📨 Received SQS batch with 1 messages
[INFO] 🔄 Processing message: xxx
[INFO]    - ComplaintID: cmp_abc12345
[INFO]    - Category: billing
[INFO] [Async] Status updated: OPEN → PROCESSING
[INFO] ✅ Async processing complete!
[INFO] 📊 Batch complete: 1 success, 0 failed
```

### Terminal 3: Test Commands

Chạy tất cả curl commands ở terminal này

---

## 🧪 STEP 3: Test Full Flow

### Test 3.1: Create Complaint

**Terminal 3:**

```bash
curl -X POST $API_URL/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_demo_001",
    "category": "billing",
    "description": "My monthly bill is incorrect - charged twice"
  }' | jq .
```

**✅ Kỳ vọng response (201):**

```json
{
  "complaintId": "cmp_abc12345",
  "customerId": "cust_demo_001",
  "category": "billing",
  "status": "OPEN",
  "description": "My monthly bill is incorrect - charged twice",
  "createdAt": "2026-08-20T10:30:00.000Z"
}
```

**⚠️ COPY complaintId → dùng ở bước sau**

```bash
export COMPLAINT_ID="cmp_abc12345"  # Replace with your ID
```

**Check Terminal 1 logs:**
- ✅ Logs show: "Complaint saved to DynamoDB"
- ✅ Logs show: "Event published to SNS"

---

### Test 3.2: Wait for Async Processing

Async processing xảy ra trong background:
1. SNS nhận event
2. SNS forward tới SQS queue
3. SQS trigger Lambda consumer
4. Lambda consumer update DynamoDB status → PROCESSING

**Chờ 10 giây:**

```bash
echo "Waiting for async processing..."
sleep 10
echo "Done waiting!"
```

**Check Terminal 2 logs:**
- ✅ Logs show: "Received SQS batch with 1 messages"
- ✅ Logs show: "Status updated: OPEN → PROCESSING"
- ✅ Logs show: "Async processing complete!"

---

### Test 3.3: Get Complaint (Check Status Updated)

**Terminal 3:**

```bash
curl -X GET $API_URL/complaints/$COMPLAINT_ID | jq .
```

**✅ Kỳ vọng response:**

```json
{
  "complaintId": "cmp_abc12345",
  "customerId": "cust_demo_001",
  "category": "billing",
  "status": "PROCESSING",
  "description": "My monthly bill is incorrect - charged twice",
  "createdAt": "2026-08-20T10:30:00.000Z",
  "processedAt": "2026-08-20T10:30:05.000Z"
}
```

**🔍 Verify:**
- ✅ `status` changed from `OPEN` → `PROCESSING`
- ✅ `processedAt` timestamp added
- ✅ Other fields unchanged

---

## 📊 STEP 4: Verify AWS Resources

### 4.1: Check DynamoDB

```bash
# Get table name
TABLE_NAME=$(aws dynamodb list-tables --query "TableNames[0]" --output text)
echo "Table: $TABLE_NAME"

# Scan complaints
aws dynamodb scan \
  --table-name $TABLE_NAME \
  --region us-east-1 | jq '.Items[] | {complaintId, status, processedAt}'
```

**✅ Kỳ vọng:**
```json
{
  "complaintId": { "S": "cmp_abc12345" },
  "status": { "S": "PROCESSING" },
  "processedAt": { "S": "2026-08-20T10:30:05.000Z" }
}
```

### 4.2: Check SNS Topic

```bash
# List SNS topics
aws sns list-topics --region us-east-1 | jq '.Topics[].TopicArn'

# Check topic subscriptions
aws sns list-subscriptions \
  --region us-east-1 \
  --query 'Subscriptions[?contains(TopicArn, `complaint`)]' | jq .
```

**✅ Kỳ vọng:**
- Topic: `arn:aws:sns:us-east-1:xxx:complaint-events`
- Subscription: SQS queue subscribed to this topic

### 4.3: Check SQS Queue

```bash
# Get queue URL
QUEUE_URL=$(aws sqs get-queue-url \
  --queue-name complaint-queue \
  --region us-east-1 \
  --query 'QueueUrl' \
  --output text)

# Check queue attributes
aws sqs get-queue-attributes \
  --queue-url $QUEUE_URL \
  --attribute-names All \
  --region us-east-1 | jq '.Attributes | {ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible}'
```

**✅ Kỳ vọng:**
```json
{
  "ApproximateNumberOfMessages": "0",
  "ApproximateNumberOfMessagesNotVisible": "0"
}
```
(Messages đã được process xong, queue trống)

### 4.4: Check Lambda Event Source Mapping

```bash
# List event source mappings
aws lambda list-event-source-mappings \
  --region us-east-1 \
  --query 'EventSourceMappings[?contains(EventSourceArn, `complaint-queue`)]' | jq '.[] | {UUID, State, BatchSize}'
```

**✅ Kỳ vọng:**
```json
{
  "UUID": "xxx-xxx-xxx",
  "State": "Enabled",
  "BatchSize": 10
}
```

---

## 🎯 STEP 5: Demo Script (cho Lead/Team)

**Tạo file:** `demo.sh`

```bash
#!/bin/bash

set -e

API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/prod"

echo "=========================================="
echo "  Async Complaint API - Full Demo"
echo "=========================================="
echo ""

# Step 1: Create complaint
echo "📝 STEP 1: Creating complaint..."
echo "Request:"
echo '{
  "customerId": "cust_demo_001",
  "category": "billing",
  "description": "Demo complaint for async processing"
}'
echo ""

RESPONSE=$(curl -s -X POST $API_URL/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_demo_001",
    "category": "billing",
    "description": "Demo complaint for async processing"
  }')

echo "Response:"
echo $RESPONSE | jq .
echo ""

COMPLAINT_ID=$(echo $RESPONSE | jq -r '.complaintId')
echo "✅ Complaint created: $COMPLAINT_ID"
echo "   Initial status: OPEN"
echo ""

# Step 2: Check logs
echo "🔄 STEP 2: Async processing happening in background..."
echo "   - SNS topic published event"
echo "   - SQS queue received message"
echo "   - Lambda consumer triggered"
echo "   - DynamoDB status updating..."
echo ""

sleep 12

echo "📊 STEP 3: Checking status after async processing..."
echo ""

# Step 3: Get updated complaint
UPDATED=$(curl -s -X GET $API_URL/complaints/$COMPLAINT_ID)
echo "Response:"
echo $UPDATED | jq .
echo ""

STATUS=$(echo $UPDATED | jq -r '.status')
PROCESSED_AT=$(echo $UPDATED | jq -r '.processedAt // "null"')

echo "✅ Result:"
echo "   Status: $STATUS (changed from OPEN → PROCESSING)"
echo "   ProcessedAt: $PROCESSED_AT"
echo ""

if [ "$STATUS" = "PROCESSING" ] && [ "$PROCESSED_AT" != "null" ]; then
  echo "✅✅✅ ASYNC FLOW WORKING PERFECTLY! ✅✅✅"
else
  echo "❌ Something went wrong"
  exit 1
fi
```

**Chạy demo:**

```bash
chmod +x demo.sh
./demo.sh
```

---

## 🔍 STEP 6: Troubleshooting

### ❌ Lambda not triggering (logs empty)

**Check 1: Event source mapping**

```bash
aws lambda list-event-source-mappings \
  --region us-east-1 \
  --query 'EventSourceMappings[?contains(EventSourceArn, `complaint-queue`)]'
```

**Expected:** `State: "Enabled"`

**Fix if disabled:**

```bash
MAPPING_UUID=$(aws lambda list-event-source-mappings \
  --region us-east-1 \
  --query 'EventSourceMappings[?contains(EventSourceArn, `complaint-queue`)].UUID' \
  --output text)

aws lambda update-event-source-mapping \
  --uuid $MAPPING_UUID \
  --state Enabled
```

**Check 2: SQS DLQ (Dead Letter Queue)**

```bash
# Check DLQ messages
aws sqs receive-message \
  --queue-url <dlq-url> \
  --region us-east-1 | jq .
```

If messages in DLQ → Lambda failed, check Lambda logs for error

### ❌ Logs show but no DynamoDB update

```bash
# Check Lambda IAM permissions
aws iam list-role-policies --role-name <lambda-role>

# Should include: DynamoDBWriteDataPolicy
```

### ❌ "Cannot find module '@aws-sdk/client-sns'"

```bash
npm install @aws-sdk/client-sns
npm run build
cdk deploy
```

---

## 📈 STEP 7: Monitor with CloudWatch

### View all Lambda logs

```bash
# Create Complaint logs
aws logs tail /aws/lambda/create-complaint --follow --since 1h

# Process Complaint logs
aws logs tail /aws/lambda/process-complaint --follow --since 1h
```

### Filter specific complaint

```bash
COMPLAINT_ID="cmp_abc12345"

# Find in create logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/create-complaint \
  --filter-pattern "$COMPLAINT_ID"

# Find in process logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/process-complaint \
  --filter-pattern "$COMPLAINT_ID"
```

---

## ✅ STEP 8: Verify Complete Flow

Checklist to verify everything works:

- [ ] `cdk deploy` completed successfully
- [ ] Terminal 1 shows create-complaint logs
- [ ] Terminal 2 shows process-complaint logs
- [ ] POST /complaints returns 201 with complaintId
- [ ] Terminal 1 logs show "Event published to SNS"
- [ ] After 10 seconds, Terminal 2 logs show processing
- [ ] GET /complaints/{id} shows status = PROCESSING
- [ ] DynamoDB scan shows processedAt timestamp
- [ ] SQS queue is empty (messages processed)

---

## 🎓 Summary of Async Flow

```
1. API Request
   POST /complaints → 201 response (FAST - 0.5s)
   ✓ User gets response immediately

2. Background Processing
   ├─ SNS Topic receives event
   ├─ SQS Queue stores message
   ├─ Lambda Consumer triggered
   ├─ DynamoDB updated (status: PROCESSING)
   └─ Done! (5-10s later)

3. Verification
   GET /complaints/{id} → status = PROCESSING
   ✓ Shows async work completed
```

---

## 🚀 Next Steps (Optional Enhancements)

- Add email notification in `processComplaint()`
- Add CloudWatch metrics/alarms
- Create Lambda for different categories (billing, technical, service)
- Add API logging to CloudWatch Insights
- Setup SNS email subscription (get notifications)

---

**Good luck with testing! 🎉**
