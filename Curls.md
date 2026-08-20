# POST - Create complaint
curl -X POST https://0wada47z2h.execute-api.us-east-1.amazonaws.com/prod/complaints \
  -d '{"customerId":"user_1","category":"technical","description":"test"}' \
  -H "Content-Type: application/json"

# GET - Get complaint by ID
curl https://0wada47z2h.execute-api.us-east-1.amazonaws.com/prod/complaints/

export API_URL="https://0wada47z2h.execute-api.us-east-1.amazonaws.com/prod/"


aws sqs receive-message \
  --queue-url "https://sqs.us-east-1.amazonaws.com/668399498460/complaint-dlq" \
  --max-number-of-messages 10 \
  --region us-east-1
