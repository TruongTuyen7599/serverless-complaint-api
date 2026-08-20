# Week 1 Check Progress — Serverless Complaint API

**Deadline:** Thứ 6 trước 17:00 (còn ~36 giờ)  
**Lead Review:** Cần demo trực tiếp 4 tiêu chí dưới

---

## ✅ CHECKPOINT 1: End-to-end complaint creation flow
- [ ] Lambda Create API hoạt động (validate + ghi DynamoDB)
- [ ] Test POST /complaints → nhận complaintId
- [ ] Verify item tồn tại trong DynamoDB
- [ ] **Ghi chú:**

---

## ✅ CHECKPOINT 2: Infrastructure deployed via CDK
- [ ] CDK Stack định nghĩa DynamoDB table (PK + 2 GSI)
- [ ] CDK Stack định nghĩa SQS queue + DLQ
- [ ] CDK Stack định nghĩa SNS topic + subscription
- [ ] `cdk deploy` chạy thành công (no manual console clicks)
- [ ] **Ghi chú:**

---

## ✅ CHECKPOINT 3: Async processing with SQS
- [ ] Lambda Create publish event → SNS
- [ ] SNS fan-out → SQS queue
- [ ] Lambda Consumer consume message từ SQS
- [ ] Demo được full flow: Create → SNS → SQS → Consumer xử lý
- [ ] DLQ có message nếu Consumer fail (optional nhưng tốt)
- [ ] **Ghi chú:**

---

## ✅ CHECKPOINT 4: Basic CloudWatch logs available
- [ ] Lambda Create output logs (có customerId, complaintId, validation)
- [ ] Lambda Consumer output logs (có message details, processing status)
- [ ] Log format consistent, dễ đọc (structured logging tốt hơn)
- [ ] **Ghi chú:**

---

## 📋 OPTIONAL (lùi sang tuần 2 nếu thiếu thời gian)
- [ ] Data Modeling: GSI1 (customerId) + GSI2 (status)
- [ ] GET /complaints/{id} API
- [ ] GET /complaints?customerId=X&status=Y (List with filtering)

---

## 📝 DAILY LOG

### Thứ 5 (Hôm nay)
**Target:** Setup hạ tầng nền, AWS account ready

- [ ] AWS account personal setup xong
- [ ] AWS CLI configured
- [ ] CDK bootstrap done
- [ ] Database Stack (DynamoDB + GSI) deployed
- [ ] SQS queue + DLQ deployed
- [ ] SNS topic created + subscribed to SQS
- **Ghi chú:**

### Thứ 6 (Ngày mai)
**Target:** Lambda functions + demo ready

- [ ] Lambda Create code viết xong
- [ ] Lambda Create test OK (POST /complaints → DynamoDB)
- [ ] API Gateway setup (REST endpoint)
- [ ] Lambda Consumer code viết xong
- [ ] Full flow test: Create → SNS → SQS → Consumer
- [ ] CloudWatch logs configured + readable
- **Ghi chú:**

---

## 🎯 Demo Script (Thứ 6 trước review)

```
1. Open AWS Console → CloudFormation → Show stack deployed
2. Open DynamoDB → Show Complaints table + 2 GSIs
3. Run: curl -X POST http://localhost:3000/complaints \
   -d '{"customerId":"cust_123","category":"billing","description":"..."}' \
   → Show complaintId returned
4. Show DynamoDB → Item vừa tạo tồn tại
5. Tail CloudWatch Logs → Show Lambda Create logs
6. Wait 10s → Show SQS queue → message consumed
7. Show CloudWatch Logs → Lambda Consumer logs
```

---

**Hãy update mục "Ghi chú" mỗi khi hoàn thành 1 phần!** ✍️
