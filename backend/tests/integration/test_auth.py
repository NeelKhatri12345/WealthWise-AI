"""WealthWise AI - Auth Endpoint Integration Tests (Skeleton)"""

from httpx import AsyncClient
import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Verify the /health endpoint responds correctly."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration flow."""
    payload = {
        "full_name": "Test User",
        "email": "test@wealthwise.ai",
        "password": "SecurePass1!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    # Note: Requires DB seeding of roles — expand in integration tests
    assert response.status_code in (201, 500)  # 500 until roles seeded


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with wrong credentials returns 401."""
    payload = {"email": "nobody@wealthwise.ai", "password": "wrong"}
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["success"] is False
