# WealthWise AI — Backend File Responsibilities

> Reference guide for every file in the backend — what it does, what it imports, and what it exports.

---

## `backend/app/main.py`

**Role:** Application factory and entry point.

**Responsibilities:**
- Creates the FastAPI app instance via `create_app()` factory
- Registers middleware stack in correct order (outermost → innermost)
- Registers global exception handlers
- Mounts the versioned API router at `/api/v1`
- Manages application lifespan (startup DB check, ML model loading, shutdown cleanup)
- Exports `app` instance consumed by uvicorn/gunicorn

**Key Patterns:**
- Factory pattern (`create_app()`) allows testing with different configs
- `@asynccontextmanager lifespan` replaces deprecated `@app.on_event`
- Middleware order: LoggingMiddleware → RateLimitMiddleware → CORS → TrustedHost

---

## `app/api/v1/`

### `router.py`
Central API router that assembles all route modules.

```python
api_v1_router = APIRouter()
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(user_router, prefix="/users", tags=["Users"])
# ... etc
```

### `auth_routes.py`
Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password`

**Dependencies:** `AuthService`, `get_db`
**Schemas:** `RegisterRequest`, `LoginRequest`, `TokenResponse`
**No auth required:** register, login | **Auth required:** logout, change-password

### `user_routes.py`
Endpoints: `GET /users/me`, `PATCH /users/me`

**Dependencies:** `UserService`, `get_current_active_user`
**Schemas:** `UserResponse`, `UserUpdateRequest`
**Auth:** All endpoints require authentication

### `statement_routes.py`
Endpoints: `POST /statements/upload`, `GET /statements/`, `GET /statements/{id}`, `DELETE /statements/{id}`, `GET /statements/{id}/download`

**Dependencies:** `StatementService`, `get_current_active_user`
**Content-Type:** `multipart/form-data` for upload endpoint
**Special:** Upload endpoint validates file before passing to service

### `transaction_routes.py`
Endpoints: `GET /transactions/`, `GET /transactions/summary`, `GET /transactions/categories`, `PATCH /transactions/{id}`

**Query params:** date range, category filter, pagination, sort
**Dependencies:** `AnalyticsService` (for summary), `StatementService` (for transactions)

### `health_score_routes.py`
Endpoints: `POST /health-score/calculate`, `GET /health-score/history`, `GET /health-score/latest`

### `risk_profile_routes.py`
Endpoints: `POST /risk-profile/predict`, `GET /risk-profile/latest`, `GET /risk-profile/history`

### `portfolio_routes.py`
Endpoints: `POST /portfolio/generate`, `GET /portfolio/`, `GET /portfolio/{id}`

### `ai_coach_routes.py`
Endpoints: `POST /ai-coach/chat`, `GET /ai-coach/sessions`, `GET /ai-coach/sessions/{id}`, `DELETE /ai-coach/sessions/{id}`

**Rate limit:** 10 messages/minute (custom AI rate limit applied here)

### `admin_routes.py`
Endpoints: `GET /admin/users`, `PATCH /admin/users/{id}`, `POST /admin/users/{id}/activate`, `POST /admin/users/{id}/deactivate`, `GET /admin/stats`

**Auth:** `require_roles(RoleEnum.ADMIN)` on all endpoints

---

## `app/core/`

### `config.py`
Pydantic `BaseSettings` class with all environment variable declarations.
- Groups: App, DB, JWT, Redis, Gemini, S3, Rate Limiting, CORS, File Upload
- `@lru_cache get_settings()` → singleton instance
- `@model_validator` to auto-assemble DATABASE_URL

### `security.py`
Pure security primitives — no database calls.
- `hash_password()`, `verify_password()` — bcrypt via passlib
- `create_access_token()`, `create_refresh_token()` — JWT creation
- `decode_token()` — JWT validation, raises `UnauthorizedException`
- `require_roles(*roles)` — RBAC dependency factory

### `logger.py`
Configures the application logger.
- `TimedRotatingFileHandler` (hourly rotation, 7-day retention)
- `StreamHandler` for stdout (for Docker log capture)
- JSON formatter for structured log output
- `logger` singleton exported and used everywhere

### `constants.py`
Application-wide constants — NOT environment-specific.
- Category lists for transaction classification
- Scoring thresholds for health score grades
- Risk profile thresholds
- OCR confidence thresholds
- Pagination defaults (MAX_PAGE_SIZE = 100)

### `dependencies.py`
FastAPI dependency functions — the DI wiring layer.
- `get_db()` → async generator yielding AsyncSession
- `get_redis()` → Redis connection
- `get_current_user()` → Decodes JWT, returns TokenPayload
- `get_current_active_user()` → Fetches User from DB, checks is_active
- `get_ml_models()` → Returns app.state.ml_models dict

---

## `app/database/`

### `session.py`
SQLAlchemy async engine and session factory.
```python
engine = create_async_engine(settings.DATABASE_URL, ...)
AsyncSessionLocal = async_sessionmaker(engine, ...)
```

### `base.py`
- `Base` — SQLAlchemy DeclarativeBase
- `UUIDMixin` — UUID primary key
- `TimestampMixin` — created_at, updated_at

### `seed.py`
Database seeder for development.
- Creates default roles (admin, analyst, user)
- Creates a default admin user
- Idempotent (safe to run multiple times)

---

## `app/models/`

All models inherit from `UUIDMixin, TimestampMixin, Base`.

### `role.py` → `Role`
Table: `roles` | Fields: name, description | Relationship: users

### `user.py` → `User`
Table: `users` | Fields: email, hashed_password, full_name, phone, is_active, is_verified, role_id
Relationships: role (ManyToOne), statements, health_scores, risk_profiles, portfolios, ai_conversations (all OneToMany)

### `statement.py` → `Statement`
Table: `statements` | Fields: file metadata, S3 key, OCR text, status, parsed_data (JSONB)
Relationships: user (ManyToOne), transactions (OneToMany)

### `transaction.py` → `Transaction`
Table: `transactions` | Fields: date, description, amount, type, category, merchant, balance
Relationships: statement (ManyToOne), user (ManyToOne, denormalized FK)

### `health_score.py` → `HealthScore`
Table: `health_scores` | Fields: score, grade, income, expenses, savings_rate, breakdown (JSONB), gemini fields
Relationships: user (ManyToOne)

### `risk_profile.py` → `RiskProfile`
Table: `risk_profiles` | Fields: profile ENUM, confidence, risk_score, feature inputs, model_version, gemini fields
Relationships: user (ManyToOne)

### `portfolio.py` → `Portfolio`
Table: `portfolios` | Fields: name, allocation (JSONB), recommended_funds (JSONB), expected_return
Relationships: user (ManyToOne), risk_profile (ManyToOne)

### `ai_conversation.py` → `AIConversation`
Table: `ai_conversations` | Fields: session_id, messages (JSONB), context_summary, total_tokens_used, model_used
Relationships: user (ManyToOne)

---

## `app/schemas/`

All schemas use Pydantic V2. Pattern: `XBase → XCreate → XUpdate → XResponse → XListResponse`.

### `auth_schema.py`
- `RegisterRequest` — email, password (with strength validator), full_name, phone
- `LoginRequest` — email, password
- `TokenResponse` — access_token, refresh_token, token_type, expires_in
- `TokenPayload` — sub, role, exp, iat, jti, type
- `RefreshRequest`, `ChangePasswordRequest`

### `user_schema.py`
- `UserResponse` — id, email, full_name, phone, role, is_active, is_verified, created_at
- `UserUpdateRequest` — full_name (optional), phone (optional)

### `statement_schema.py`
- `StatementUploadResponse` — id, status, file_name, message
- `StatementResponse` — full metadata including transaction_count
- `StatementListResponse` — paginated items

### `transaction_schema.py`
- `TransactionResponse` — all fields
- `TransactionUpdateRequest` — category, tags
- `TransactionSummaryResponse` — totals, by_category, top_merchants
- `TransactionListResponse` — paginated

### `health_score_schema.py`
- `HealthScoreCalculateRequest` — period_start, period_end
- `HealthScoreResponse` — score, grade, all financial fields, gemini output

### `risk_profile_schema.py`
- `RiskProfilePredictRequest` — income, expenses, savings, horizon, etc.
- `RiskProfileResponse` — profile, confidence, risk_score, gemini output

### `portfolio_schema.py`
- `PortfolioGenerateRequest` — risk_profile_id, amount, horizon
- `PortfolioResponse` — name, allocation, funds, expected_return

### `ai_schema.py`
- `ChatRequest` — message, session_id (optional), include_financial_context
- `ChatResponse` — session_id, response, tokens_used, conversation_turn
- `ConversationSessionResponse` — session summary

---

## `app/repositories/`

Repositories only interact with the database. No business logic.

### `user_repository.py` → `UserRepository`
```python
get_by_id(user_id: UUID) → User | None
get_by_email(email: str) → User | None
create(user_data: dict) → User
update(user_id: UUID, data: dict) → User
```

### `statement_repository.py` → `StatementRepository`
```python
create(statement_data: dict) → Statement
get_by_id(statement_id, user_id) → Statement | None
list_by_user(user_id, page, page_size, status_filter) → (list[Statement], int)
update_status(statement_id, status, extra_fields) → Statement
delete(statement_id, user_id) → bool
```

### `transaction_repository.py` → `TransactionRepository`
```python
bulk_create(transactions: list[dict]) → list[Transaction]
list_by_user(user_id, filters, pagination) → (list[Transaction], int)
get_summary(user_id, date_from, date_to) → dict
get_categories(user_id) → list[str]
update(transaction_id, user_id, data) → Transaction
```

### `analytics_repository.py` → `AnalyticsRepository`
```python
get_health_score_history(user_id, limit) → list[HealthScore]
get_latest_health_score(user_id) → HealthScore | None
create_health_score(data: dict) → HealthScore
get_latest_risk_profile(user_id) → RiskProfile | None
create_risk_profile(data: dict) → RiskProfile
create_portfolio(data: dict) → Portfolio
save_conversation(data: dict) → AIConversation
get_conversation_sessions(user_id) → list[AIConversation]
```

### `admin_repository.py` → `AdminRepository`
```python
list_all_users(filters, pagination) → (list[User], int)
get_platform_stats() → dict
update_user_status(user_id, is_active) → User
```

---

## `app/services/`

Services orchestrate business logic, coordinate repositories and external clients.

### `auth_service.py` → `AuthService`
- `register()` → Validates unique email, hashes password, assigns default role, creates user
- `login()` → Verifies credentials, creates token pair, stores refresh JTI in Redis
- `refresh()` → Validates refresh token, rotates token pair
- `logout()` → Blacklists access JTI, deletes refresh JTI
- `change_password()` → Verifies current, hashes new, updates DB

### `user_service.py` → `UserService`
- `get_profile()` → Returns current user
- `update_profile()` → Validates and updates allowed fields

### `statement_service.py` → `StatementService`
- `process_upload()` → Validates file, uploads to S3, creates DB record, triggers OCR pipeline
- `run_ocr_pipeline()` → Selects OCR engine, extracts text, calls Gemini to parse, bulk-creates transactions
- `get_statement()` → Ownership-checked fetch
- `list_statements()` → Paginated list
- `delete_statement()` → Cascading delete (transactions + S3 object)
- `get_download_url()` → Generates pre-signed S3 URL

### `analytics_service.py` → `AnalyticsService`
- `get_transaction_summary()` → Aggregates income/expense/savings from transactions
- `get_category_breakdown()` → Groups transactions by category
- `get_spending_trends()` → Monthly trend data for charts

### `health_score_service.py` → `HealthScoreService`
- `calculate()` → Pulls transactions for period, computes score (0-100), calls Gemini for explanation
- Score formula: weighted sum of savings_rate, expense_diversity, income_stability

### `risk_profile_service.py` → `RiskProfileService`
- `predict()` → Assembles feature vector, calls sklearn model (app.state.ml_models), calls Gemini for explanation
- `get_history()` → Returns past predictions

### `portfolio_service.py` → `PortfolioService`
- `generate()` → Based on risk profile, calls Gemini to generate allocation + fund recommendations
- `get_portfolios()` → Returns user's portfolios

### `ai_coach_service.py` → `AICoachService`
- `chat()` → Loads session history, builds financial context, calls GeminiClient, persists conversation
- `get_sessions()` → Lists session summaries
- `delete_session()` → Removes conversation

### `admin_service.py` → `AdminService`
- `list_users()` → Paginated user list with filters
- `activate_user()`, `deactivate_user()` → Status management
- `get_platform_stats()` → Aggregates from admin repo

---

## `app/clients/`

### `gemini_client.py` → `GeminiClient`
Wraps Google GenAI SDK. Methods: `parse_statement`, `explain_health_score`, `explain_risk_profile`, `generate_portfolio`, `coach_chat`. Handles retry logic and rate limit backoff.

### `ocr_client.py` → `OCRClient`
Selects between CSV parsing (pandas), pdfplumber, EasyOCR, PaddleOCR based on file type and confidence. Returns `(raw_text: str, confidence: float, engine_used: str)`.

### `s3_client.py` → `S3Client`
Wraps aioboto3 for async S3 operations. Methods: `upload_file`, `generate_presigned_url`, `delete_object`. Supports both real AWS and MinIO endpoint override.

---

## `app/middleware/`

### `logging_middleware.py` → `LoggingMiddleware`
- Generates `X-Request-ID` UUID for every request
- Logs: method, path, client IP, request ID on entry
- Logs: status code, duration_ms on exit
- Adds `X-Request-ID` and `X-Process-Time` headers to response

### `rate_limit_middleware.py` → `RateLimitMiddleware`
- Reads client IP from `X-Forwarded-For` (trust proxy) or `request.client.host`
- Redis key: `rate:{ip}:{window}` with INCR + EXPIRE
- Returns `429` with `Retry-After` header if limit exceeded
- Skips `/health` and `/docs` endpoints

### `auth_middleware.py`
Note: Authentication is handled via FastAPI dependency injection (`Depends(get_current_active_user)`), not middleware. This file documents the decision and contains any pre-auth middleware utilities (e.g., IP extraction helpers).

---

## `app/exceptions/`

### `custom_exceptions.py`
```python
class WealthWiseException(Exception): ...       # Base
class NotFoundException(WealthWiseException): ...
class UnauthorizedException(WealthWiseException): ...
class ForbiddenException(WealthWiseException): ...
class ConflictException(WealthWiseException): ...
class ValidationException(WealthWiseException): ...
class FileTooLargeException(WealthWiseException): ...
class UnsupportedFileTypeException(WealthWiseException): ...
class OCRException(WealthWiseException): ...
class GeminiServiceException(WealthWiseException): ...
class S3Exception(WealthWiseException): ...
class RateLimitException(WealthWiseException): ...
```

### `handlers.py`
`register_exception_handlers(app)` — registers handlers for all custom exceptions + FastAPI's `RequestValidationError` + generic `Exception`. All return consistent JSON error envelope.

---

## `app/enums/`

### `role_enum.py` → `RoleEnum`
```python
class RoleEnum(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    USER = "user"
```

### `risk_profile_enum.py` → `RiskProfileEnum`
```python
class RiskProfileEnum(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"
```

### `statement_status_enum.py` → `StatementStatusEnum`
```python
class StatementStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
```

### `health_score_enum.py` → `HealthScoreGradeEnum`
```python
class HealthScoreGradeEnum(str, Enum):
    EXCELLENT = "EXCELLENT"  # 80-100
    GOOD = "GOOD"            # 60-79
    FAIR = "FAIR"            # 40-59
    POOR = "POOR"            # 20-39
    CRITICAL = "CRITICAL"    # 0-19
```

---

## `app/utils/`

### `helpers.py`
- `paginate(query, page, page_size)` — SQLAlchemy pagination helper
- `generate_safe_filename(original: str) → str` — UUID-based S3 key
- `format_currency(amount: float, currency: str) → str`
- `calculate_percentage_change(old, new) → float`

### `validators.py`
- `validate_date_range(start, end, max_days=365)`
- `validate_phone_number(phone: str) → str` — E.164 normalization
- `is_valid_email(email: str) → bool`

### `file_utils.py`
- `detect_mime_type(file_bytes: bytes) → str` — Uses python-magic
- `is_allowed_file_type(mime_type: str) → bool`
- `check_file_size(size_bytes: int) → bool`
- `extract_pdf_page_count(file_bytes: bytes) → int`

### `date_utils.py`
- `parse_bank_date(date_str: str) → date` — Handles multiple date formats
- `get_period_months(start: date, end: date) → int`
- `first_day_of_month(year: int, month: int) → date`
- `last_day_of_month(year: int, month: int) → date`
