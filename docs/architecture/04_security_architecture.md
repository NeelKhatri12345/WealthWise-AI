# WealthWise AI — Security Architecture

---

## 1. Authentication Flow (JWT)

```
┌──────────────────────────────────────────────────────────────────┐
│                    JWT AUTHENTICATION FLOW                        │
└──────────────────────────────────────────────────────────────────┘

REGISTRATION:
Client ──POST /auth/register──► AuthService.register()
                                     │
                                     ├─► hash_password (bcrypt, cost=12)
                                     ├─► UserRepository.create()
                                     └─► Return UserResponse (no tokens)

LOGIN:
Client ──POST /auth/login──► AuthService.login()
                                  │
                                  ├─► UserRepository.get_by_email()
                                  ├─► verify_password(plain, hash)
                                  ├─► check: is_active == True
                                  ├─► create_access_token(sub=user.id, role=role.name)
                                  │     └─► JWT claims: {sub, role, exp, iat, jti, type}
                                  │           exp = now + 15 minutes
                                  ├─► create_refresh_token(sub=user.id)
                                  │     └─► JWT claims: {sub, exp, iat, jti, type}
                                  │           exp = now + 7 days
                                  │     └─► Store jti in Redis: refresh:{jti} TTL=7days
                                  └─► Return {access_token, refresh_token, expires_in}

AUTHENTICATED REQUEST:
Client ──GET /api/v1/users/me──► FastAPI dependency chain:
  Authorization: Bearer <token>
                                  │
                              get_current_user()
                                  │
                                  ├─► Extract Bearer token from header
                                  ├─► decode_token(token)
                                  │     ├─► jose.jwt.decode()
                                  │     ├─► Verify: signature, expiry, algorithm
                                  │     └─► Return TokenPayload
                                  ├─► Check Redis: blacklist:{jti} → 404 = valid
                                  ├─► UserRepository.get_by_id(payload.sub)
                                  └─► Return User object → injected to route handler

TOKEN REFRESH:
Client ──POST /auth/refresh──► AuthService.refresh()
                                    │
                                    ├─► decode_token(refresh_token)
                                    ├─► Verify token type == "refresh"
                                    ├─► Check Redis: refresh:{jti} exists
                                    ├─► Invalidate old refresh token (DEL refresh:{jti})
                                    ├─► create_access_token() → new access token
                                    ├─► create_refresh_token() → new refresh token + jti
                                    └─► Return new token pair (token rotation)

LOGOUT:
Client ──POST /auth/logout──► AuthService.logout()
                                   │
                                   ├─► decode_token(access_token) → get jti
                                   ├─► Redis SET: blacklist:{jti} = 1 TTL=token_remaining
                                   ├─► Get refresh jti from request body
                                   └─► Redis DEL: refresh:{refresh_jti}
```

---

## 2. JWT Token Claims

```json
// Access Token Payload
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User UUID
  "role": "user",                                   // Role name
  "exp": 1719230400,                                // Expiry timestamp
  "iat": 1719229500,                                // Issued at
  "jti": "unique-token-id-uuid",                   // Token ID (for blacklist)
  "type": "access"                                  // Token type
}

// Refresh Token Payload
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "exp": 1719835200,                                // 7 days
  "iat": 1719229500,
  "jti": "unique-refresh-id-uuid",
  "type": "refresh"
}
```

---

## 3. Role-Based Access Control (RBAC)

```
Roles Hierarchy:
ADMIN > ANALYST > USER

┌─────────────┬───────────────────────────────────────────────────────┐
│    Role     │                  Permissions                           │
├─────────────┼───────────────────────────────────────────────────────┤
│ USER        │ • Own profile CRUD                                      │
│             │ • Upload statements                                     │
│             │ • View own transactions                                  │
│             │ • Calculate own health score                            │
│             │ • Predict own risk profile                              │
│             │ • Generate own portfolio                                │
│             │ • Use AI coach                                          │
├─────────────┼───────────────────────────────────────────────────────┤
│ ANALYST     │ • All USER permissions                                  │
│             │ • View all users' anonymized analytics                  │
│             │ • Export platform reports                               │
│             │ • View aggregate statistics                             │
├─────────────┼───────────────────────────────────────────────────────┤
│ ADMIN       │ • All ANALYST permissions                               │
│             │ • Full user management (activate/deactivate)            │
│             │ • Change user roles                                     │
│             │ • View all statements and transactions                  │
│             │ • Platform-wide statistics                              │
│             │ • System health monitoring                              │
└─────────────┴───────────────────────────────────────────────────────┘

Implementation:
  @router.get("/admin/stats")
  async def admin_stats(
      current_user = Depends(require_roles(RoleEnum.ADMIN))
  ):
      ...

  # require_roles is a dependency factory in core/security.py
  # Returns the user if role matches, raises 403 ForbiddenException otherwise
```

---

## 4. Rate Limiting Strategy

```
┌───────────────────────────────────────────────────────────────┐
│                  RATE LIMITING ARCHITECTURE                    │
│                                                               │
│  Backend: Redis (Sliding Window Counter)                      │
│  Middleware: RateLimitMiddleware (app/middleware/)            │
└───────────────────────────────────────────────────────────────┘

Algorithm: Fixed Window Counter (per IP)
Redis Key Pattern: rate:{client_ip}:{window_timestamp}

Limits by Endpoint Type:

┌────────────────────────────────┬─────────────┬──────────────┐
│ Endpoint Category              │ Limit       │ Window       │
├────────────────────────────────┼─────────────┼──────────────┤
│ Global (all endpoints)         │ 100 req     │ 60 seconds   │
│ Auth (login, register)         │ 10 req      │ 60 seconds   │
│ File Upload                    │ 20 req      │ 3600 seconds │
│ AI Coach                       │ 10 req      │ 60 seconds   │
│ Health Score Calculate         │ 5 req       │ 60 seconds   │
└────────────────────────────────┴─────────────┴──────────────┘

Response Headers (always included):
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1719229560   (Unix timestamp)
  Retry-After: 15                 (seconds, only on 429)

429 Response Body:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 15 seconds.",
    "retry_after": 15
  }
}
```

---

## 5. Password Security

```python
# Policy enforced by Pydantic validator in auth_schema.py
PASSWORD_POLICY = {
    "min_length": 8,
    "max_length": 128,
    "require_uppercase": True,      # At least 1 A-Z
    "require_lowercase": True,      # At least 1 a-z
    "require_digit": True,          # At least 1 0-9
    "require_special": True,        # At least 1 !@#$%^&*
    "disallow_common": True,        # Check against common passwords list
}

# Storage: bcrypt with cost factor 12
# bcrypt automatically handles salting
hashed = pwd_context.hash(plain_password)  # ~300ms intentional delay
```

---

## 6. Secrets Management

```
Development:
  └─ .env file (never committed to git — in .gitignore)
  └─ .env.example committed with placeholder values

Staging / Production:
  └─ AWS Secrets Manager (recommended)
  └─ Environment variables injected by ECS/EC2 IAM role
  └─ GitHub Actions secrets for CI/CD pipeline

Secret Rotation Policy:
  • JWT_SECRET_KEY: Rotate every 90 days
  • DB passwords: Rotate every 60 days
  • API keys: Rotate on compromise or annually
  • S3 credentials: Use IAM roles (no static keys in prod)
```

---

## 7. Input Validation & Sanitization

```
Layer 1: Pydantic V2 Schemas (automatic)
  • Type coercion and validation
  • Pattern matching (email, phone)
  • Length constraints
  • Custom validators with @field_validator

Layer 2: File Upload Validation (file_utils.py)
  • Check MIME type from file headers (python-magic), not just extension
  • Enforce MAX_FILE_SIZE_MB
  • Scan for null bytes in filenames
  • Generate safe filename (UUID-based, strip original name)

Layer 3: SQL Injection Prevention
  • SQLAlchemy parameterized queries exclusively
  • No raw SQL with string interpolation
  • Alembic migrations with safe operations only

Layer 4: XSS Prevention
  • API returns JSON only (no HTML rendering)
  • Frontend escapes all user-generated content
  • Content-Security-Policy headers via Nginx
```

---

## 8. S3 Security

```
Pre-signed URL Strategy:
  • Files are NEVER served directly from S3 to clients
  • All S3 access goes through backend-generated pre-signed URLs
  • URL TTL: 15 minutes (900 seconds)
  • Bucket policy: Block all public access
  • Object keys: {user_id}/{uuid}/{safe_filename}
    └─ User isolation via prefix-based IAM policy

AWS IAM Policy (EC2 instance role):
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::wealthwise-statements/${aws:userid}/*"
  }]
}
```

---

## 9. CORS Configuration

```python
# Only trusted origins allowed
ALLOWED_ORIGINS = [
    "https://wealthwise.ai",          # Production frontend
    "https://staging.wealthwise.ai",  # Staging
    "http://localhost:5173",          # Vite dev server
]

CORS settings:
  allow_credentials = True   # Required for cookie-based auth
  allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  allow_headers = ["Authorization", "Content-Type", "X-Request-ID"]
  expose_headers = ["X-Request-ID", "X-Process-Time", "X-RateLimit-*"]
```

---

## 10. Security Headers (Nginx Production)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; ..." always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## 11. Security Checklist (Pre-Production)

- [ ] JWT_SECRET_KEY is 64+ random hex chars (not default)
- [ ] POSTGRES_PASSWORD is strong and unique
- [ ] DEBUG mode is OFF in production
- [ ] Swagger/ReDoc disabled in production (`docs_url=None`)
- [ ] All S3 buckets have "Block Public Access" enabled
- [ ] HTTPS enforced via AWS ALB with ACM certificate
- [ ] Security groups allow only ports 80, 443 from internet
- [ ] DB security group allows port 5432 only from app SG
- [ ] Redis security group allows port 6379 only from app SG
- [ ] `.env` is in `.gitignore` (never committed)
- [ ] GitHub Actions secrets used for CI/CD credentials
- [ ] bcrypt cost factor >= 12
- [ ] Token blacklist TTL matches token expiry exactly
- [ ] Rate limiting enabled and tested
- [ ] Dependency vulnerabilities checked (`pip-audit`)
