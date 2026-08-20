# 🎯 ROADMAP: Tạo Serverless Complaint API (Week 1)

**Deadline:** Thứ 6 trước 17:00 để demo cho lead  
**Checkpoint:** 4 tiêu chí (end-to-end flow, CDK infra, async SQS, CloudWatch logs)

---

## **THỨ 5 (Hôm nay) - CODE + LOCAL TEST**

### Bước 1: Code Lambda Functions (4 files)
- [ ] `lib/resources/lambdas/create-complaint.ts` — Handler nhận request, validate, ghi DynamoDB
- [ ] `lib/resources/lambdas/get-complaint.ts` — Handler nhận complaintId, query DynamoDB, trả kết quả
- [ ] `lib/resources/lambdas/list-complaints.ts` — Handler nhận query params, query GSI, trả danh sách
- [ ] `lib/resources/types/complaint.ts` — TypeScript interfaces

**Làm sao biết đúng hay sai?** → `npm run build` (TypeScript compile check)

---

### Bước 2: Unit Test Lambda Functions
- [ ] Setup Jest: `npm install --save-dev jest @types/jest ts-jest`
- [ ] Tạo folder: `mkdir -p tests`
- [ ] Viết test cho mỗi Lambda (validation cases, error cases)
- [ ] Chạy: `npm test` → Tất cả test pass ✅

**Làm sao biết đúng hay sai?** → Test kết quả (pass/fail)

---

### Bước 3: Tạo CDK Stacks (Infrastructure as Code)
- [ ] `lib/stacks/database-stack.ts` — DynamoDB table + 2 GSI
- [ ] `lib/stacks/event-stack.ts` — SNS topic + SQS queue + DLQ
- [ ] Update `bin/serverless-complaint-api.ts` — Import stacks

**Làm sao biết đúng hay sai?** → `cdk synth` (generate CloudFormation template)

---

### Bước 4: Commit + Push (End of Thứ 5)
```bash
git add .
git commit -m "Complete Lambda functions + CDK infrastructure stacks"
git push origin claude/cdk-project-from-scratch-70tjw3
```

**Status:** Code xong, chưa deploy AWS

---

## **THỨ 6 (Ngày mai) - DEPLOY + DEMO**

### Bước 5: Setup AWS Account (30 phút)
- [ ] Có AWS account cá nhân (bạn có rồi chứ?)
- [ ] Chạy: `aws configure` → Nhập credentials
- [ ] Chạy: `cdk bootstrap` → Chuẩn bị AWS account cho CDK

**Làm sao biết đúng?** → Lệnh chạy xong không lỗi

---

### Bước 6: Deploy CDK lên AWS (1 giờ)
- [ ] Chạy: `cdk deploy` → Tạo DynamoDB + SNS + SQS trên AWS
- [ ] Kiểm tra AWS Console → Xem resources được tạo

**Làm sao biết đúng?** → CloudFormation stack hiển thị "CREATE_COMPLETE"

---

### Bước 7: Tạo API Gateway Stack + Wire Lambda
- [ ] `lib/stacks/api-stack.ts` — REST API Gateway + 3 Lambda functions
- [ ] Update `bin/serverless-complaint-api.ts` — Import API stack
- [ ] Chạy: `cdk deploy` lần 2 → Tạo API endpoint

**Làm sao biết đúng?** → API Gateway URL hiển thị ở terminal

---

### Bước 8: Chỉnh sửa Lambda để gọi DynamoDB + SNS/SQS (2 giờ)
- [ ] `create-complaint.ts` — Thêm logic publish SNS event
- [ ] `get-complaint.ts` — Query DynamoDB theo complaintId
- [ ] `list-complaints.ts` — Query DynamoDB theo GSI
- [ ] Tạo `lambda-consumer.ts` — Consume SQS message, xử lý

**Làm sao biết đúng?** → Deploy + test API, xem CloudWatch logs

---

### Bước 9: Test Full Flow (1 giờ)
```bash
# Terminal 1: Tail logs
aws logs tail /aws/lambda/create-complaint --follow

# Terminal 2: Test API
curl -X POST https://<API-ID>.execute-api.us-east-1.amazonaws.com/prod/complaints \
  -d '{"customerId":"cust_123","category":"billing","description":"..."}'

# Kiểm tra:
# 1. ✅ Lambda Create logs: validation passed, item created
# 2. ✅ DynamoDB Console: item tồn tại
# 3. ✅ SNS topic: event published
# 4. ✅ SQS queue: message received
# 5. ✅ Lambda Consumer: processed message
# 6. ✅ CloudWatch logs: consumer logs hiển thị
```

**Làm sao biết đúng?** → Trace từ Create → DynamoDB → SNS → SQS → Consumer → Logs

---

### Bước 10: Commit + Demo cho Lead (30 phút)
```bash
git add .
git commit -m "Complete full serverless complaint API with CDK deployment"
git push origin claude/cdk-project-from-scratch-70tjw3
```

**Demo script cho lead:**
1. Show CDK code (chứng minh infrastructure-as-code)
2. Run: `curl` → Create complaint
3. Show DynamoDB: item vừa tạo
4. Show CloudWatch logs: Lambda logs
5. Show SQS: message được consume
6. Show Consumer logs: processing success

---

## **SUMMARY**

| Bước | Gì | Làm sao biết đúng? | Thứ gì |
|------|------|---------|--------|
| 1-2 | Code + test Lambda | `npm test` pass | Thứ 5 |
| 3-4 | Tạo CDK + push | `cdk synth` pass | Thứ 5 |
| 5-7 | Deploy AWS | CloudFormation pass | Thứ 6 sáng |
| 8-9 | Test full flow | API + logs work | Thứ 6 chiều |
| 10 | Demo + push | Lead sees it working | Thứ 6 chiều |

---

**Bây giờ rõ ràng chưa?** ✅

