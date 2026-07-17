# WealthWise AI — Testing Strategy

---

## 1. Testing Philosophy

WealthWise AI follows the **Testing Pyramid**:

```
        ┌──────────────────┐
        │  E2E / Integration│  (10%) — Playwright, HTTPx
        │    Tests          │
        └────────┬─────────┘
                 │
        ┌────────┴─────────┐
        │  Integration      │  (30%) — pytest-asyncio + TestClient
        │  API Tests        │         Real DB (SQLite or PG test DB)
        └────────┬─────────┘
                 │
        ┌────────┴─────────┐
        │  Unit Tests       │  (60%) — pytest + mocks
        │  Service/Utils    │         Fast, isolated, no I/O
        └──────────────────┘
```

---

## 2. Directory Structure

```
backend/tests/
├── conftest.py              # Shared fixtures (app, db, client, user)
├── factories.py             # factory-boy model factories
│
├── unit/
│   ├── test_security.py     # hash_password, decode_token, create_token
│   ├── test_validators.py   # File validators, date utils, helpers
│   ├── test_health_score.py # Score calculation logic
│   ├── test_risk_profile.py # ML feature assembly
│   └── services/
│       ├── test_auth_service.py
│       ├── test_statement_service.py
│       └── test_analytics_service.py
│
└── integration/
    ├── test_auth_routes.py          # Login, register, refresh flows
    ├── test_statement_routes.py     # Upload, list, delete
    ├── test_transaction_routes.py   # Filter, paginate, summary
    ├── test_health_score_routes.py  # Calculate, history
    ├── test_risk_profile_routes.py  # Predict, latest
    ├── test_portfolio_routes.py     # Generate
    ├── test_ai_coach_routes.py      # Chat (mocked Gemini)
    └── test_admin_routes.py         # RBAC enforcement
```

---

## 3. Fixtures (conftest.py)

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.database.base import Base
from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.enums.role_enum import RoleEnum

# Use SQLite for unit/integration tests (fast, no external dep)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
def user_token():
    return create_access_token(subject="test-user-uuid", role=RoleEnum.USER.value)

@pytest.fixture
def admin_token():
    return create_access_token(subject="test-admin-uuid", role=RoleEnum.ADMIN.value)

@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
```

---

## 4. Unit Test Examples

### Auth Service Tests
```python
# tests/unit/services/test_auth_service.py

async def test_register_success(client, db_session):
    response = await client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "hashed_password" not in data  # Never exposed

async def test_register_duplicate_email(client, db_session):
    # Register once
    await client.post("/api/v1/auth/register", json={...})
    # Register again with same email
    response = await client.post("/api/v1/auth/register", json={...})
    assert response.status_code == 409

async def test_login_invalid_password(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

async def test_login_success_returns_tokens(client):
    response = await client.post("/api/v1/auth/login", json={...})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
```

### Security Utility Tests
```python
# tests/unit/test_security.py

def test_hash_password_is_bcrypt():
    hashed = hash_password("TestPass123!")
    assert hashed.startswith("$2b$")

def test_verify_password_correct():
    hashed = hash_password("TestPass123!")
    assert verify_password("TestPass123!", hashed) is True

def test_verify_password_incorrect():
    hashed = hash_password("TestPass123!")
    assert verify_password("WrongPass!", hashed) is False

def test_create_access_token_has_required_claims():
    token = create_access_token(subject="user-uuid", role="user")
    payload = decode_token(token)
    assert payload.sub == "user-uuid"
    assert payload.role == "user"
    assert payload.type == "access"
    assert payload.jti is not None

def test_decode_expired_token_raises():
    from datetime import timedelta
    token = create_access_token("uuid", "user", expires_delta=timedelta(seconds=-1))
    with pytest.raises(UnauthorizedException):
        decode_token(token)
```

---

## 5. Integration Test Examples

### RBAC Tests
```python
# tests/integration/test_admin_routes.py

async def test_admin_stats_requires_admin_role(client, auth_headers):
    # Regular user cannot access admin endpoint
    response = await client.get("/api/v1/admin/stats", headers=auth_headers)
    assert response.status_code == 403

async def test_admin_stats_accessible_by_admin(client, admin_headers):
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data

async def test_unauthenticated_request_returns_401(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
```

### Statement Upload Tests (with mocked S3 + OCR)
```python
# tests/integration/test_statement_routes.py
from unittest.mock import AsyncMock, patch

async def test_upload_pdf_success(client, auth_headers):
    mock_s3 = AsyncMock(return_value="statements/user-id/test.pdf")
    mock_ocr = AsyncMock(return_value=("extracted text...", 0.92, "easyocr"))
    mock_gemini = AsyncMock(return_value={"transactions": [...]})

    with patch("app.clients.s3_client.S3Client.upload_file", mock_s3), \
         patch("app.clients.ocr_client.OCRClient.extract_text", mock_ocr), \
         patch("app.clients.gemini_client.GeminiClient.parse_statement", mock_gemini):

        with open("tests/fixtures/sample_statement.pdf", "rb") as f:
            response = await client.post(
                "/api/v1/statements/upload",
                headers=auth_headers,
                files={"file": ("statement.pdf", f, "application/pdf")},
            )

    assert response.status_code == 202
    assert response.json()["status"] == "PROCESSING"

async def test_upload_rejects_invalid_type(client, auth_headers):
    response = await client.post(
        "/api/v1/statements/upload",
        headers=auth_headers,
        files={"file": ("malware.exe", b"fake content", "application/octet-stream")},
    )
    assert response.status_code == 415  # Unsupported Media Type
```

---

## 6. Mocking Strategy

| Dependency | Test Strategy |
|-----------|---------------|
| Database | SQLite in-memory (via conftest fixture) |
| Redis | `fakeredis` library |
| S3 Client | `unittest.mock.AsyncMock` |
| Gemini API | `unittest.mock.AsyncMock` |
| OCR Client | `unittest.mock.AsyncMock` |
| Email | `unittest.mock.MagicMock` |
| ML Models | Pre-loaded test models (small fixtures) |

```bash
# Install test extras
pip install fakeredis pytest-asyncio aiosqlite
```

---

## 7. Test Configuration

```ini
# backend/pyproject.toml

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short --strict-markers"

markers = [
    "slow: marks tests as slow (deselect with '-m not slow')",
    "integration: marks integration tests",
    "unit: marks unit tests",
]

[tool.coverage.run]
source = ["app"]
omit = ["app/database/seed.py", "tests/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

---

## 8. CI Test Pipeline

```yaml
# Runs on every PR — see .github/workflows/backend-ci.yml

steps:
  1. Checkout code
  2. Setup Python 3.13
  3. Install dependencies (cached)
  4. Run unit tests: pytest tests/unit/ -v
  5. Run integration tests: pytest tests/integration/ -v
  6. Generate coverage report
  7. Fail if coverage < 80%
  8. Upload coverage to Codecov
```

---

## 9. Coverage Targets

| Module | Target Coverage |
|--------|----------------|
| `app/services/` | 85%+ |
| `app/core/security.py` | 95%+ |
| `app/utils/` | 90%+ |
| `app/api/v1/` | 80%+ |
| `app/repositories/` | 75%+ |
| **Overall** | **80%+** |
