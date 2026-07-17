# WealthWise AI — Docker & Deployment Architecture

---

## 1. Docker Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT DOCKER COMPOSE                      │
│                   (docker-compose.yml at root)                    │
└──────────────────────────────────────────────────────────────────┘

wealthwise_network (bridge)
├── wealthwise_api          (FastAPI : 8000)
│     ├─ depends on: postgres (healthy), redis (healthy)
│     ├─ volumes: ./backend:/app (hot reload)
│     ├─ volumes: ml_models (read-only)
│     └─ env_file: ./backend/.env
│
├── wealthwise_postgres     (PostgreSQL 16 : 5432)
│     └─ volumes: postgres_data:/var/lib/postgresql/data
│
├── wealthwise_redis        (Redis 7 : 6379)
│     └─ volumes: redis_data:/data
│
├── wealthwise_minio        (MinIO : 9000, console: 9001)
│     └─ volumes: minio_data:/data
│
├── wealthwise_minio_setup  (one-shot bucket creation)
│     └─ depends on: minio (healthy)
│
└── wealthwise_pgadmin      (pgAdmin4 : 5050)
      └─ depends on: postgres
```

---

## 2. Multi-Stage Dockerfile

```
backend/Dockerfile — 3 Stages:

┌─────────────────────────────────────────────┐
│  Stage 1: builder                            │
│  ├─ FROM python:3.13-slim                   │
│  ├─ Install build tools (gcc, etc.)         │
│  ├─ pip install --no-cache-dir requirements │
│  └─ Produces: /app/venv                     │
└────────────────────┬────────────────────────┘
                     │ COPY venv only
                     ▼
┌─────────────────────────────────────────────┐
│  Stage 2: runtime (target for production)   │
│  ├─ FROM python:3.13-slim (minimal image)   │
│  ├─ Create non-root user: appuser           │
│  ├─ COPY --from=builder /app/venv           │
│  ├─ COPY app source code                    │
│  ├─ EXPOSE 8000                             │
│  └─ CMD uvicorn app.main:app                │
└─────────────────────────────────────────────┘

Security Properties:
  ✓ Non-root user (UID 1001)
  ✓ Read-only filesystem (prod)
  ✓ No build tools in runtime image
  ✓ Minimal attack surface
  ✓ Layer caching: deps change rarely
```

---

## 3. Production AWS Architecture

```
                              ┌─────────────────────────────┐
Internet ─────────────────────► AWS Route 53 (DNS)           │
                              └──────────────┬──────────────┘
                                             │ wealthwise.ai
                                             ▼
                              ┌─────────────────────────────┐
                              │  AWS CloudFront (CDN)        │
                              │  ├─ Static assets (React)   │
                              │  ├─ Edge cache               │
                              │  └─ DDoS protection          │
                              └──────┬──────────────┬────────┘
                                     │ /api/*        │ /*
                                     ▼              ▼
               ┌─────────────────────────┐  ┌──────────────────┐
               │  AWS ALB                │  │  AWS S3 (Static) │
               │  (Application Load      │  │  React SPA build  │
               │  Balancer)              │  │  index.html       │
               │  ├─ SSL termination     │  └──────────────────┘
               │  ├─ Health checks       │
               │  └─ Target groups       │
               └──────────┬──────────────┘
                          │
                ┌─────────┴─────────┐
                │ AWS EC2 Auto      │
                │ Scaling Group     │
                │ ┌───────────────┐ │
                │ │ EC2 t3.medium │ │
                │ │ Docker +      │ │
                │ │ FastAPI       │ │
                │ └───────────────┘ │
                │ ┌───────────────┐ │
                │ │ EC2 t3.medium │ │
                │ │ (replica)     │ │
                │ └───────────────┘ │
                └─────┬─────────────┘
                      │         (Private Subnets)
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
┌──────────────┐ ┌──────────┐ ┌────────────┐
│ AWS RDS      │ │ AWS      │ │ AWS S3     │
│ PostgreSQL   │ │ ElastiC- │ │ (Documents │
│ Multi-AZ     │ │ ache     │ │  Bucket)   │
│ ├─ Primary   │ │ Redis    │ │            │
│ └─ Standby   │ │ Cluster  │ └────────────┘
└──────────────┘ └──────────┘
```

---

## 4. Environment Architecture

| Environment | Infrastructure | Database | Redis | Storage |
|------------|----------------|----------|-------|---------|
| **Development** | Docker Compose (local) | PostgreSQL container | Redis container | MinIO container |
| **Staging** | Single EC2 t3.small | RDS t3.micro | ElastiCache t3.micro | S3 bucket (staging-) |
| **Production** | EC2 ASG t3.medium × N | RDS Multi-AZ db.t3.medium | ElastiCache cluster | S3 bucket (prod-) |

---

## 5. Container Health Check Configuration

```yaml
# FastAPI
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s

# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U wealthwise_user -d wealthwise_db"]
  interval: 5s
  timeout: 5s
  retries: 10
  start_period: 10s

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
  retries: 5
```

---

## 6. Zero-Downtime Deployment Strategy

```
Deploy Flow (GitHub Actions → EC2):

1. Build new Docker image
2. Push to ECR (Elastic Container Registry)
3. Run database migrations:
   alembic upgrade head
   (Alembic is backward-compatible; new columns nullable)
4. Rolling update via ALB:
   ├─ Register new instance with ALB
   ├─ Wait for health check pass (3 consecutive)
   ├─ Deregister old instance
   └─ Terminate old instance
5. Smoke test:
   curl https://api.wealthwise.ai/health
6. Rollback on failure:
   ├─ alembic downgrade -1
   └─ re-register old instance
```

---

## 7. Log Architecture

```
Logging Strategy: Rotating File Handler + Stdout

File: app/core/logger.py
Handler: TimedRotatingFileHandler
  ├─ Filename: app/logs/wealthwise_api.log
  ├─ Rotation: Every hour (when='h', interval=1)
  ├─ Retention: 168 hours (7 days) of files
  └─ Format: JSON structured logging

Log Levels by Environment:
  Development:  DEBUG (verbose)
  Staging:      INFO
  Production:   WARNING (errors only to file, INFO to CloudWatch)

Log Fields (every log entry):
{
  "timestamp": "2026-06-24T12:00:00.000Z",
  "level": "INFO",
  "logger": "wealthwise.api",
  "message": "Request completed",
  "request_id": "uuid",
  "method": "GET",
  "path": "/api/v1/users/me",
  "status_code": 200,
  "duration_ms": 23.4,
  "user_id": "uuid"    // if authenticated
}

Production Aggregation:
  EC2 → CloudWatch Agent → CloudWatch Logs
  CloudWatch → CloudWatch Insights (queries)
  CloudWatch → Alerts → SNS → Email/Slack
```

---

## 8. Scaling Strategy

```
Horizontal Scaling (EC2 Auto Scaling):
  Min: 2 instances (high availability)
  Max: 10 instances
  Scale-out trigger: CPU > 70% for 5 minutes
  Scale-in trigger: CPU < 30% for 20 minutes
  Cooldown: 300 seconds

Stateless Design (enables horizontal scaling):
  ✓ JWT tokens (no server-side sessions)
  ✓ Redis for rate limiting (shared state)
  ✓ S3 for file storage (not local disk)
  ✓ PostgreSQL connection pooling per instance

Database Scaling:
  ├─ Read replicas for analytics queries
  ├─ PgBouncer connection pooler (future)
  └─ Partitioning: transactions table by user_id (future, >10M rows)
```

---

## 9. Backup & Recovery

```
PostgreSQL Backup:
  ├─ RDS automated backups: daily, 7-day retention
  ├─ RDS manual snapshots: before each deployment
  ├─ Point-in-time recovery: 5-minute granularity
  └─ Cross-region backup: enabled (DR)

S3 Backup:
  ├─ Versioning enabled on statement bucket
  └─ S3 replication to secondary region

RTO (Recovery Time Objective):  < 1 hour
RPO (Recovery Point Objective): < 5 minutes
```
