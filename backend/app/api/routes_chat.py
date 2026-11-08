"""FujiNova Chat API: Server-Sent Events (SSE) Streaming Router."""
import json
import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.app.agent.hana import agent as hana_agent

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, description="Unique client session identifier")
    message: str = Field(..., min_length=1, description="Traveller conversational message")
    user_location: Optional[Dict[str, float]] = Field(None, description="Optional GPS coordinates (lat, lon)")


@router.post("/stream")
async def chat_stream_endpoint(request: ChatMessageRequest):
    """Stream Hana conversational responses with grounded places via Server-Sent Events (SSE)."""
    async def sse_generator():
        try:
            state = hana_agent.get_or_create_state(request.session_id)

            # Stream tokens
            async for token in hana_agent.chat(
                session_id=request.session_id,
                user_message=request.message,
                user_location=request.user_location
            ):
                payload = json.dumps({"token": token}, ensure_ascii=False)
                yield f"event: token\ndata: {payload}\n\n"

            # After tokens complete, stream grounded place cards if any were queried
            identified_places = state.get("identified_places", [])
            if identified_places:
                places_payload = json.dumps(identified_places, ensure_ascii=False)
                yield f"event: places\ndata: {places_payload}\n\n"

            # Stream deterministic transit journeys if any were calculated
            identified_journeys = state.get("identified_journeys", [])
            if identified_journeys:
                journeys_payload = json.dumps(identified_journeys, ensure_ascii=False)
                yield f"event: transit\ndata: {journeys_payload}\n\n"

            # Stream done event with current profile state
            done_payload = json.dumps({
                "session_id": request.session_id,
                "profile": state.get("profile", {}),
                "next_question": state.get("next_question")
            }, ensure_ascii=False)
            yield f"event: done\ndata: {done_payload}\n\n"

        except Exception as e:
            err_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
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
    }
