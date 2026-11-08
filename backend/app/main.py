"""FujiNova FastAPI Application Factory."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_places import router as places_router
from backend.app.api.routes_chat import router as chat_router


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

# Register API Routers
app.include_router(health_router)
app.include_router(places_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "project": "FujiNova",
        "description": "AI Travel Companion for Mount Fuji & Yamanashi",
        "version": "0.1.0",
        "health_check": "/api/v1/health",
        "documentation": "/docs"
    }
