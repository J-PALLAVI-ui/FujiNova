"""FujiNova FastAPI Application Factory."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_places import router as places_router
from backend.app.api.routes_chat import router as chat_router
from backend.app.api.routes_routing import router as routing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event: initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="FujiNova API",
    description="Conversational, Location-Aware & Crowd-Sensitive Tourism API for Mount Fuji & Yamanashi",
    version="0.1.0",
    lifespan=lifespan
)

# CORS Configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers (v1 standard)
app.include_router(health_router)
app.include_router(places_router)
app.include_router(chat_router)
app.include_router(routing_router)

# Direct Compatibility Endpoints (as inspected in /docs)
from backend.app.api.routes_health import health_check
from backend.app.api.routes_places import list_places
from backend.app.api.routes_routing import search_transit_routes
from backend.app.api.routes_chat import chat_stream_endpoint, ChatMessageRequest
from backend.app.services.routing.transit_models import RouteSearchRequest

@app.get("/health", tags=["Health Compatibility"])
async def root_health():
    return await health_check()

@app.get("/api/attractions", tags=["Places Compatibility"])
def api_attractions(limit: int = 100, offset: int = 0):
    places = list_places(limit=limit, offset=offset)
    return {"items": places, "total": len(places), "limit": limit, "offset": offset}

@app.get("/api/transport", tags=["Transport Compatibility"])
def api_transport():
    from backend.app.services.routing.routing_service import get_routing_service
    svc = get_routing_service()
    key_stops = [
        {"stop_id": s.stop_id, "name_ja": s.stop_name_ja, "name_en": s.stop_name_en, "is_railway": s.is_railway}
        for s in svc.stops.values()
        if s.is_railway or s.stop_id.startswith("0025") or s.stop_id.startswith("0001") or s.stop_id.startswith("1857")
    ]
    return {"stops": key_stops, "total": len(key_stops)}

@app.post("/api/transit/plan", tags=["Transport Compatibility"])
def api_transit_plan(request: RouteSearchRequest):
    return search_transit_routes(request)

@app.post("/api/ai/chat", tags=["AI Compatibility"])
async def api_ai_chat(request: ChatMessageRequest):
    return await chat_stream_endpoint(request)

@app.post("/api/ai/adaptive/chat", tags=["AI Compatibility"])
async def api_ai_adaptive_chat(request: ChatMessageRequest):
    return await chat_stream_endpoint(request)


@app.get("/")
async def root():
    return {
        "project": "FujiNova",
        "description": "AI Travel Companion for Mount Fuji & Yamanashi",
        "version": "0.1.0",
        "health_check": "/api/v1/health",
        "documentation": "/docs"
    }
