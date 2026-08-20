# API Contract — Complaint Management System

## POST /complaints
Creates a new complaint.

**Request body**
```json
{
  "customerId": "string, required",
  "category": "string, required (billing | technical | service)",
  "description": "string, required, max 1000 characters"
}
```

**Response 201 Created**
```json
{
  "complaintId": "string",
  "customerId": "string",
  "category": "string",
  "status": "OPEN",
  "description": "string",
  "createdAt": "ISO 8601 timestamp"
}
```

**Response 400 Bad Request**
```json
{
  "error": "string describing the validation error"
}
```

---

## GET /complaints/{id}
Retrieves a single complaint by id.

**Path parameter**
- `id` — string, required, the `complaintId`

**Response 200 OK**
```json
{
  "complaintId": "string",
  "customerId": "string",
  "category": "string",
  "status": "OPEN | IN_PROGRESS | RESOLVED | CLOSED",
  "description": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Response 404 Not Found**
```json
{
  "error": "Complaint not found"
}
```

---

## GET /complaints
Lists complaints, with filtering support.

**Query parameters** (all optional)
- `customerId` — string, filter by customer
- `status` — string, filter by status (`OPEN | IN_PROGRESS | RESOLVED | CLOSED`)
- `limit` — number, default 20
- `nextToken` — string, used for pagination (returned from the previous response)

**Response 200 OK**
```json
{
  "items": [
    {
      "complaintId": "string",
      "customerId": "string",
      "category": "string",
      "status": "string",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "nextToken": "string, or null if there is no more data"
}
```

**Response 400 Bad Request**
```json
{
  "error": "string describing the error (e.g. invalid status value)"
}
```

---
