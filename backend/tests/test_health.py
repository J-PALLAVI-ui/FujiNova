"""Tests for FujiNova Health and Info Endpoints (Acceptance Test T1-01)."""
from fastapi.testclient import TestClient
from backend.app.core.config import settings


def test_root_endpoint(client: TestClient):
    """Verify root endpoint provides API metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "FujiNova"
    assert data["version"] == "0.1.0"
    assert "/api/v1/health" in data["health_check"]


def test_health_check_endpoint(client: TestClient):
    """T1-01: Health check endpoint returns 200 OK with status: ok, database check, and model info."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected (SQLite WAL)"
    assert data["active_provider"] == "google"
    assert "gemini" in data["active_model"]
    assert data["free_only_mode"] is True
    assert data["openai_fallback_disabled"] is True
    assert "gemini_configured" in data
    assert isinstance(data["gemini_configured"], bool)
    assert data["fallback_model_enabled"] is False


def test_diagnostic_ai_test_endpoint(client: TestClient):
    """Verify diagnostic endpoint returns structured safe response without credentials."""
    response = client.post("/api/v1/diagnostics/ai-test")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["provider"] == "google"
    assert "gemini" in data["model"]
    assert data.get("free_tier") is True
    # Ensure no secrets or API keys are leaked in any diagnostic response
    assert "sk-" not in str(data)
    assert "AIza" not in str(data)
