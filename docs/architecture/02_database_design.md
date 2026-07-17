# WealthWise AI — Database Design

> **Engine:** PostgreSQL 16 | **ORM:** SQLAlchemy 2.x | **Migration Tool:** Alembic

---

## 1. Entity Relationship Diagram

```
┌──────────────────────┐
│        roles         │
│──────────────────────│
│ id          UUID PK  │
│ name        VARCHAR  │◄──────────────────────────────────┐
│ description TEXT     │                                   │
│ created_at  TIMESTAMPTZ                                  │
│ updated_at  TIMESTAMPTZ                                  │
└──────────────────────┘                                   │
                                                           │
┌──────────────────────────────────────────────────┐       │
│                      users                        │       │
│──────────────────────────────────────────────────│       │
│ id              UUID PK                           │       │
│ email           VARCHAR(255) UNIQUE NOT NULL      │       │
│ hashed_password VARCHAR(255) NOT NULL             │       │
│ full_name       VARCHAR(100) NOT NULL             │       │
│ phone           VARCHAR(20)                       │       │
│ is_active       BOOLEAN DEFAULT TRUE              │       │
│ is_verified     BOOLEAN DEFAULT FALSE             │       │
│ role_id         UUID FK ──────────────────────────┼───────┘
│ created_at      TIMESTAMPTZ                       │
│ updated_at      TIMESTAMPTZ                       │
└──────┬───────────────────────────────────────────┘
       │ 1:N                1:N            1:N          1:N          1:N
       │                   │              │             │            │
       ▼                   ▼              ▼             ▼            ▼
┌─────────────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────────┐
│   statements    │ │health_score│ │ risk_profiles│ │portfolios │ │ ai_conversations │
│─────────────────│ │────────────│ │──────────────│ │───────────│ │──────────────────│
│ id UUID PK      │ │ id UUID PK │ │ id UUID PK   │ │ id UUID PK│ │ id UUID PK       │
│ user_id FK      │ │ user_id FK │ │ user_id FK   │ │ user_id FK│ │ user_id FK       │
│ file_name       │ │ score INT  │ │ profile ENUM │ │ name TEXT │ │ session_id UUID  │
│ file_path_s3    │ │ grade ENUM │ │ confidence   │ │ total_val │ │ messages JSONB   │
│ file_size_bytes │ │ income     │ │ risk_score   │ │ alloc JSONB│ │ token_count INT  │
│ mime_type       │ │ expense    │ │ income       │ │ gemini_exp│ │ created_at       │
│ status ENUM     │ │ savings    │ │ expense      │ │ created_at│ │ updated_at       │
│ ocr_engine      │ │ gemini_exp │ │ savings_rate │ │ updated_at│ └──────────────────┘
│ ocr_raw_text    │ │ gemini_reco│ │ monthly_inv  │ └───────────┘
│ statement_period│ │ created_at │ │ gemini_reco  │
│ bank_name       │ │ updated_at │ │ created_at   │
│ currency        │ │            │ │ updated_at   │
│ created_at      │ └────────────┘ └──────────────┘
│ updated_at      │
└────────┬────────┘
         │ 1:N
         ▼
┌──────────────────────────────────────────────────┐
│                  transactions                     │
│──────────────────────────────────────────────────│
│ id              UUID PK                           │
│ statement_id    UUID FK NOT NULL                  │
│ user_id         UUID FK NOT NULL                  │
│ date            DATE NOT NULL                     │
│ description     TEXT NOT NULL                     │
│ amount          NUMERIC(12,2) NOT NULL            │
│ transaction_type ENUM(CREDIT/DEBIT)              │
│ category        VARCHAR(100)                      │
│ sub_category    VARCHAR(100)                      │
│ merchant_name   VARCHAR(255)                      │
│ balance_after   NUMERIC(12,2)                     │
│ is_recurring    BOOLEAN DEFAULT FALSE             │
│ tags            VARCHAR[]                         │
│ raw_text        TEXT                              │
│ created_at      TIMESTAMPTZ                       │
│ updated_at      TIMESTAMPTZ                       │
└──────────────────────────────────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `roles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | `admin`, `analyst`, `user` |
| `description` | TEXT | NULLABLE | Human-readable description |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Auto-updated via trigger |

**Indexes:** `roles_name_idx` UNIQUE on `name`

---

### 2.2 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Primary identifier |
| `hashed_password` | VARCHAR(255) | NOT NULL | bcrypt hash, cost=12 |
| `full_name` | VARCHAR(100) | NOT NULL | |
| `phone` | VARCHAR(20) | NULLABLE | E.164 format |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft disable |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Email verification |
| `role_id` | UUID | FK roles.id RESTRICT | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `users_email_idx`, `users_role_id_idx`

---

### 2.3 `statements`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK users.id CASCADE | |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename |
| `file_path_s3` | TEXT | NOT NULL | S3 object key |
| `file_size_bytes` | INTEGER | NOT NULL | |
| `mime_type` | VARCHAR(100) | NOT NULL | `application/pdf`, `text/csv` |
| `status` | ENUM | NOT NULL | PENDING / PROCESSING / COMPLETED / FAILED |
| `ocr_engine` | VARCHAR(50) | NULLABLE | `easyocr`, `paddleocr`, `none` |
| `ocr_raw_text` | TEXT | NULLABLE | Full extracted text |
| `parsed_data` | JSONB | NULLABLE | Structured Gemini parse output |
| `statement_period_start` | DATE | NULLABLE | |
| `statement_period_end` | DATE | NULLABLE | |
| `bank_name` | VARCHAR(100) | NULLABLE | Detected bank |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | ISO 4217 |
| `processing_error` | TEXT | NULLABLE | Error message if FAILED |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `statements_user_id_idx`, `statements_status_idx`, `statements_created_at_idx`

---

### 2.4 `transactions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `statement_id` | UUID | FK statements.id CASCADE | |
| `user_id` | UUID | FK users.id CASCADE | Denormalized for query performance |
| `date` | DATE | NOT NULL | Transaction date |
| `description` | TEXT | NOT NULL | Raw bank description |
| `amount` | NUMERIC(12,2) | NOT NULL | Always positive |
| `transaction_type` | ENUM | NOT NULL | `CREDIT` / `DEBIT` |
| `category` | VARCHAR(100) | NULLABLE | Gemini-classified category |
| `sub_category` | VARCHAR(100) | NULLABLE | Finer grain |
| `merchant_name` | VARCHAR(255) | NULLABLE | Extracted merchant |
| `balance_after` | NUMERIC(12,2) | NULLABLE | Running balance |
| `is_recurring` | BOOLEAN | DEFAULT FALSE | Detected recurring payment |
| `tags` | VARCHAR[] | DEFAULT '{}' | User-defined tags |
| `raw_text` | TEXT | NULLABLE | OCR row that generated this |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:**
- `transactions_user_id_idx`
- `transactions_statement_id_idx`
- `transactions_date_idx`
- `transactions_category_idx`
- `transactions_user_date_idx` (composite: user_id, date DESC)

---

### 2.5 `health_scores`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK users.id CASCADE | |
| `score` | INTEGER | CHECK(0-100) | Computed health score |
| `grade` | ENUM | NOT NULL | EXCELLENT / GOOD / FAIR / POOR / CRITICAL |
| `total_income` | NUMERIC(12,2) | NOT NULL | Period income |
| `total_expenses` | NUMERIC(12,2) | NOT NULL | Period expenses |
| `total_savings` | NUMERIC(12,2) | NOT NULL | income - expenses |
| `savings_rate` | NUMERIC(5,2) | NOT NULL | savings/income * 100 |
| `expense_breakdown` | JSONB | NOT NULL | Category-wise expenses |
| `gemini_explanation` | TEXT | NULLABLE | AI-generated explanation |
| `gemini_recommendations` | JSONB | NULLABLE | Array of recommendations |
| `period_start` | DATE | NOT NULL | |
| `period_end` | DATE | NOT NULL | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### 2.6 `risk_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK users.id CASCADE | |
| `profile` | ENUM | NOT NULL | CONSERVATIVE / MODERATE / AGGRESSIVE |
| `confidence` | NUMERIC(5,2) | NOT NULL | ML model confidence % |
| `risk_score` | NUMERIC(5,2) | NOT NULL | 0-100 numeric score |
| `monthly_income` | NUMERIC(12,2) | NOT NULL | Input feature |
| `monthly_expenses` | NUMERIC(12,2) | NOT NULL | Input feature |
| `monthly_savings` | NUMERIC(12,2) | NOT NULL | Input feature |
| `savings_rate` | NUMERIC(5,2) | NOT NULL | Input feature |
| `debt_to_income` | NUMERIC(5,2) | NULLABLE | Input feature |
| `model_version` | VARCHAR(20) | NOT NULL | `v1.0`, `v2.0` |
| `feature_importances` | JSONB | NULLABLE | For explainability |
| `gemini_explanation` | TEXT | NULLABLE | AI-generated explanation |
| `gemini_recommendations` | JSONB | NULLABLE | Investment suggestions |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### 2.7 `portfolios`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK users.id CASCADE | |
| `risk_profile_id` | UUID | FK risk_profiles.id SET NULL | |
| `name` | VARCHAR(100) | NOT NULL | Portfolio label |
| `total_value` | NUMERIC(15,2) | DEFAULT 0 | |
| `allocation` | JSONB | NOT NULL | `{equity: 60, debt: 30, gold: 10}` |
| `recommended_funds` | JSONB | NULLABLE | Array of fund objects |
| `expected_return` | NUMERIC(5,2) | NULLABLE | % per annum |
| `risk_score` | NUMERIC(5,2) | NULLABLE | Portfolio risk metric |
| `gemini_explanation` | TEXT | NULLABLE | AI rationale |
| `rebalance_due_date` | DATE | NULLABLE | When to review |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### 2.8 `ai_conversations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK users.id CASCADE | |
| `session_id` | UUID | NOT NULL | Groups messages in a session |
| `messages` | JSONB | NOT NULL | `[{role, content, timestamp}]` |
| `context_summary` | TEXT | NULLABLE | Rolling summary for long chats |
| `total_tokens_used` | INTEGER | DEFAULT 0 | Gemini token accounting |
| `model_used` | VARCHAR(100) | NOT NULL | Model name |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `ai_conversations_user_session_idx` (user_id, session_id)

---

## 3. Base Model Mixins

```python
# app/database/base.py

class UUIDMixin:
    """Provides UUID primary key using PostgreSQL gen_random_uuid()"""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )

class TimestampMixin:
    """Provides created_at and updated_at with DB-level defaults"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```

---

## 4. Migration Strategy

```
alembic/
├── env.py              # Async migration environment
├── script.py.mako      # Migration template
└── versions/           # Auto-generated migration files
    ├── 0001_create_roles.py
    ├── 0002_create_users.py
    ├── 0003_create_statements.py
    ├── 0004_create_transactions.py
    ├── 0005_create_health_scores.py
    ├── 0006_create_risk_profiles.py
    ├── 0007_create_portfolios.py
    └── 0008_create_ai_conversations.py
```

**Migration Commands:**
```bash
# Generate new migration
alembic revision --autogenerate -m "description"

# Apply all pending
alembic upgrade head

# Rollback one
alembic downgrade -1

# Show history
alembic history --verbose
```

---

## 5. Database Indexes Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | `email` | UNIQUE B-tree | Login lookup |
| statements | `user_id` | B-tree | User's statement list |
| statements | `status` | B-tree | Queue processing |
| transactions | `(user_id, date DESC)` | Composite | Date-ranged queries |
| transactions | `category` | B-tree | Category aggregation |
| health_scores | `(user_id, created_at DESC)` | Composite | Latest score lookup |
| ai_conversations | `(user_id, session_id)` | Composite | Session retrieval |

---

## 6. Connection Pool Configuration

```python
# app/database/session.py
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,          # Base connections
    max_overflow=20,       # Additional burst connections
    pool_timeout=30,       # Wait for available connection
    pool_recycle=1800,     # Recycle connections every 30 min
    pool_pre_ping=True,    # Verify connection before use
    echo=settings.DB_ECHO,
)
```
