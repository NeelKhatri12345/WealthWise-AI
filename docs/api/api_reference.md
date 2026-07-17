# WealthWise AI — API Reference

> **Base URL:** `http://localhost:8000/api/v1`
> **Auth:** Bearer JWT (Authorization header)
> **Content-Type:** `application/json` (unless file upload)
> **API Docs:** `/docs` (Swagger), `/redoc` (ReDoc) — non-production only

---

## Authentication Endpoints

### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+919876543210"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "is_verified": false,
  "created_at": "2026-06-24T12:00:00Z"
}
```

**Errors:** `400` (email exists), `422` (validation)

---

### POST `/auth/login`
Authenticate and retrieve tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Errors:** `401` (invalid credentials), `403` (inactive account)

---

### POST `/auth/refresh`
Refresh an access token using a refresh token.

**Request Body:**
```json
{ "refresh_token": "eyJ..." }
```

**Response 200:** Same as login response.

---

### POST `/auth/logout`
Revoke current session (blacklists JTI in Redis).

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{ "message": "Successfully logged out" }
```

---

### POST `/auth/change-password`
Change authenticated user's password.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

---

## User Endpoints

### GET `/users/me`
Get current authenticated user profile.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+919876543210",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "created_at": "2026-06-24T12:00:00Z"
}
```

---

### PATCH `/users/me`
Update current user profile.

**Request Body (all optional):**
```json
{
  "full_name": "John Smith",
  "phone": "+919876543211"
}
```

---

## Statement Endpoints

### POST `/statements/upload`
Upload a bank statement (PDF or CSV).

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | Yes | PDF or CSV, max 10MB |
| `bank_name` | string | No | Hint for parser |
| `currency` | string | No | ISO 4217, default "INR" |

**Response 202:**
```json
{
  "id": "uuid",
  "status": "PROCESSING",
  "file_name": "statement_june.pdf",
  "message": "Statement queued for processing"
}
```

**Rate Limit:** 20 uploads/hour per user

---

### GET `/statements/`
List all statements for the current user.

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `page_size` | int | 20 | Max 100 |
| `status` | string | all | PENDING/PROCESSING/COMPLETED/FAILED |

**Response 200:**
```json
{
  "items": [...],
  "total": 45,
  "page": 1,
  "page_size": 20,
  "pages": 3
}
```

---

### GET `/statements/{statement_id}`
Get a single statement with metadata.

**Response 200:**
```json
{
  "id": "uuid",
  "file_name": "statement_june.pdf",
  "status": "COMPLETED",
  "bank_name": "HDFC Bank",
  "statement_period_start": "2026-05-01",
  "statement_period_end": "2026-05-31",
  "currency": "INR",
  "transaction_count": 87,
  "created_at": "2026-06-24T12:00:00Z"
}
```

---

### DELETE `/statements/{statement_id}`
Delete a statement and all its transactions.

**Response 204:** No content.

---

### GET `/statements/{statement_id}/download`
Get a pre-signed S3 URL to download the original file.

**Response 200:**
```json
{
  "download_url": "https://s3.amazonaws.com/...",
  "expires_in": 900
}
```

---

## Transaction Endpoints

### GET `/transactions/`
List transactions with filtering and pagination.

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `statement_id` | UUID | Filter by statement |
| `category` | string | Filter by category |
| `transaction_type` | string | CREDIT or DEBIT |
| `date_from` | date | YYYY-MM-DD |
| `date_to` | date | YYYY-MM-DD |
| `min_amount` | float | |
| `max_amount` | float | |
| `search` | string | Full-text search on description |
| `page` | int | Default 1 |
| `page_size` | int | Default 20, max 100 |
| `sort_by` | string | `date`, `amount`, `category` |
| `sort_order` | string | `asc` or `desc` |

---

### GET `/transactions/summary`
Aggregate summary of transactions.

**Query Parameters:** `date_from`, `date_to`, `statement_id`

**Response 200:**
```json
{
  "total_income": 85000.00,
  "total_expenses": 52300.00,
  "net_savings": 32700.00,
  "savings_rate": 38.47,
  "transaction_count": 87,
  "by_category": {
    "Food & Dining": 8200.00,
    "Transportation": 3100.00,
    "Shopping": 12400.00
  },
  "top_merchants": [...]
}
```

---

### GET `/transactions/categories`
List all unique categories for this user's transactions.

---

### PATCH `/transactions/{transaction_id}`
Update transaction category or tags.

**Request Body:**
```json
{
  "category": "Utilities",
  "tags": ["monthly", "essential"]
}
```

---

## Health Score Endpoints

### POST `/health-score/calculate`
Calculate financial health score from a date range.

**Request Body:**
```json
{
  "period_start": "2026-05-01",
  "period_end": "2026-05-31"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "score": 72,
  "grade": "GOOD",
  "total_income": 85000.00,
  "total_expenses": 52300.00,
  "savings_rate": 38.47,
  "expense_breakdown": {...},
  "gemini_explanation": "Your financial health is...",
  "gemini_recommendations": ["Increase emergency fund...", ...],
  "period_start": "2026-05-01",
  "period_end": "2026-05-31"
}
```

---

### GET `/health-score/history`
Get historical health scores.

**Query Parameters:** `page`, `page_size`, `limit` (default 12)

---

### GET `/health-score/latest`
Get the most recent health score.

---

## Risk Profile Endpoints

### POST `/risk-profile/predict`
Predict investment risk profile using ML model.

**Request Body:**
```json
{
  "monthly_income": 85000,
  "monthly_expenses": 52300,
  "monthly_savings": 32700,
  "investment_horizon_years": 10,
  "existing_investments": 150000,
  "debt_emi": 0
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "profile": "MODERATE",
  "confidence": 87.3,
  "risk_score": 58.4,
  "model_version": "v1.0",
  "gemini_explanation": "Based on your savings rate...",
  "gemini_recommendations": {...}
}
```

---

### GET `/risk-profile/latest`
Get the most recent risk profile prediction.

---

### GET `/risk-profile/history`
Paginated history of risk profile predictions.

---

## Portfolio Endpoints

### POST `/portfolio/generate`
Generate a portfolio recommendation based on risk profile.

**Request Body:**
```json
{
  "risk_profile_id": "uuid",
  "investment_amount": 50000,
  "investment_horizon_years": 10
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Balanced Growth Portfolio",
  "allocation": {
    "equity": 60,
    "debt": 30,
    "gold": 10
  },
  "recommended_funds": [
    {
      "name": "Mirae Asset Large Cap Fund",
      "type": "Equity Large Cap",
      "allocation_percent": 25,
      "expected_return": 12.5
    }
  ],
  "expected_return": 10.8,
  "risk_score": 58.4,
  "gemini_explanation": "..."
}
```

---

## AI Coach Endpoints

### POST `/ai-coach/chat`
Send a message to the AI financial coach.

**Request Body:**
```json
{
  "message": "How can I reduce my food expenses?",
  "session_id": "uuid",
  "include_financial_context": true
}
```

**Response 200:**
```json
{
  "session_id": "uuid",
  "response": "Based on your spending data...",
  "tokens_used": 847,
  "conversation_turn": 3
}
```

**Rate Limit:** 10 messages/minute per user

---

### GET `/ai-coach/sessions`
List all AI chat sessions for the user.

---

### GET `/ai-coach/sessions/{session_id}`
Get full conversation history for a session.

---

### DELETE `/ai-coach/sessions/{session_id}`
Delete a chat session.

---

## Admin Endpoints

> **Required Role:** `ADMIN`

### GET `/admin/users`
List all users with pagination and filtering.

**Query Parameters:** `page`, `page_size`, `role`, `is_active`, `search`

---

### PATCH `/admin/users/{user_id}`
Update user details (admin only).

---

### POST `/admin/users/{user_id}/activate`
Activate a deactivated user.

---

### POST `/admin/users/{user_id}/deactivate`
Deactivate a user (soft delete).

---

### GET `/admin/stats`
Platform-wide statistics.

**Response 200:**
```json
{
  "total_users": 1247,
  "active_users": 1198,
  "total_statements": 3841,
  "total_transactions": 284921,
  "statements_today": 23,
  "ai_queries_today": 412
}
```

---

## Error Response Format

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "detail": null,
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### HTTP Status Code Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST creating resource |
| `202` | Accepted | Async task queued |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Business logic failure |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient role |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (e.g., email) |
| `413` | Payload Too Large | File exceeds size limit |
| `422` | Unprocessable Entity | Pydantic validation failed |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | DB or external service down |

---

## API Versioning Strategy

```
/api/v1/...   ← Current stable version
/api/v2/...   ← Future (when breaking changes required)
```

**Rules:**
- All public routes are versioned under `/api/v{n}/`
- `/health` is version-free (infrastructure endpoint)
- Non-breaking additions (new fields, new endpoints) do NOT require version bump
- Breaking changes (removed fields, changed semantics) require new version
- Old versions maintained for minimum 6 months after deprecation notice
- `Sunset` response header added when endpoint is deprecated

---

## Pagination Envelope

All list endpoints return:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5,
  "has_next": true,
  "has_prev": false
}
```
