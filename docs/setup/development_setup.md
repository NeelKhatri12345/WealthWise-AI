# WealthWise AI — Development Setup Guide

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.13+ | Backend runtime |
| Node.js | 20+ (LTS) | Frontend tooling |
| Docker Desktop | 4.x+ | Local infrastructure |
| Git | 2.x+ | Version control |
| VS Code | Latest | Recommended IDE |

---

## 1. Clone Repository

```bash
git clone https://github.com/your-org/wealthwise-ai.git
cd wealthwise-ai
```

---

## 2. Backend Setup

### 2.1 Create Virtual Environment

```bash
cd backend

# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python -m venv .venv
source .venv/bin/activate
```

### 2.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
# Minimum required for development:
# SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
# POSTGRES_PASSWORD=devpassword123
# JWT_SECRET_KEY=<another random hex>
# GEMINI_API_KEY=<from Google AI Studio>
```

### 2.4 Start Infrastructure (Docker)

```bash
# From project root
docker compose up postgres redis minio minio_setup -d

# Verify all services are healthy
docker compose ps
```

### 2.5 Run Migrations

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Seed default data (roles + admin user)
python -m app.database.seed
```

### 2.6 Copy ML Models

```bash
# From project root — copy existing pkl files into backend
cp risk_profile_model.pkl backend/app/ml_models/
cp risk_label_encoder.pkl backend/app/ml_models/
```

### 2.7 Start Development Server

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app
```

API available at: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

---

## 3. Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Configure Environment

```bash
cp .env.example .env.local

# .env.local contents:
# VITE_API_BASE_URL=http://localhost:8000/api/v1
# VITE_APP_NAME=WealthWise AI
```

### 3.3 Start Development Server

```bash
npm run dev
```

Frontend available at: `http://localhost:5173`

---

## 4. Start Everything with Docker Compose

For the full stack (API + DB + Redis + MinIO + pgAdmin):

```bash
# From project root
docker compose up --build

# Services:
# FastAPI API:    http://localhost:8000
# pgAdmin:        http://localhost:5050
# MinIO Console:  http://localhost:9001
```

---

## 5. Default Credentials (Development Only)

| Service | URL | User | Password |
|---------|-----|------|----------|
| API (Swagger) | http://localhost:8000/docs | — | — |
| pgAdmin | http://localhost:5050 | admin@wealthwise.ai | admin |
| MinIO Console | http://localhost:9001 | minioadmin | minioadmin123 |
| Default Admin User | — | admin@wealthwise.ai | Admin@123 |

> ⚠️ **Never use these credentials in production!**

---

## 6. Running Tests

```bash
cd backend

# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific module
pytest tests/unit/services/test_auth_service.py -v

# Watch mode
pytest --watch tests/
```

---

## 7. Running Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "add_column_to_users"

# Apply all pending
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history --verbose
```

---

## 8. Common Development Commands

```bash
# Format code (backend)
black app/
isort app/

# Lint (backend)
flake8 app/
mypy app/

# Format code (frontend)
npm run lint
npm run format

# Type check (frontend)
npm run typecheck

# Build frontend for production
npm run build

# Preview production build
npm run preview
```

---

## 9. VS Code Setup

Recommended extensions:
- **Python** (Microsoft)
- **Pylance** (type checking)
- **Ruff** (fast linting)
- **ESLint**
- **Prettier**
- **Tailwind CSS IntelliSense**
- **Thunder Client** (API testing)

`.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 10. Troubleshooting

### PostgreSQL Connection Refused
```bash
# Check if postgres container is healthy
docker compose ps postgres
# Should show: healthy

# Check logs
docker compose logs postgres

# Try connecting manually
docker exec -it wealthwise_postgres psql -U wealthwise_user -d wealthwise_db
```

### Alembic "Target database is not up to date"
```bash
# Reset and re-apply
alembic downgrade base
alembic upgrade head
```

### ML Model Not Found Warning
```bash
# Ensure model files are in the correct location
ls backend/app/ml_models/
# Should show: risk_profile_model.pkl, risk_label_encoder.pkl
```

### GEMINI_API_KEY Error
- Get key from: https://aistudio.google.com/app/apikey
- Add to `.env` file: `GEMINI_API_KEY=your_key_here`
- Restart the API server

### Port Already in Use
```bash
# Find what's using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/macOS

# Kill the process or change APP_PORT in .env
```
