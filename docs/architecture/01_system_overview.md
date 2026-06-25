# WealthWise AI — System Architecture Overview

> **Version:** 1.0.0 | **Last Updated:** 2026-06-24 | **Status:** Blueprint

---

## 1. Executive Summary

WealthWise AI is a full-stack, cloud-native AI personal finance platform built for scale, security, and extensibility. It combines a FastAPI Python backend, React TypeScript frontend, PostgreSQL database, Redis cache, S3-compatible object storage, and Google Gemini LLM to deliver an intelligent financial coaching experience.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS (Browser)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS CloudFront / CDN                         │
│              (Static Assets + Edge Caching)                     │
└──────────────┬──────────────────────────┬───────────────────────┘
               │ /api/*                   │ /*
               ▼                          ▼
┌──────────────────────┐     ┌────────────────────────────────────┐
│   AWS ALB / Nginx    │     │     React SPA (AWS S3 + CF)        │
│   (Load Balancer)    │     │     TypeScript + Vite Build         │
└──────────┬───────────┘     └────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│               FastAPI Application Servers                     │
│               (AWS EC2 Auto Scaling Group)                    │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Middleware  │  │  API Router  │  │  Background Tasks  │  │
│  │  Stack       │  │  v1          │  │  (Async Workers)   │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└──────────┬─────────────────┬──────────────────┬─────────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌─────────────────┐ ┌──────────────┐  ┌─────────────────────┐
│  AWS RDS        │ │  Redis       │  │  AWS S3             │
│  PostgreSQL 16  │ │  (Cache +    │  │  (Statement Files   │
│  (Primary +     │ │  Rate Limit) │  │   + OCR Results)    │
│   Read Replica) │ └──────────────┘  └─────────────────────┘
└─────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│          External Services               │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │ Google Gemini│  │  EasyOCR /       │  │
│  │ API (LLM)    │  │  PaddleOCR       │  │
│  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 3. Architecture Principles

| Principle | Implementation |
|-----------|---------------|
| **Separation of Concerns** | Strict layering: Route → Service → Repository → ORM |
| **Single Responsibility** | Each module has one job: route, service, repo, schema |
| **Dependency Inversion** | FastAPI DI system (`Depends`) — no manual instantiation |
| **Fail Fast** | Startup health checks; immediate exception propagation |
| **Defense in Depth** | JWT + RBAC + Rate Limiting + TrustedHost + CORS |
| **Observability First** | Structured JSON logging with request tracing on every layer |
| **Infrastructure as Code** | Docker Compose (dev), GitHub Actions (CI/CD), Terraform (prod) |
| **API-First Design** | OpenAPI 3.1 generated from code; versioned under `/api/v1` |

---

## 4. Layered Architecture (Backend MVC + Repository Pattern)

```
┌──────────────────────────────────────────────────────────┐
│  HTTP Request                                             │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  MIDDLEWARE LAYER                                         │
│  LoggingMiddleware → RateLimitMiddleware → CORSMiddleware │
│  → TrustedHostMiddleware → AuthMiddleware                 │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  ROUTE LAYER  (app/api/v1/*.py)                           │
│  • Parse and validate HTTP request                        │
│  • Apply authentication + RBAC dependencies               │
│  • Delegate to Service layer                              │
│  • Return Pydantic Response schemas                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  SERVICE LAYER  (app/services/*.py)                       │
│  • Orchestrate business logic                             │
│  • Coordinate multiple repositories                       │
│  • Call external clients (Gemini, S3, OCR)                │
│  • Raise domain-specific exceptions                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  REPOSITORY LAYER  (app/repositories/*.py)               │
│  • Database access only — no business logic              │
│  • Encapsulates SQLAlchemy queries                        │
│  • Returns ORM models or None                             │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  ORM / DATA LAYER  (app/models/*.py)                      │
│  • SQLAlchemy 2.x Mapped Column models                    │
│  • Alembic migrations                                     │
│  • PostgreSQL via asyncpg                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow: Bank Statement Upload

```
Client
  │
  │ POST /api/v1/statements/upload  (multipart/form-data)
  │
  ▼
statement_routes.py
  │  validates: file type, size, JWT auth
  │
  ▼
StatementService.process_upload()
  │
  ├─► S3Client.upload_file()        ──► AWS S3 (raw file)
  │
  ├─► OCRClient.extract_text()      ──► EasyOCR / PaddleOCR
  │      └─► raw_text, confidence_score
  │
  ├─► GeminiClient.parse_statement() ──► Gemini API
  │      └─► structured transactions JSON
  │
  ├─► StatementRepository.create()   ──► PostgreSQL (statement record)
  │
  └─► TransactionRepository.bulk_create()  ──► PostgreSQL (transactions)

Response: StatementResponse schema (id, status, transaction_count)
```

---

## 6. Request Lifecycle (Every API Call)

```
Incoming HTTP Request
        │
        ▼
[1] LoggingMiddleware
    ├─ Generate X-Request-ID (UUID)
    ├─ Log: method, path, client_ip, request_id
    └─ Start timer
        │
        ▼
[2] RateLimitMiddleware
    ├─ Check Redis key: rate:{client_ip}
    ├─ Increment counter (sliding window)
    └─ Return 429 if limit exceeded
        │
        ▼
[3] CORS / TrustedHost Middleware
    └─ Validate Origin / Host headers
        │
        ▼
[4] FastAPI Router
    ├─ Path matching
    └─ Dependency injection chain:
         get_db() → get_current_user() → require_roles()
        │
        ▼
[5] Route Handler
    └─ Call Service Layer
        │
        ▼
[6] Service Layer
    └─ Orchestrate repositories + external clients
        │
        ▼
[7] Repository Layer
    └─ Execute async SQLAlchemy query
        │
        ▼
[8] Response
    ├─ Pydantic model serialization
    ├─ LoggingMiddleware: log status + duration
    └─ Return HTTP Response with X-Request-ID header
```

---

## 7. Security Architecture

```
┌─────────────────────────────────────────────┐
│            Security Layers                   │
│                                             │
│  Layer 1: Network                           │
│   ├─ HTTPS/TLS (AWS ALB + ACM certificate) │
│   ├─ VPC with private subnets               │
│   └─ Security Groups (port restriction)     │
│                                             │
│  Layer 2: Application                       │
│   ├─ TrustedHostMiddleware                  │
│   ├─ CORS allowlist                         │
│   ├─ JWT RS256 access tokens (15 min)       │
│   ├─ JWT refresh tokens (7 days, Redis)     │
│   └─ Token JTI blacklist on logout          │
│                                             │
│  Layer 3: Authorization                     │
│   ├─ Role-Based Access Control (RBAC)       │
│   ├─ Roles: ADMIN, ANALYST, USER            │
│   └─ Per-endpoint role enforcement          │
│                                             │
│  Layer 4: Rate Limiting                     │
│   ├─ Global: 100 req/60s per IP            │
│   ├─ AI endpoints: 10 req/60s per user     │
│   └─ Redis sliding window counter           │
│                                             │
│  Layer 5: Data                              │
│   ├─ Passwords: bcrypt (cost=12)           │
│   ├─ Secrets: environment variables only   │
│   ├─ DB: parameterized queries (SQLAlchemy)│
│   └─ S3: pre-signed URLs (15 min TTL)     │
└─────────────────────────────────────────────┘
```

---

## 8. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Async Runtime** | asyncio + uvloop | 3-5x throughput vs sync for I/O-bound workloads |
| **ORM** | SQLAlchemy 2.x async | Type-safe, mature, aligns with Python 3.13 |
| **Token Store** | Redis | O(1) blacklist checks; TTL auto-expiry |
| **Object Storage** | S3 / MinIO | Decouples file storage from app; presigned URLs |
| **OCR** | EasyOCR + PaddleOCR | Dual-engine for accuracy; GPU-optional |
| **LLM** | Google Gemini 2.5 Flash | Fastest inference, multimodal, cost-effective |
| **State Management** | Zustand | Lightweight vs Redux; sufficient for scope |
| **Charts** | Highcharts | Financial-grade charting; candlestick, sparklines |
| **Build Tool** | Vite | Sub-second HMR; ESM native |
| **Container** | Docker + Compose | Reproducible environments; prod-ready |
