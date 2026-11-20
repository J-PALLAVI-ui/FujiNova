"""FujiNova Resilient Model Router with Strict Free-Tier Policy and Zero-Cost Guarantees."""
import asyncio
import logging
from typing import AsyncIterator, List, Dict, Any, Type, TypeVar, Optional
from pydantic import BaseModel

from backend.app.core.config import settings
from backend.app.services.llm.base import (
    BaseLLMAdapter,
    LLMError,
    AuthenticationError,
    RateLimitError,
    ServerError,
    TimeoutError,
    JSONSchemaValidationError,
    FailoverPolicyViolationError
)
from backend.app.services.llm.gemini_adapter import GeminiAdapter
from backend.app.services.llm.openai_adapter import OpenAIAdapter

logger = logging.getLogger("fujinova.llm.router")
T = TypeVar("T", bound=BaseModel)


class ModelRouter:
    """Manages primary LLM execution, retries, and strict Free-Only policy enforcement."""

    def __init__(
        self,
        primary_adapter: Optional[BaseLLMAdapter] = None,
        fallback_adapter: Optional[BaseLLMAdapter] = None,
        max_retries: Optional[int] = None,
        backoff_base: float = 0.5
    ):
        if primary_adapter is not None:
            self.primary = primary_adapter
            self.fallback = fallback_adapter
        else:
            # Respect explicit FUJINOVA_PRIMARY_PROVIDER setting.
            # When FUJINOVA_PRIMARY_PROVIDER is 'google' or FREE_ONLY_MODE is True:
            # - Strictly instantiate GeminiAdapter as primary
            # - Completely ignore OPENAI_API_KEY even if present in environment or .env
            # - Never instantiate OpenAIAdapter
            # - In free-only mode, strictly set fallback to None (Zero Paid API Calls)
            provider = (settings.FUJINOVA_PRIMARY_PROVIDER or "google").lower().strip()
            if settings.FREE_ONLY_MODE or provider == "google":
                self.primary = GeminiAdapter()
                self.fallback = None if settings.FREE_ONLY_MODE else fallback_adapter
            else:
                self.primary = OpenAIAdapter()
                self.fallback = fallback_adapter or GeminiAdapter()

        self.max_retries = max_retries if max_retries is not None else settings.FUJINOVA_MAX_RETRIES
        self.backoff_base = backoff_base

    def _is_failover_authorized(self) -> bool:
        """Check whether cross-vendor failover is authorized. Strictly False in FREE_ONLY_MODE."""
        if settings.FREE_ONLY_MODE:
            return False
        return bool(settings.ENABLE_OPENAI_FALLBACK and settings.ALLOW_MULTI_VENDOR_FAILOVER)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_instruction: str,
        temperature: Optional[float] = None
    ) -> AsyncIterator[str]:
        """Stream conversational tokens with retries and zero-cost safety enforcement."""
        last_error: Optional[Exception] = None

        # Attempt with Primary Provider (Google Gemini)
        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"Primary LLM attempt {attempt + 1}/{self.max_retries + 1} ({self.primary.__class__.__name__})")
                async for token in self.primary.stream_generate(
                    messages=messages,
                    system_instruction=system_instruction,
                    temperature=temperature
                ):
                    yield token
                return  # Stream completed successfully

            except AuthenticationError as auth_err:
                # Fatal: Never retry invalid credentials
                logger.error(f"Primary authentication error (non-retryable): {auth_err}")
                raise auth_err

            except (RateLimitError, ServerError, TimeoutError) as retryable_err:
                last_error = retryable_err
                logger.warning(
                    f"Primary attempt {attempt + 1} failed ({retryable_err.__class__.__name__}): {retryable_err}. "
                    f"Retry {attempt + 1}/{self.max_retries}"
                )
                if attempt < self.max_retries:
                    delay = self.backoff_base * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue

            except Exception as unk_err:
                logger.error(f"Primary unhandled error: {unk_err}")
                last_error = unk_err
                break

        # Primary failed all attempts
        logger.warning(f"Primary LLM exhausted retries. Last error: {last_error}")
        if self.fallback is not None and not self._is_failover_authorized():
            raise FailoverPolicyViolationError(
                "Primary model failed and failover to secondary provider is disabled by policy "
                "(FREE_ONLY_MODE=True, ENABLE_OPENAI_FALLBACK=False or ALLOW_MULTI_VENDOR_FAILOVER=False). "
                f"Root cause: {last_error}"
            )

        if settings.FREE_ONLY_MODE or self.fallback is None:
            if isinstance(last_error, (RateLimitError, ServerError, TimeoutError, AuthenticationError)):
                raise last_error
            raise last_error or LLMError("Gemini API call failed after retries.")

        logger.info("Policy gate passed: Initiating failover to secondary provider...")
        async for token in self.fallback.stream_generate(
            messages=messages,
            system_instruction=system_instruction,
            temperature=temperature
        ):
            yield token

    async def extract_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        system_instruction: str,
        temperature: Optional[float] = None
    ) -> T:
        """Extract structured data with retry repair and zero-cost policy enforcement."""
        last_error: Optional[Exception] = None

        # Attempt with Primary Provider (Google Gemini)
        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"Primary structured extract attempt {attempt + 1}/{self.max_retries + 1}")
                return await self.primary.generate_structured(
                    messages=messages,
                    response_model=response_model,
                    system_instruction=system_instruction,
                    temperature=temperature
                )

            except AuthenticationError as auth_err:
                logger.error(f"Primary authentication error (non-retryable): {auth_err}")
                raise auth_err

            except (RateLimitError, ServerError, TimeoutError, JSONSchemaValidationError) as retryable_err:
                last_error = retryable_err
                logger.warning(
                    f"Primary structured attempt {attempt + 1} failed ({retryable_err.__class__.__name__}): {retryable_err}"
                )
                if attempt < self.max_retries:
                    delay = self.backoff_base * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue

            except Exception as unk_err:
                logger.error(f"Primary unhandled structured error: {unk_err}")
                last_error = unk_err
                break

        # Primary failed all attempts
        if self.fallback is not None and not self._is_failover_authorized():
            raise FailoverPolicyViolationError(
                "Primary structured generation failed and failover is disabled by policy. "
                f"Root cause: {last_error}"
            )

        if settings.FREE_ONLY_MODE or self.fallback is None:
            if isinstance(last_error, (RateLimitError, ServerError, TimeoutError, AuthenticationError)):
                raise last_error
            raise last_error or LLMError(f"Gemini structured extraction failed: {last_error}")

        logger.info("Policy gate passed: Structured failover to secondary provider...")
        return await self.fallback.generate_structured(
            messages=messages,
            response_model=response_model,
            system_instruction=system_instruction,
            temperature=temperature
        )


# Global router singleton
router = ModelRouter()
