"""Tests for FujiNova Chat SSE Streaming API Endpoint."""
import json
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.agent.hana import agent as hana_agent


def test_chat_sse_stream_endpoint(client: TestClient, monkeypatch):
    """Verify POST /api/v1/chat/stream streams SSE events."""
    payload = {
        "session_id": "test_sse_session_1",
        "message": "Hello Hana! I am planning a trip with my family."
    }

    response = client.post("/api/v1/chat/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    body = response.text
    assert "event: token" in body or "event: done" in body or "event: error" in body

    # Verify session retrieval
    session_resp = client.get("/api/v1/chat/sessions/test_sse_session_1")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["session_id"] == "test_sse_session_1"
    assert "profile" in session_data


def test_chat_sse_error_event_on_llm_failure(client: TestClient):
    """Verify that when the LLM throws an exception, SSE yields event: error with structured Gemini error code."""
    async def mock_failing_chat(*args, **kwargs):
        raise ValueError("GEMINI_API_KEY is not configured or contains placeholder text.")
        yield ""

    with patch.object(hana_agent, "chat", mock_failing_chat):
        payload = {
            "session_id": "test_error_session_99",
            "message": "Tell me about Japanese Omotenashi."
        }
        response = client.post("/api/v1/chat/stream", json=payload)
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        body = response.text
        assert "event: error" in body
        assert "GEMINI_API_KEY_MISSING" in body
        assert "Google Gemini API key is missing" in body


def test_chat_sse_quota_exhausted_event(client: TestClient):
    """Verify that HTTP 429 / quota exhaustion yields GEMINI_QUOTA_EXCEEDED with clear guidance."""
    async def mock_quota_chat(*args, **kwargs):
        raise ValueError("429 RESOURCE_EXHAUSTED: Quota exceeded for model gemini-2.0-flash.")
        yield ""

    with patch.object(hana_agent, "chat", mock_quota_chat):
        payload = {
            "session_id": "test_quota_session_100",
            "message": "Give me travel recommendations."
        }
        response = client.post("/api/v1/chat/stream", json=payload)
        assert response.status_code == 200
        body = response.text
        assert "event: error" in body
        assert "GEMINI_QUOTA_EXCEEDED" in body
        assert "FREE AI QUOTA EXCEEDED" in body
