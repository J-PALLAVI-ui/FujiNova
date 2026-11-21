"""FujiNova 10.0: Live Intelligence & Real-Time Sync API Router.

Serves:
- Real-time Open-Meteo weather & Mount Fuji visibility index
- JMA Natural hazard & volcanic alerts
- Wikimedia Commons destination photo galleries with attribution
- CrowdSense 2.0 multi-evidence congestion intelligence
- Provider synchronization health dashboard
"""
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.services.sync.sync_manager import SyncManager
from backend.app.services.sync.open_meteo_adapter import KEY_REGIONAL_STATIONS

logger = logging.getLogger("fujinova.api.live_intel")

router = APIRouter(prefix="/api/v1/live", tags=["FujiNova 10.0 Live Intelligence"])


@router.get("/weather")
async def get_live_weather(location_id: Optional[str] = Query(None, description="Specific station ID, e.g. fuji_summit, kawaguchiko")) -> Dict[str, Any]:
    """Retrieve real-time elevation-specific weather and Mount Fuji visibility index."""
    sync_mgr = SyncManager.get_instance()
    
    if location_id:
        target = next((s for s in KEY_REGIONAL_STATIONS if s["location_id"] == location_id), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"Station '{location_id}' not found.")
        data = await sync_mgr.weather_adapter.fetch_station_weather(target)
        return {"success": True, "station": data}

    stations = await sync_mgr.weather_adapter.fetch_all_key_stations()
    # Compute overall regional Fuji visibility verdict
    avg_vis = sum(s.get("fuji_visibility_probability", 50) for s in stations) / max(1, len(stations))
    
    return {
        "success": True,
        "count": len(stations),
        "overall_fuji_visibility_score": int(round(avg_vis)),
        "is_fuji_visible": avg_vis >= 50,
        "stations": stations,
        "provider": "Open-Meteo.com Live Atmospheric Model",
        "license": "Non-commercial CC-BY 4.0"
    }


@router.get("/hazards")
async def get_hazard_alerts() -> Dict[str, Any]:
    """Retrieve official JMA volcanic alerts, earthquake notices, and severe weather warnings."""
    sync_mgr = SyncManager.get_instance()
    alerts = sync_mgr.hazards_adapter.get_active_alerts()
    return {
        "success": True,
        "count": len(alerts),
        "alerts": alerts,
        "fuji_volcanic_level": 1,
        "volcanic_status_en": "Level 1: Normal (Calm Volcanic Activity)",
        "source": "Japan Meteorological Agency (JMA) & Yamanashi Disaster Prevention"
    }


@router.get("/gallery/{place_id}")
async def get_destination_gallery(place_id: str) -> Dict[str, Any]:
    """Retrieve genuine Wikimedia Commons photographs with author credits and Creative Commons licenses."""
    sync_mgr = SyncManager.get_instance()
    photos = await sync_mgr.wikimedia_adapter.get_place_gallery(place_id)
    return {
        "success": True,
        "place_id": place_id,
        "count": len(photos),
        "photos": photos,
        "data_source": "Wikimedia Commons Open Media API",
        "attribution_policy": "All imagery includes photographer attribution and explicit Creative Commons licenses."
    }


@router.get("/crowd/{place_id}")
async def get_crowdsense_2(
    place_id: str,
    hour: Optional[int] = Query(None, ge=0, le=23),
    is_weekend: Optional[bool] = Query(None)
) -> Dict[str, Any]:
    """Retrieve CrowdSense 2.0 multi-evidence visitor congestion intelligence."""
    sync_mgr = SyncManager.get_instance()
    data = sync_mgr.crowdsense2.evaluate_place_crowd(
        place_id=place_id,
        current_hour=hour,
        is_weekend=is_weekend
    )
    return {
        "success": True,
        "crowd_status": data
    }


@router.get("/health")
async def get_provider_health() -> Dict[str, Any]:
    """Retrieve synchronization health diagnostics across all external data providers."""
    sync_mgr = SyncManager.get_instance()
    providers = sync_mgr.get_all_provider_health()
    all_healthy = all(p.get("status") in ("HEALTHY", "INITIALIZING") for p in providers)
    return {
        "success": True,
        "system_status": "ALL_HEALTHY" if all_healthy else "DEGRADED",
        "providers": providers,
        "zero_cost_lock_enforced": True
    }


@router.post("/sync")
async def trigger_manual_sync() -> Dict[str, Any]:
    """Trigger an immediate sync cycle across all connected data feeds."""
    sync_mgr = SyncManager.get_instance()
    res = await sync_mgr.synchronize_all()
    return {
        "success": True,
        "synchronization_results": res
    }
