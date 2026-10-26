import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data

@pytest.mark.asyncio
async def test_auth_registration_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Invalid short password
        response = await ac.post("/api/v1/auth/register", json={
            "full_name": "Test User",
            "email": "invalid@test.com",
            "password": "123"
        })
    assert response.status_code == 422 # Pydantic validation error

@pytest.mark.asyncio
async def test_invalid_login_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": "nonexistent@voxai.internal",
            "password": "WrongPassword123!"
        })
    # Returns 401 Unauthorized
    assert response.status_code in [401, 404]
