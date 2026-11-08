"""FujiNova OpenAI LLM Fallback Adapter (openai SDK)."""
import json
import re
import asyncio
from typing import AsyncIterator, List, Dict, Any, Type, TypeVar, Optional
from pydantic import BaseModel, ValidationError
import openai
from openai import AsyncOpenAI

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
from backend.app.services.llm.gemini_adapter import clean_json_markdown

T = TypeVar("T", bound=BaseModel)


class OpenAIAdapter(BaseLLMAdapter):
    """OpenAI Adapter using the official AsyncOpenAI SDK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.FUJINOVA_FALLBACK_MODEL
        self._client: Optional[AsyncOpenAI] = None

    def _get_client(self) -> AsyncOpenAI:
        if not self.api_key or self.api_key.strip() in ("", "YOUR_OPENAI_API_KEY"):
            raise AuthenticationError("OPENAI_API_KEY is not configured.")
        if not self._client:
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    def _map_api_error(self, e: Exception) -> LLMError:
        """Map OpenAI exceptions to unified FujiNova error taxonomy."""
        if isinstance(e, (AuthenticationError, RateLimitError, ServerError, TimeoutError, LLMError)):
            return e
        if isinstance(e, openai.AuthenticationError):
            return AuthenticationError(f"OpenAI authentication failed: {str(e)}")
        if isinstance(e, openai.RateLimitError):
            return RateLimitError(f"OpenAI rate limit exceeded: {str(e)}")
        if isinstance(e, openai.InternalServerError):
            return ServerError(f"OpenAI server error: {str(e)}", status_code=500)
        if isinstance(e, (openai.APITimeoutError, asyncio.TimeoutError)):
            return TimeoutError(f"OpenAI request timed out: {str(e)}")
        return LLMError(f"OpenAI invocation error: {str(e)}", retryable=False)

    async def stream_generate(
        self,
        messages: List[Dict[str, str]],
        system_instruction: str,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None
    ) -> AsyncIterator[str]:
        """Stream conversational responses from OpenAI."""
        client = self._get_client()
        temp = temperature if temperature is not None else settings.FUJINOVA_TEMPERATURE
        tout = timeout if timeout is not None else settings.FUJINOVA_TIMEOUT_SECONDS

        formatted_messages = [{"role": "system", "content": system_instruction}]
        formatted_messages.extend(messages)

        try:
            async def _stream():
                stream = await client.chat.completions.create(
                    model=self.model,
                    messages=formatted_messages,
                    temperature=temp,
                    stream=True,
                    timeout=tout
                )
                async for chunk in stream:
                    content = chunk.choices[0].delta.content if chunk.choices else None
                    if content:
                        yield content

            async with asyncio.timeout(tout):
                async for token in _stream():
                    yield token

        except Exception as e:
            raise self._map_api_error(e)

    async def generate_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        system_instruction: str,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None
    ) -> T:
        """Generate typed structured output using OpenAI JSON mode / schema parse."""
        client = self._get_client()
        temp = temperature if temperature is not None else settings.FUJINOVA_TEMPERATURE
        tout = timeout if timeout is not None else settings.FUJINOVA_TIMEOUT_SECONDS

        sys_msg = f"{system_instruction}\nYou MUST respond with valid JSON adhering to the schema: {json.dumps(response_model.model_json_schema())}"
        formatted_messages = [{"role": "system", "content": sys_msg}]
        formatted_messages.extend(messages)

        try:
            async with asyncio.timeout(tout):
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=formatted_messages,
                    temperature=temp,
                    response_format={"type": "json_object"},
                    timeout=tout
                )

            raw_text = response.choices[0].message.content or "{}"
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
                    f"Failed to validate OpenAI response against {response_model.__name__}: {str(parse_err)}"
                )

        except Exception as e:
            if isinstance(e, JSONSchemaValidationError):
                raise
            raise self._map_api_error(e)
