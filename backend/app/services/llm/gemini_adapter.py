"""FujiNova Gemini LLM Adapter (google-genai SDK)."""
import json
import re
import asyncio
import logging
from typing import AsyncIterator, List, Dict, Any, Type, TypeVar, Optional
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError

logger = logging.getLogger("fujinova.llm.gemini")

from backend.app.core.config import settings
from backend.app.services.llm.base import (
    BaseLLMAdapter,
    AuthenticationError,
    RateLimitError,
    ServerError,
    TimeoutError,
    JSONSchemaValidationError,
    LLMError
)

T = TypeVar("T", bound=BaseModel)


def clean_json_markdown(text: str) -> str:
    """Strip markdown code fence wrappers from JSON string."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


class GeminiAdapter(BaseLLMAdapter):
    """Gemini Adapter using the official google-genai SDK on the free API tier."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        raw_key = self.api_key if self.api_key is not None else settings.GEMINI_API_KEY
        if not raw_key or not str(raw_key).strip():
            raise AuthenticationError("GEMINI_API_KEY is not configured. Please add your free Google AI Studio API key to FujiNova/.env.")
        key = str(raw_key).strip().strip("'\"").strip()
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
        if (
            not key
            or lower in known_placeholders
            or lower.startswith("your_")
            or lower.startswith("paste_")
        ):
            raise AuthenticationError(
                "GEMINI_API_KEY contains placeholder text. "
                "Please paste your free Google AI Studio API key in FujiNova/.env."
            )
        if not self._client:
            self._client = genai.Client(api_key=key)
        return self._client

    def _format_contents(self, messages: List[Dict[str, str]]) -> List[types.Content]:
        """Convert standard message dicts to Gemini Content objects."""
        contents = []
        for msg in messages:
            # System instructions are handled via GenerateContentConfig(system_instruction=...)
            if msg.get("role") == "system":
                continue
            role = "user" if msg.get("role") == "user" else "model"
            text_content = msg.get("content", "")
            if text_content:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text_content)]
                    )
                )
        if not contents:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text="Hello")]))
        return contents

    def _map_api_error(self, e: Exception) -> LLMError:
        """Map provider errors to unified FujiNova error taxonomy."""
        if isinstance(e, (AuthenticationError, RateLimitError, ServerError, TimeoutError, LLMError)):
            return e
        msg = str(e)
        if isinstance(e, APIError):
            code = getattr(e, "code", None)
            if code in (400, 401, 403) or "API_KEY_INVALID" in msg or "API key not valid" in msg:
                return AuthenticationError(f"Gemini authentication failed: {msg}")
            if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                return RateLimitError(f"FREE AI QUOTA EXCEEDED: Hana AI has reached the current Google Gemini free-tier usage limit. {msg}")
            if code == 404 or "not found" in msg.lower():
                return LLMError(f"GEMINI_MODEL_UNAVAILABLE: The model '{self.model}' was not found or is unavailable: {msg}", retryable=False)
            if code and code >= 500:
                return ServerError(f"Gemini server error: {msg}", status_code=code)
        if "API_KEY_INVALID" in msg or "api key" in msg.lower() and "invalid" in msg.lower():
            return AuthenticationError(f"Gemini authentication failed: {msg}")
        if "RESOURCE_EXHAUSTED" in msg or "429" in msg or "quota" in msg.lower():
            return RateLimitError(f"FREE AI QUOTA EXCEEDED: Hana AI has reached the current Google Gemini free-tier usage limit. {msg}")
        if isinstance(e, (asyncio.TimeoutError, TimeoutError)):
            return TimeoutError(f"Gemini request timed out: {msg}")
        if "connect" in msg.lower() or "network" in msg.lower():
            return LLMError(f"GEMINI_CONNECTION_ERROR: Failed to connect to Gemini: {msg}", retryable=True)
        return LLMError(f"Gemini invocation error: {msg}", retryable=False)

    async def stream_generate(
        self,
        messages: List[Dict[str, str]],
        system_instruction: str,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None
    ) -> AsyncIterator[str]:
        """Stream conversational responses from Gemini with resilient zero-cost fallback."""
        client = self._get_client()
        temp = temperature if temperature is not None else settings.FUJINOVA_TEMPERATURE
        tout = timeout if timeout is not None else settings.FUJINOVA_TIMEOUT_SECONDS

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temp
        )
        contents = self._format_contents(messages)

        models_to_try = [self.model or settings.GEMINI_MODEL]
        for candidate in ("gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"):
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        for current_model in models_to_try:
            try:
                logger.info(f"Streaming from free Gemini model '{current_model}'")
                async with asyncio.timeout(tout):
                    stream = await client.aio.models.generate_content_stream(
                        model=current_model,
                        contents=contents,
                        config=config
                    )

                async for chunk in stream:
                    if chunk.text:
                        yield chunk.text
                return

            except Exception as e:
                mapped = self._map_api_error(e)
                last_error = mapped
                if isinstance(mapped, AuthenticationError):
                    raise mapped
                logger.warning(
                    f"Gemini model '{current_model}' encountered error ({type(mapped).__name__}). "
                    f"Attempting free fallback model..."
                )
                continue

        if last_error:
            raise last_error

    async def generate_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        system_instruction: str,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None
    ) -> T:
        """Generate typed structured output conforming to a Pydantic model with resilient free fallback."""
        client = self._get_client()
        temp = temperature if temperature is not None else settings.FUJINOVA_TEMPERATURE
        tout = timeout if timeout is not None else settings.FUJINOVA_TIMEOUT_SECONDS

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temp,
            response_mime_type="application/json",
            response_schema=response_model
        )
        contents = self._format_contents(messages)

        models_to_try = [self.model or settings.GEMINI_MODEL]
        for candidate in ("gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"):
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        for current_model in models_to_try:
            try:
                logger.info(f"Extracting structured JSON with free Gemini model '{current_model}'")
                async with asyncio.timeout(tout):
                    response = await client.aio.models.generate_content(
                        model=current_model,
                        contents=contents,
                        config=config
                    )

                raw_text = response.text or "{}"
                cleaned_text = clean_json_markdown(raw_text)

                try:
                    return response_model.model_validate_json(cleaned_text)
                except (ValidationError, json.JSONDecodeError) as parse_err:
                    json_match = re.search(r"(\{.*\})", cleaned_text, re.DOTALL)
                    if json_match:
                        try:
                            return response_model.model_validate_json(json_match.group(1))
                        except Exception:
                            pass
                    raise JSONSchemaValidationError(
                        f"Failed to validate response against {response_model.__name__}: {str(parse_err)}. Raw text: {raw_text}"
                    )

            except Exception as e:
                if isinstance(e, JSONSchemaValidationError):
                    raise
                mapped = self._map_api_error(e)
                last_error = mapped
                if isinstance(mapped, AuthenticationError):
                    raise mapped
                logger.warning(
                    f"Gemini structured model '{current_model}' failed ({type(mapped).__name__}). Trying next model..."
                )
                continue

        if last_error:
            raise last_error
