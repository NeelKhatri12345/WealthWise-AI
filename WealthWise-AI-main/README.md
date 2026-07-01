# WealthWise AI 💰

> **AI-powered personal finance platform** — Bank statement analysis, health scoring, risk profiling, portfolio recommendations, and intelligent financial coaching powered by Google Gemini.

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🏗️ Architecture

```
wealthwise-ai/
├── backend/          # Python FastAPI backend
├── frontend/         # React TypeScript frontend
├── docs/             # Architecture & API documentation
├── scripts/          # Deployment & database utilities
└── .github/          # CI/CD workflows & issue templates
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.13, FastAPI, SQLAlchemy 2.x, Alembic |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Highcharts |
| **Database** | PostgreSQL 16, Redis 7 |
| **AI/ML** | Google Gemini 2.5 Flash, scikit-learn |
| **OCR** | EasyOCR, PaddleOCR, pdfplumber |
| **Storage** | AWS S3 / MinIO (dev) |
| **Infrastructure** | Docker, AWS EC2, AWS RDS, GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop 4.x+
- Python 3.13+
- Node.js 20+

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/wealthwise-ai.git
cd wealthwise-ai
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (minimum: SECRET_KEY, JWT_SECRET_KEY, GEMINI_API_KEY)
```

### 2. Start Infrastructure
```bash
docker compose up postgres redis minio minio_setup -d
```

### 3. Backend Setup
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
# source .venv/bin/activate                       # Linux/macOS
pip install -r requirements.txt
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install && npm run dev
```

**Access:**
- 🔗 API: http://localhost:8000
- 📖 Swagger: http://localhost:8000/docs
- 🌐 Frontend: http://localhost:5173
- 🗄️ pgAdmin: http://localhost:5050

---

## 📁 Key Features

| Feature | Description |
|---------|-------------|
| 📄 **Statement Upload** | PDF/CSV bank statement upload with OCR extraction |
| 🤖 **AI Parsing** | Gemini-powered transaction extraction and categorization |
| 💯 **Health Score** | 0-100 financial health score with AI explanations |
| 📊 **Risk Profile** | ML-based investment risk profiling (Conservative/Moderate/Aggressive) |
| 💼 **Portfolio** | AI-generated portfolio allocations and fund recommendations |
| 💬 **AI Coach** | Conversational financial coaching with personal context |
| 🔐 **Auth** | JWT with refresh token rotation, RBAC (Admin/Analyst/User) |
| 📈 **Analytics** | Interactive Highcharts dashboards for spending patterns |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [System Overview](docs/architecture/01_system_overview.md) | High-level architecture, tech decisions |
| [Database Design](docs/architecture/02_database_design.md) | ERD, table specs, index strategy |
| [OCR & AI Integration](docs/architecture/03_ocr_ai_integration.md) | OCR pipeline, Gemini flows |
| [Security Architecture](docs/architecture/04_security_architecture.md) | JWT, RBAC, rate limiting |
| [Docker & Deployment](docs/architecture/05_docker_deployment.md) | Docker, AWS, scaling |
| [Backend Files](docs/architecture/06_backend_file_responsibilities.md) | Every file explained |
| [Frontend Architecture](docs/architecture/07_frontend_architecture.md) | React structure, state, routing |
| [Development Order](docs/architecture/08_development_order.md) | Implementation sequence |
| [API Reference](docs/api/api_reference.md) | All endpoints documented |
| [Dev Setup Guide](docs/setup/development_setup.md) | Step-by-step setup |
| [Testing Strategy](docs/setup/testing_strategy.md) | Test patterns and fixtures |

---

## 🔧 Scripts

```bash
# Database utilities
./scripts/db/db_utils.sh migrate    # Apply migrations
./scripts/db/db_utils.sh rollback   # Rollback one migration
./scripts/db/db_utils.sh backup     # Create backup
./scripts/db/db_utils.sh seed       # Seed default data

# Deploy
./scripts/deploy/deploy.sh staging      # Deploy to staging
./scripts/deploy/deploy.sh production   # Deploy to production
```

---

## 🧪 Testing

```bash
cd backend

# All tests
pytest

# Unit tests only
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# With coverage
pytest --cov=app --cov-report=html
```

---

## 🌿 Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (protected, 2 reviews) |
| `develop` | Staging (protected, 1 review) |
| `feature/*` | New features → PR to develop |
| `fix/*` | Bug fixes → PR to develop |
| `hotfix/*` | Emergency fixes → PR to main + develop |

See [.github/BRANCHING_STRATEGY.md](.github/BRANCHING_STRATEGY.md) for full details.

---

## 🚢 CI/CD Pipelines

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `backend-ci.yml` | Push/PR to backend/** | Lint, Unit Tests, Integration Tests, Security Scan, Docker Build |
| `frontend-ci.yml` | Push/PR to frontend/** | ESLint, TypeCheck, Tests, Build |
| `deploy.yml` | Push to main | Tests → Build → ECR Push → Staging Deploy → Prod Deploy |
| `pr-checks.yml` | Every PR | PR title validation, auto-labeling, review checklist |

---

## 🔒 Security

- JWT access tokens (15 min) + refresh tokens (7 days, rotating)
- bcrypt password hashing (cost=12)
- Redis-backed rate limiting (100 req/min global, 10 req/min AI)
- RBAC with 3 roles: Admin, Analyst, User
- S3 pre-signed URLs (15 min TTL) — no direct file exposure
- Input validation via Pydantic V2
- SQL injection prevention via SQLAlchemy parameterized queries
- Secrets in environment variables only (never in code)

---

## 👥 Default Credentials (Development Only)

| Service | URL | Email | Password |
|---------|-----|-------|----------|
| API Admin | localhost:8000/docs | admin@wealthwise.ai | Admin@123 |
| pgAdmin | localhost:5050 | admin@wealthwise.ai | admin |
| MinIO | localhost:9001 | minioadmin | minioadmin123 |

> ⚠️ **Never use default credentials in production!**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
