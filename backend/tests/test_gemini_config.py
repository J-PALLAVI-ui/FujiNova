"""Tests for Gemini Configuration, Key Validation, Router Provider Selection, and Zero Paid Calls."""
import pytest
from unittest.mock import patch

from backend.app.core.config import Settings
from backend.app.services.llm.base import AuthenticationError, FailoverPolicyViolationError
from backend.app.services.llm.gemini_adapter import GeminiAdapter
from backend.app.services.llm.openai_adapter import OpenAIAdapter
from backend.app.services.llm.router import ModelRouter


def test_valid_gemini_key_configuration():
    """Valid non-placeholder Gemini API key is correctly detected as configured."""
    s = Settings(
        GEMINI_API_KEY="my-secret-gemini-key-12345",
        FUJINOVA_PRIMARY_PROVIDER="google"
    )
    assert s.is_gemini_configured is True


def test_missing_gemini_key():
    """Missing or empty Gemini API key is detected as unconfigured and raises explicit error."""
    for empty_val in [None, "", "   "]:
        s = Settings(
            GEMINI_API_KEY=empty_val,
            FUJINOVA_PRIMARY_PROVIDER="google"
        )
        assert s.is_gemini_configured is False

    adapter = GeminiAdapter(api_key="")
    with pytest.raises(AuthenticationError) as exc_info:
        adapter._get_client()
    assert "not configured" in str(exc_info.value).lower()


def test_placeholder_gemini_keys():
    """Known placeholder strings and templates are rejected as unconfigured."""
    placeholders = [
        "your_gemini_api_key_here",
        "your_api_key_here",
        "placeholder",
        "your_google_ai_studio_key",
        "paste_your_key_here",
        "your_custom_key_template",
    ]
    for ph in placeholders:
        s = Settings(
            GEMINI_API_KEY=ph,
            FUJINOVA_PRIMARY_PROVIDER="google"
        )
        assert s.is_gemini_configured is False, f"Expected placeholder '{ph}' to be unconfigured"

        adapter = GeminiAdapter(api_key=ph)
        with pytest.raises(AuthenticationError) as exc_info:
            adapter._get_client()
        assert "placeholder" in str(exc_info.value).lower(), f"Expected placeholder error for '{ph}'"


def test_google_provider_selection_even_with_openai_key():
    """Explicitly configured Google provider selects GeminiAdapter, strictly ignoring OpenAI keys."""
    with patch("backend.app.services.llm.router.settings") as mock_settings:
        mock_settings.FUJINOVA_PRIMARY_PROVIDER = "google"
        mock_settings.FREE_ONLY_MODE = True
        mock_settings.OPENAI_API_KEY = "sk-proj-super-secret-key-that-must-be-ignored-12345"
        mock_settings.is_openai_configured = True
        mock_settings.active_provider = "google"
        mock_settings.GEMINI_MODEL = "gemini-3.8-flash"
        mock_settings.GEMINI_API_KEY = "dummy-key-12345"
        mock_settings.FUJINOVA_MAX_RETRIES = 1

        router = ModelRouter()
        assert isinstance(router.primary, GeminiAdapter)
        assert not isinstance(router.primary, OpenAIAdapter)
        assert router.fallback is None


def test_no_openai_fallback_in_free_only_mode():
    """In FREE_ONLY_MODE, failover to secondary paid providers is strictly blocked."""
    with patch("backend.app.services.llm.router.settings") as mock_settings:
        mock_settings.FUJINOVA_PRIMARY_PROVIDER = "google"
        mock_settings.FREE_ONLY_MODE = True
        mock_settings.ENABLE_OPENAI_FALLBACK = False
        mock_settings.ALLOW_MULTI_VENDOR_FAILOVER = False
        mock_settings.GEMINI_MODEL = "gemini-3.8-flash"
        mock_settings.GEMINI_API_KEY = "dummy-key-12345"
        mock_settings.FUJINOVA_MAX_RETRIES = 1

        router = ModelRouter()
        assert router.fallback is None
        assert router._is_failover_authorized() is False


def test_correct_gemini_model_selection():
    """GeminiAdapter constructor adheres to settings.GEMINI_MODEL."""
    with patch("backend.app.services.llm.gemini_adapter.settings") as mock_settings:
        mock_settings.GEMINI_MODEL = "gemini-3.8-flash"
        mock_settings.GEMINI_API_KEY = "dummy-key-12345"

        adapter = GeminiAdapter()
        assert adapter.model == "gemini-3.8-flash"

        # Explicit model override takes precedence
        custom_adapter = GeminiAdapter(model="custom-gemini-model")
        assert custom_adapter.model == "custom-gemini-model"


def test_no_key_prefix_check_enforced():
    """Keys without arbitrary prefix checks (like AIza) are accepted as valid credentials."""
    s = Settings(
        GEMINI_API_KEY="custom_opaque_token_without_prefix_12345",
        FUJINOVA_PRIMARY_PROVIDER="google"
    )
    assert s.is_gemini_configured is True
