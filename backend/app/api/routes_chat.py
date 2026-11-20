"""FujiNova Chat API: Server-Sent Events (SSE) Streaming Router with Itinerary & Multi-Turn Memory."""
import json
import asyncio
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.app.agent.hana import agent as hana_agent
from backend.app.services.conversation.session_manager import session_manager

logger = logging.getLogger("fujinova.chat.api")

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128, description="Unique client session identifier")
    message: str = Field(..., min_length=1, max_length=4000, description="Traveller conversational message")
    user_location: Optional[Dict[str, float]] = Field(None, description="Optional GPS coordinates (lat, lon)")


@router.post("/stream")
async def chat_stream_endpoint(request: ChatMessageRequest):
    """Stream Hana conversational responses with grounded places, itineraries, and transit via SSE."""
    async def sse_generator():
        state = hana_agent.get_or_create_state(request.session_id)
        has_streamed_tokens = False

        try:
            # 1. Stream tokens live
            async for token in hana_agent.chat(
                session_id=request.session_id,
                user_message=request.message,
                user_location=request.user_location
            ):
                has_streamed_tokens = True
                payload = json.dumps({"token": token}, ensure_ascii=False)
                yield f"event: token\ndata: {payload}\n\n"

            # 2. Stream generated/updated itinerary plan if active this turn
            resp_type = state.get("response_type", "general")
            active_itinerary = state.get("active_itinerary")
            if resp_type == "itinerary_destinations" and active_itinerary:
                itinerary_payload = json.dumps(active_itinerary, ensure_ascii=False)
                yield f"event: itinerary\ndata: {itinerary_payload}\n\n"

            # 3. Stream grounded place cards ONLY for destination queries or itineraries
            identified_places = state.get("identified_places", [])
            if resp_type in ("destination_recommendations", "itinerary_destinations") and identified_places:
                places_payload = json.dumps({
                    "response_type": resp_type,
                    "places": identified_places
                }, ensure_ascii=False)
                yield f"event: places\ndata: {places_payload}\n\n"

            # 4. Stream deterministic transit journeys if calculated
            identified_journeys = state.get("identified_journeys", [])
            if resp_type == "transit" and identified_journeys:
                journeys_payload = json.dumps(identified_journeys, ensure_ascii=False)
                yield f"event: transit\ndata: {journeys_payload}\n\n"

            # 5. Stream CrowdSense alternatives if calculated
            identified_crowd = state.get("identified_crowd_alternatives", [])
            if resp_type == "crowd" and identified_crowd:
                crowd_payload = json.dumps(identified_crowd, ensure_ascii=False)
                yield f"event: crowd_alternatives\ndata: {crowd_payload}\n\n"

            # 6. Stream done event with current profile & itinerary state
            done_payload = json.dumps({
                "session_id": request.session_id,
                "profile": state.get("profile", {}),
                "has_itinerary": bool(active_itinerary),
                "next_question": state.get("next_question"),
                "tokens_emitted": has_streamed_tokens,
                "response_type": resp_type
            }, ensure_ascii=False)
            yield f"event: done\ndata: {done_payload}\n\n"

        except Exception as e:
            logger.error(f"Chat streaming failure for session '{request.session_id}': {e}", exc_info=True)
            err_str = str(e)
            err_lower = err_str.lower()
            err_code = "GEMINI_SERVER_ERROR"

            if "not configured" in err_lower or "missing" in err_lower:
                err_code = "GEMINI_API_KEY_MISSING"
                user_msg = "Google Gemini API key is missing. Please paste your free Google AI Studio API key in FujiNova/.env."
            elif "placeholder" in err_lower:
                err_code = "GEMINI_API_KEY_MISSING"
                user_msg = "Google Gemini API key is set to a placeholder. Please paste your free Google AI Studio API key in FujiNova/.env."
            elif "401" in err_str or "403" in err_str or "authentication failed" in err_lower or "api_key_invalid" in err_lower or "invalid key" in err_lower:
                err_code = "GEMINI_AUTH_FAILED"
                user_msg = "Google Gemini authentication failed (Invalid API Key). Please check and verify your GEMINI_API_KEY in FujiNova/.env."
            elif "404" in err_str or ("model" in err_lower and ("unavailable" in err_lower or "not found" in err_lower or "no longer available" in err_lower)):
                err_code = "GEMINI_MODEL_UNAVAILABLE"
                user_msg = "The specified Gemini model is unavailable on the current Google AI Studio tier. Please verify GEMINI_MODEL in FujiNova/.env (e.g., gemini-3.8-flash)."
            elif "429" in err_str or "resource_exhausted" in err_lower or "quota" in err_lower or "rate limit" in err_lower:
                err_code = "GEMINI_QUOTA_EXCEEDED"
                user_msg = (
                    "FREE AI QUOTA EXCEEDED\n\n"
                    "Hana AI has reached the current Google Gemini free-tier usage limit. "
                    "Free-tier usage is subject to Google's quota and availability restrictions. "
                    "Please wait a moment and try again later."
                )
            elif "503" in err_str or "high demand" in err_lower or "overloaded" in err_lower:
                err_code = "GEMINI_SERVER_ERROR"
                user_msg = "Google Gemini free-tier is currently experiencing temporary high demand. Please try again in a few moments."
            elif "timeout" in err_lower or "timed out" in err_lower:
                err_code = "GEMINI_TIMEOUT"
                user_msg = "Request to Google Gemini timed out. Please check your internet connection and try again."
            elif "connect" in err_lower or "network" in err_lower:
                err_code = "GEMINI_CONNECTION_ERROR"
                user_msg = "Connection to Google Gemini failed. Please check your network connection and try again."
            elif "failover" in err_lower or "policy" in err_lower or "paid" in err_lower:
                err_code = "POLICY_VIOLATION"
                user_msg = "Paid API provider invocation blocked by policy (Zero Paid API Calls policy). Hana AI strictly operates on Google's free tier."
            else:
                user_msg = f"Hana AI notice: {err_str}"

            # Stream any deterministic tools that ran before failure if appropriate
            resp_type = state.get("response_type", "general")
            if resp_type == "itinerary_destinations" and state.get("active_itinerary"):
                yield f"event: itinerary\ndata: {json.dumps(state['active_itinerary'], ensure_ascii=False)}\n\n"
            if resp_type == "transit" and state.get("identified_journeys"):
                yield f"event: transit\ndata: {json.dumps(state['identified_journeys'], ensure_ascii=False)}\n\n"
            if resp_type in ("destination_recommendations", "itinerary_destinations") and state.get("identified_places"):
                yield f"event: places\ndata: {json.dumps({'response_type': resp_type, 'places': state['identified_places']}, ensure_ascii=False)}\n\n"

            err_payload = json.dumps({
                "error": user_msg,
                "code": err_code,
                "detail": err_str
            }, ensure_ascii=False)
            yield f"event: error\ndata: {err_payload}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/sessions/{session_id}")
async def get_session_state(session_id: str):
    """Retrieve existing session messages, extracted profile, and grounded places."""
    state = hana_agent.get_or_create_state(session_id)
    return {
        "session_id": session_id,
        "message_count": len(state["messages"]),
        "profile": state["profile"],
        "asked_questions": state["asked_questions"],
        "identified_places": state["identified_places"],
        "identified_journeys": state.get("identified_journeys", []),
        "identified_crowd_alternatives": state.get("identified_crowd_alternatives", []),
        "active_itinerary": state.get("active_itinerary")
    }


@router.delete("/sessions/{session_id}")
async def clear_session_state(session_id: str):
    """Clear conversation history and reset session state for a new conversation."""
    session_manager.clear_session(session_id)
    if session_id in hana_agent.sessions:
        del hana_agent.sessions[session_id]
    return {"status": "cleared", "session_id": session_id}
