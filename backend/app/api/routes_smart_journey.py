"""
FujiNova 11.0 — Smart Journey & Station Guide REST API Routes.
Encompasses the complete 4-step journey flow:
1. Origin Location & Category Exploration (Part 2)
2. CrowdSense 3.0 & Hana Interactive Alternative Choices (Part 3)
3. Station Departure Boards & Platform Verification (Part 4)
4. Multi-modal Journey Planning & Navigation (Part 5 & 6)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.services.smart_journey.station_service import StationGuideService
from backend.app.services.smart_journey.crowd_service_v3 import CrowdSense3Service
from backend.app.services.smart_journey.category_service import CategoryExplorationService
from backend.app.services.smart_journey.journey_service import SmartJourneyService

router = APIRouter(prefix="/api/v1/journey", tags=["Hana Smart Journey"])


# --- Step 1: Location & Exploration Categories ---

@router.get("/categories")
async def get_categories_overview() -> List[Dict[str, Any]]:
    """Return the 8 core exploration categories with current destination counts."""
    return CategoryExplorationService.get_categories_overview()


@router.get("/categories/{category_id}/items")
async def get_category_items(
    category_id: str,
    query: Optional[str] = Query(None, description="Optional search term to filter items")
) -> List[Dict[str, Any]]:
    """Retrieve verified destinations, stations, stays, or amenities for a category."""
    return CategoryExplorationService.get_items_by_category(category_id, query)


@router.get("/locations/search")
async def search_locations(
    q: str = Query(..., min_length=1, description="Keyword for stations, bus stops, hotels, or attractions")
) -> List[Dict[str, Any]]:
    """Search for stations, bus stops, hotels, and landmarks for manual origin selection."""
    return CategoryExplorationService.search_all_locations(q)


@router.get("/locations/nearby")
async def get_nearby_locations(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, ge=0.5, le=50.0)
) -> Dict[str, Any]:
    """Detect closest stations, bus stops, and landmarks near user GPS coordinates."""
    return CategoryExplorationService.get_nearby_locations(lat, lon, radius_km)


# --- Step 2: CrowdSense 3.0 & Hana Interactive Choices ---

@router.get("/crowd/{place_id}")
async def get_crowd_intel(place_id: str) -> Dict[str, Any]:
    """Retrieve normalized CrowdSense 3.0 status, confidence, and 4 Hana choices."""
    return CrowdSense3Service.get_crowd_details(place_id)


@router.get("/crowd/{place_id}/alternatives")
async def get_crowd_alternatives(
    place_id: str,
    choice_type: str = Query("quieter", description="Alternative type: quieter, famous, or hidden_gems")
) -> List[Dict[str, Any]]:
    """Retrieve alternative recommendations based on user choice selection."""
    return CrowdSense3Service.get_alternatives_by_type(place_id, choice_type)


# --- Step 3: Station & Transport Departures Guide ---

@router.get("/stations")
async def get_all_stations() -> List[Dict[str, Any]]:
    """List all 18 Fujikyu Railway stations (FJ01 to FJ18) with platform metadata."""
    return StationGuideService.get_all_railway_stations()


@router.get("/stations/{station_id}")
async def get_station_details(station_id: str) -> Dict[str, Any]:
    """Retrieve details, platforms, and accessibility facilities for a station."""
    st = StationGuideService.get_station_by_id(station_id)
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return st


@router.get("/stations/{station_id}/departures")
async def get_station_departures(
    station_id: str,
    mode: str = Query("train", pattern="^(train|bus)$", description="Transport mode: train or bus")
) -> List[Dict[str, Any]]:
    """
    Get departure board for station with verified platforms, adult/child fares, and status.
    Directly powers the Next Departures board in Screen 3.
    """
    return StationGuideService.get_station_departures(station_id, mode)


@router.get("/stations/{station_id}/platform-guide")
async def get_platform_navigation_guide(
    station_id: str,
    platform: str = Query(..., description="Platform number, e.g. 1 or 2")
) -> Dict[str, Any]:
    """Get verified directions and accessibility details for reaching a specific platform."""
    return StationGuideService.get_platform_navigation_guide(station_id, platform)


# --- Step 4: Journey Planning & Detailed Route Navigation ---

@router.get("/plan")
async def get_journey_plan(
    origin: str = Query("Kawaguchiko Station", description="Origin name or station"),
    destination: str = Query("Chureito Pagoda", description="Destination name or attraction")
) -> Dict[str, Any]:
    """
    Get complete journey plan with total time, distance, fares, transfers, and step-by-step directions.
    Directly powers Screen 4.
    """
    return SmartJourneyService.get_journey_plan(origin, destination)


class CustomRouteRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lon: float
    dest_name: str
    dest_lat: float
    dest_lon: float


@router.post("/plan/custom")
async def calculate_custom_journey(req: CustomRouteRequest) -> Dict[str, Any]:
    """Calculate multi-modal route between custom coordinates."""
    return SmartJourneyService.calculate_custom_route(
        req.origin_name, req.origin_lat, req.origin_lon,
        req.dest_name, req.dest_lat, req.dest_lon
    )
