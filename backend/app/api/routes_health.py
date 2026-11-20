"""FujiNova Health & Diagnostics Router."""
import asyncio
from fastapi import APIRouter, status
from google import genai
from google.genai.errors import APIError

from backend.app.core.config import settings
from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Verify backend API, database readiness, and active Gemini free-tier configuration."""
    settings.reload_from_env()
    db_status = "disconnected"
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            if cursor.fetchone()[0] == 1:
                db_status = "connected (SQLite WAL)"
    except Exception as e:
        db_status = f"error: {str(e)}"

    is_ok = db_status == "connected (SQLite WAL)"
    return {
        "status": "ok" if is_ok else "degraded",
        "database": db_status,
        "environment": settings.FUJINOVA_ENV,
        "active_provider": settings.active_provider,
        "active_model": settings.active_model,
        "primary_model": settings.active_model,
        "free_only_mode": settings.FREE_ONLY_MODE,
        "openai_fallback_disabled": not settings.ENABLE_OPENAI_FALLBACK,
        "fallback_model_enabled": settings.ENABLE_OPENAI_FALLBACK,
        "gemini_configured": settings.is_gemini_configured,
        "openai_configured": False
    }


@router.post("/diagnostics/ai-test")
async def diagnostic_ai_test():
    """Safely test Gemini API connectivity without exposing credentials or incurring costs."""
    settings.reload_from_env()
    if not settings.is_gemini_configured:
        return {
            "status": "unconfigured",
            "provider": "google",
            "model": settings.active_model,
            "free_tier": True,
            "message": "GEMINI_API_KEY is not configured or contains placeholder text in FujiNova/.env."
        }

    try:
        key = settings.GEMINI_API_KEY.strip().strip("'\"").strip()
        client = genai.Client(api_key=key)
        async with asyncio.timeout(10.0):
            response = await client.aio.models.generate_content(
                model=settings.active_model,
                contents="Ping"
            )
        return {
            "status": "connected",
            "provider": "google",
            "model": settings.active_model,
            "free_tier": True,
            "message": "Google Gemini free-tier API connected and operational."
        }
    except APIError as e:
        code = getattr(e, "code", None)
        msg = str(e)
        if code in (400, 401, 403) or "API_KEY_INVALID" in msg:
            return {
                "status": "auth_failed",
                "provider": "google",
                "model": settings.active_model,
                "free_tier": True,
                "message": "Gemini authentication failed (Invalid API Key). Check GEMINI_API_KEY in FujiNova/.env."
            }
        if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            return {
                "status": "quota_exceeded",
                "provider": "google",
                "model": settings.active_model,
                "free_tier": True,
                "message": "Google Gemini free-tier quota exhausted. Please try again later."
            }
        if code == 404 or "not found" in msg.lower() or "no longer available" in msg.lower():
            return {
                "status": "model_unavailable",
                "provider": "google",
                "model": settings.active_model,
                "free_tier": True,
                "message": f"Gemini model '{settings.active_model}' is unavailable on this free tier."
            }
        if code == 503 or "high demand" in msg.lower():
            return {
                "status": "high_demand",
                "provider": "google",
                "model": settings.active_model,
                "free_tier": True,
                "message": "Google Gemini free-tier is experiencing temporary high demand spikes. Please retry in a moment."
            }
        return {
            "status": "error",
            "provider": "google",
            "model": settings.active_model,
            "free_tier": True,
            "message": f"Gemini API returned error: {msg}"
        }
    except (asyncio.TimeoutError, TimeoutError):
        return {
            "status": "timeout",
            "provider": "google",
            "model": settings.active_model,
            "free_tier": True,
            "message": "Request to Google Gemini timed out (10s)."
        }
    except Exception as e:
        return {
            "status": "error",
            "provider": "google",
            "model": settings.active_model,
            "free_tier": True,
            "message": f"Connection check failed: {str(e)}"
        }
