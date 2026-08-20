# POST - Create complaint
curl -X POST https://0wada47z2h.execute-api.us-east-1.amazonaws.com/prod/complaints \
  -d '{"customerId":"user_1","category":"billing","description":"test"}' \
  -H "Content-Type: application/json"

# GET - Get complaint by ID
curl https://0wada47z2h.execute-api.us-east-1.amazonaws.com/prod/complaints/cmp_abc123