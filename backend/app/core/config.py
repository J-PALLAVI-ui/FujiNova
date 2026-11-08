"""FujiNova Backend Configuration."""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Server Environment
    FUJINOVA_ENV: str = Field("development", description="Environment: development, test, production")
    FUJINOVA_HOST: str = Field("127.0.0.1", description="Backend host address")
    FUJINOVA_PORT: int = Field(8000, description="Backend port number")
    DATABASE_URL: str = Field("sqlite:///./fujinova.db", description="SQLite connection string")

    # Primary Model Provider Configuration
    # Uses 'gemini-3.8-flash' as current active high-capability model
    FUJINOVA_PRIMARY_PROVIDER: str = Field("google", description="Primary AI provider ('google' or 'openai')")
    FUJINOVA_PRIMARY_MODEL: str = Field("gemini-3.8-flash", description="Primary model identifier")

    # Secondary / Failover Configuration
    # Fallback is strictly DISABLED by default to prevent silent paid charges
    ENABLE_OPENAI_FALLBACK: bool = Field(False, description="Set to True only if explicitly enabling paid OpenAI failover")
    FUJINOVA_FALLBACK_PROVIDER: str = Field("openai", description="Fallback provider")
    FUJINOVA_FALLBACK_MODEL: str = Field("gpt-4o-mini", description="Fallback model identifier")

    # Operational Parameters
    FUJINOVA_TEMPERATURE: float = Field(0.3, description="Sampling temperature")
    FUJINOVA_MAX_RETRIES: int = Field(2, description="Maximum provider retry attempts")
    FUJINOVA_TIMEOUT_SECONDS: float = Field(12.0, description="Provider request timeout in seconds")

    # Privacy Policy Gate: If False, cross-vendor prompt transmission is rejected
    ALLOW_MULTI_VENDOR_FAILOVER: bool = Field(False, description="Explicit consent flag for cross-vendor failover")

    # Backend-Only API Credentials
    GEMINI_API_KEY: Optional[str] = Field(None, description="Google AI Studio API key")
    OPENAI_API_KEY: Optional[str] = Field(None, description="OpenAI API key (optional fallback)")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
