# DynamoDB Schema — Complaint Management System

## Main table: `Complaints`

| Attribute     | Role          | Type              | Example                |
| ------------- | ------------- | ----------------- | ---------------------- |
| `complaintId` | Partition key | String            | `cmp_8f3a2b`           |
| `customerId`  | —             | String            | `cust_1029`            |
| `category`    | —             | String            | `billing`              |
| `status`      | —             | String            | `OPEN`                 |
| `description` | —             | String            | —                      |
| `createdAt`   | —             | String (ISO 8601) | `2026-08-19T10:00:00Z` |
| `updatedAt`   | —             | String (ISO 8601) | —                      |

No sort key on the main table — each complaint is exactly one item, with no child items attached to it (unlike more complex single-table designs that pack multiple entity types into one table).

## GSI1 — filter by customer

| Attribute    | Role          |
| ------------ | ------------- |
| `customerId` | Partition key |
| `createdAt`  | Sort key      |

Enables: `Query` all complaints for a given customer, sorted by creation time.

## GSI2 — filter by status

| Attribute   | Role          |
| ----------- | ------------- |
| `status`    | Partition key |
| `createdAt` | Sort key      |

Enables: `Query` all complaints currently in a given status (e.g. all `OPEN` complaints to work through), sorted by creation time.
