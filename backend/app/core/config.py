"""FujiNova Backend Configuration."""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Derive absolute path to project root .env
_CONFIG_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _CONFIG_DIR.parent.parent.parent
_ROOT_ENV_PATH = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    # Server Environment
    FUJINOVA_ENV: str = Field("development", description="Environment: development, test, production")
    FUJINOVA_HOST: str = Field("127.0.0.1", description="Backend host address")
    FUJINOVA_PORT: int = Field(8000, description="Backend port number")
    DATABASE_URL: str = Field("sqlite:///./fujinova.db", description="SQLite connection string")

    # Primary Model Provider Configuration
    # Defaults strictly to 'google' (Google AI Studio Free Tier) for zero-cost operation
    FUJINOVA_PRIMARY_PROVIDER: str = Field("google", description="Primary AI provider ('google' or 'openai')")
    FUJINOVA_PRIMARY_MODEL: str = Field("gemini-3.5-flash-lite", description="Primary model identifier")

    # Google Gemini Configuration (Official google-genai SDK, Free AI Tier)
    GEMINI_API_KEY: Optional[str] = Field(None, description="Google AI Studio API key")
    GEMINI_MODEL: str = Field("gemini-3.5-flash-lite", description="Google Gemini free-tier model identifier")

    # Zero-Cost & Safety Safeguards
    # FREE_ONLY_MODE: Hard lock preventing any paid vendor calls (OpenAI)
    FREE_ONLY_MODE: bool = Field(True, description="Enforce strict ₹0 free-tier operation; disallow paid providers")
    ENABLE_OPENAI_FALLBACK: bool = Field(False, description="Strictly False: Never call paid OpenAI as fallback")
    ALLOW_MULTI_VENDOR_FAILOVER: bool = Field(False, description="Strictly False: Never allow cross-vendor failover")

    # OpenAI Configuration (Disabled in free-only mode)
    OPENAI_API_KEY: Optional[str] = Field(None, description="OpenAI API key (strictly unused in free mode)")
    OPENAI_MODEL: str = Field("gpt-4o-mini", description="OpenAI model identifier")
    OPENAI_MAX_OUTPUT_TOKENS: int = Field(1500, description="Max output tokens")
    OPENAI_TEMPERATURE: float = Field(0.7, description="Sampling temperature")
    OPENAI_TIMEOUT_SECONDS: float = Field(25.0, description="Request timeout")
    OPENAI_MAX_RETRIES: int = Field(0, description="Retries disabled for paid OpenAI")

    # Google Maps Platform Configuration (Guarded within monthly free allowance)
    GOOGLE_MAPS_API_KEY: Optional[str] = Field(None, description="Google Maps Platform API key (optional; guarded by free quota)")
    GOOGLE_MAPS_DAILY_LIMIT: int = Field(250, description="Daily limit for Google Maps requests to guarantee $0 spend")

    # Operational Parameters
    FUJINOVA_TEMPERATURE: float = Field(0.7, description="Default sampling temperature")
    FUJINOVA_MAX_RETRIES: int = Field(2, description="Maximum provider retry attempts")
    FUJINOVA_TIMEOUT_SECONDS: float = Field(25.0, description="Provider request timeout in seconds")
    CORS_ALLOWED_ORIGINS: str = Field("", description="Comma-separated allowed CORS origins")

    @property
    def is_gemini_configured(self) -> bool:
        """Check if a genuine, non-placeholder Google Gemini key is present."""
        if not self.GEMINI_API_KEY:
            return False
        key = str(self.GEMINI_API_KEY).strip().strip("'\"").strip()
        lower = key.lower()
        known_placeholders = {
            "",
            "your_gemini_api_key_here",
            "your_api_key_here",
            "placeholder",
            "your_google_ai_studio_key",
            "paste_your_key_here",
            "none",
            "null",
            "sk-placeholder",
        }
        if lower in known_placeholders or lower.startswith("your_") or lower.startswith("paste_"):
            return False
        return len(key) >= 5

    @property
    def is_openai_configured(self) -> bool:
        """Check if a genuine, non-placeholder OpenAI key is present."""
        if not self.OPENAI_API_KEY:
            return False
        key = self.OPENAI_API_KEY.strip()
        lower = key.lower()
        if lower in ("", "your_openai_api_key_here", "your_api_key_here", "sk-placeholder"):
            return False
        if lower.startswith("your_"):
            return False
        return len(key) >= 20 and (key.startswith("sk-") or key.startswith("sk-proj-"))

    @property
    def active_provider(self) -> str:
        """Normalized active provider name. In FREE_ONLY_MODE, strictly 'google'."""
        if self.FREE_ONLY_MODE:
            return "google"
        prov = (self.FUJINOVA_PRIMARY_PROVIDER or "").lower().strip()
        if prov == "google":
            return "google"
        if prov == "openai":
            return "openai"
        return "google"

    @property
    def active_model(self) -> str:
        """Resolve the effective model name matching the active provider."""
        if self.active_provider == "google":
            return self.GEMINI_MODEL or self.FUJINOVA_PRIMARY_MODEL or "gemini-3.5-flash-lite"
        return self.OPENAI_MODEL or "gpt-4o-mini"

    # Legacy alias support for backwards compatibility
    @property
    def effective_openai_model(self) -> str:
        return self.OPENAI_MODEL or "gpt-4o-mini"

    def reload_from_env(self) -> None:
        """Reload configuration values directly from project root .env file."""
        from dotenv import dotenv_values
        if _ROOT_ENV_PATH.exists():
            vals = dotenv_values(_ROOT_ENV_PATH)
            for k, v in vals.items():
                if hasattr(self, k) and v is not None:
                    attr_type = type(getattr(self, k))
                    if attr_type == bool:
                        setattr(self, k, str(v).lower() in ("true", "1", "yes"))
                    elif attr_type == int:
                        try:
                            setattr(self, k, int(v))
                        except ValueError:
                            pass
                    elif attr_type == float:
                        try:
                            setattr(self, k, float(v))
                        except ValueError:
                            pass
                    else:
                        setattr(self, k, v)

    model_config = SettingsConfigDict(
        env_file=(str(_ROOT_ENV_PATH), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
