# WealthWise AI — Development Order & Dependency Flow

> This document defines the exact implementation sequence for the development team. Follow the phases in order to avoid circular dependency issues and unblocked work.

---

## Dependency Flow Overview

```
Enums → Models → Database → Schemas → Repositories → Services → Routes
  ↑                                                          ↑
Clients ─────────────────────────────────────────────────────┘
  ↑
External APIs (Gemini, S3, OCR)
```

---

## Phase 1: Foundation (Day 1-2)

> No external dependencies. Core infrastructure.

```
Priority: CRITICAL — Everything depends on this phase.

1.1  enums/role_enum.py               (no deps)
1.2  enums/statement_status_enum.py   (no deps)
1.3  enums/risk_profile_enum.py       (no deps)
1.4  enums/health_score_enum.py       (no deps)
1.5  core/config.py                   (pydantic-settings)
1.6  core/logger.py                   (config.py)
1.7  core/constants.py                (enums)
1.8  database/base.py                 (sqlalchemy)
1.9  database/session.py              (config.py, base.py)
```

**Verification:** `python -c "from app.core.config import get_settings; print(get_settings().APP_NAME)"`

---

## Phase 2: Data Models (Day 2-3)

> Depends on: Phase 1. Everything else depends on this.

```
2.1  models/role.py          (base.py)
2.2  models/user.py          (base.py, role.py)
2.3  models/statement.py     (base.py, user.py, enums)
2.4  models/transaction.py   (base.py, statement.py)
2.5  models/health_score.py  (base.py, user.py, enums)
2.6  models/risk_profile.py  (base.py, user.py, enums)
2.7  models/portfolio.py     (base.py, user.py, risk_profile.py)
2.8  models/ai_conversation.py (base.py, user.py)
2.9  models/__init__.py       (imports all models — required for Alembic)
```

**Verification:** `alembic revision --autogenerate -m "initial" && alembic upgrade head`

---

## Phase 3: Schemas (Day 3-4)

> Depends on: Phase 2. Used by routes and services.

```
3.1  schemas/auth_schema.py       (pydantic, enums)
3.2  schemas/user_schema.py       (pydantic, enums)
3.3  schemas/statement_schema.py  (pydantic, enums)
3.4  schemas/transaction_schema.py (pydantic, enums)
3.5  schemas/health_score_schema.py (pydantic, enums)
3.6  schemas/risk_profile_schema.py (pydantic, enums)
3.7  schemas/portfolio_schema.py   (pydantic)
3.8  schemas/ai_schema.py          (pydantic)
```

**Verification:** `python -c "from app.schemas.auth_schema import RegisterRequest; print('OK')"`

---

## Phase 4: Core Security & Dependencies (Day 4)

> Depends on: Phase 1, 3. Used by routes and middleware.

```
4.1  exceptions/custom_exceptions.py   (no deps)
4.2  exceptions/handlers.py            (custom_exceptions.py)
4.3  core/security.py                  (config.py, enums, schemas/auth_schema.py)
4.4  core/dependencies.py              (security.py, session.py, models/user.py)
4.5  utils/helpers.py                  (no deps)
4.6  utils/validators.py               (no deps)
4.7  utils/file_utils.py               (config.py)
4.8  utils/date_utils.py               (no deps)
```

**Verification:** `python -c "from app.core.dependencies import get_db; print('OK')"`

---

## Phase 5: External Clients (Day 5)

> Depends on: Phase 1. Independent from repositories.

```
5.1  clients/s3_client.py       (config.py, exceptions)
5.2  clients/ocr_client.py      (config.py, exceptions, constants.py)
5.3  clients/gemini_client.py   (config.py, exceptions, constants.py)
```

**Verification:** Unit tests with mocked boto3, google-genai, easyocr

---

## Phase 6: Repositories (Day 5-6)

> Depends on: Phase 2, 3, 4. Pure database access layer.

```
6.1  repositories/user_repository.py       (models, session.py)
6.2  repositories/statement_repository.py  (models, session.py)
6.3  repositories/transaction_repository.py (models, session.py)
6.4  repositories/analytics_repository.py  (models, session.py)
6.5  repositories/admin_repository.py      (models, session.py)
```

**Verification:** Integration tests against test database

---

## Phase 7: Services (Day 6-8)

> Depends on: Phase 4, 5, 6. Orchestration layer.

```
7.1  services/auth_service.py       (user_repo, security.py, Redis)
7.2  services/user_service.py       (user_repo)
7.3  services/statement_service.py  (statement_repo, transaction_repo, s3_client, ocr_client, gemini_client)
7.4  services/analytics_service.py  (transaction_repo)
7.5  services/health_score_service.py (analytics_repo, analytics_service, gemini_client)
7.6  services/risk_profile_service.py (analytics_repo, gemini_client, ml_models)
7.7  services/portfolio_service.py  (analytics_repo, gemini_client)
7.8  services/ai_coach_service.py   (analytics_repo, gemini_client, analytics_service)
7.9  services/admin_service.py      (admin_repo)
```

**Verification:** Unit tests with mocked repos and clients

---

## Phase 8: Middleware (Day 8)

> Depends on: Phase 1, 4. Applied before routes.

```
8.1  middleware/logging_middleware.py    (logger.py)
8.2  middleware/rate_limit_middleware.py (config.py, Redis, exceptions)
```

---

## Phase 9: API Routes (Day 9-11)

> Depends on: Phase 3, 4, 7. Final layer before testing.

```
9.1  api/v1/auth_routes.py          (auth_service, schemas)
9.2  api/v1/user_routes.py          (user_service, schemas, dependencies)
9.3  api/v1/statement_routes.py     (statement_service, schemas, dependencies)
9.4  api/v1/transaction_routes.py   (analytics_service, statement_service, schemas)
9.5  api/v1/health_score_routes.py  (health_score_service, schemas)
9.6  api/v1/risk_profile_routes.py  (risk_profile_service, schemas)
9.7  api/v1/portfolio_routes.py     (portfolio_service, schemas)
9.8  api/v1/ai_coach_routes.py      (ai_coach_service, schemas)
9.9  api/v1/admin_routes.py         (admin_service, schemas, security.require_roles)
9.10 api/v1/router.py               (all route modules)
```

---

## Phase 10: Application Assembly (Day 11)

```
10.1 main.py           (router, middleware, exceptions, config, logger)
10.2 database/seed.py  (models, session, security)
10.3 alembic/          (all models via models/__init__.py)
```

**Verification:** Full integration test suite passes

---

## Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION                                        │
│  enums → config → logger → constants → base → session      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  PHASE 2: MODELS                                            │
│  role → user → statement → transaction → health_score       │
│       → risk_profile → portfolio → ai_conversation         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  PHASE 3: SCHEMAS (parallel with phase 2)                   │
│  auth → user → statement → transaction → health → risk      │
│       → portfolio → ai                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  PHASE 4: CORE SECURITY + UTILS                            │
│  exceptions → security → dependencies → utils               │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  PHASE 5        │   │  PHASE 6        │
│  CLIENTS        │   │  REPOSITORIES   │
│  s3, ocr,gemini │   │  user, statement│
│                 │   │  transaction,   │
│                 │   │  analytics,     │
│                 │   │  admin          │
└────────┬────────┘   └────────┬────────┘
         └────────────┬────────┘
                      ▼
┌─────────────────────────────────────────┐
│  PHASE 7: SERVICES                      │
│  auth → user → statement → analytics   │
│       → health → risk → portfolio → ai  │
│       → admin                           │
└──────────────────────┬──────────────────┘
                       │
┌──────────────────────▼──────────────────┐
│  PHASE 8+9: MIDDLEWARE + ROUTES         │
│  logging_mw → rate_limit_mw → routes    │
└──────────────────────┬──────────────────┘
                       │
┌──────────────────────▼──────────────────┐
│  PHASE 10: MAIN.PY + SEED + ALEMBIC     │
└─────────────────────────────────────────┘
```

---

## Parallel Work Streams

When multiple developers are available:

```
Stream A (Backend Core):
  Phases 1 → 2 → 4 → 6 → 7.1, 7.2

Stream B (AI/OCR):
  Phases 1 → 3 → 5 → 7.3, 7.5, 7.6, 7.7, 7.8

Stream C (Frontend):
  Start after Phase 3 (schemas define API contract)
  Phase F1 → F2 → F3 → F4 (frontend phases run in parallel)

Stream D (DevOps):
  CI/CD pipeline, Docker files, GitHub Actions
  (independent of all code phases)
```

---

## Frontend Development Order

```
F1: Foundation
  vite.config.ts → tsconfig.json → tailwind.config.ts
  → types/ → utils/constants.ts → services/api.ts

F2: Auth
  store/authStore.ts → services/authService.ts
  → pages/Auth/ → components/layouts/AuthLayout.tsx

F3: Layout + Common
  components/layouts/DashboardLayout.tsx
  → store/uiStore.ts → components/common/*

F4: Feature Pages (can be parallelized)
  Upload → Transactions → HealthScore → RiskProfile
  → Portfolio → AICoach → Reports → Admin

F5: Polish
  Loading skeletons → Error boundaries → Responsive → Dark mode
```
