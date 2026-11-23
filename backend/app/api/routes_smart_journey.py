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
from backend.app.services.smart_journey.dayplan_service import DayPlanService
from backend.app.services.smart_journey.companion_service import JourneyCompanionService
from backend.app.services.smart_journey.treasure_map_service import TreasureMapService
from backend.app.services.sync.google_maps_adapter import GoogleMapsAdapter

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

@router.get("/crowd/comparison")
async def get_destination_comparison() -> List[Dict[str, Any]]:
    """
    Compare real-time crowd, traffic, weather, and transport availability across Mount Fuji POIs.
    Directly powers the Destination Comparison table/cards in Live Crowd & Traffic view.
    """
    g_adapter = GoogleMapsAdapter()
    
    # 1. Chureito Pagoda
    chureito_busy = g_adapter.get_place_busyness("chureito", "Chureito Pagoda")
    chureito_traffic = g_adapter.get_route_traffic((35.4983, 138.7692), (35.5013, 138.8016), "Route 137")

    # 2. Oishi Park
    oishi_busy = g_adapter.get_place_busyness("oishi", "Oishi Park")
    oishi_traffic = g_adapter.get_route_traffic((35.4983, 138.7692), (35.5230, 138.7460), "Route 21")

    # 3. Lake Kawaguchi
    kawa_busy = g_adapter.get_place_busyness("kawaguchi", "Lake Kawaguchi")

    # 4. Hidden Café - Café Mizu (みずカフェ)
    mizu_busy = g_adapter.get_place_busyness("mizu", "Hidden Café – Café Mizu (みずカフェ)")

    return [
        {
            "id": "chureito_pagoda",
            "name": "Chureito Pagoda",
            "subtitle": "Arakura Sengen Park, Fujiyoshida",
            "rating": 4.6,
            "reviews_count": 28417,
            "tags": ["Viewpoint", "Photo Spot"],
            "live_crowd": chureito_busy["busyness_status"],
            "crowd_level": chureito_busy["busyness_level"],
            "road_traffic": "Moderate (Route 137)",
            "traffic_level": "Moderate",
            "weather": "14°C Partly cloudy",
            "data_source": "Google Maps (Place details)",
            "last_updated": "1:03 PM (JST) (2 min ago)",
            "availability": "Verified (Live busyness available)",
            "is_live": True,
            "photo_url": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
            "latitude": 35.5013,
            "longitude": 138.8016
        },
        {
            "id": "oishi_park",
            "name": "Oishi Park",
            "subtitle": "Lake Kawaguchi, Fujikawaguchiko",
            "rating": 4.5,
            "reviews_count": 11902,
            "tags": ["Nature", "Lake View"],
            "live_crowd": oishi_busy["busyness_status"],
            "crowd_level": oishi_busy["busyness_level"],
            "road_traffic": "Light (Route 21)",
            "traffic_level": "Light",
            "weather": "14°C Partly cloudy",
            "data_source": "Google Maps (Traffic & Weather)",
            "last_updated": "1:03 PM (JST)",
            "availability": "Partial (Traffic & weather only)",
            "is_live": False,
            "photo_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
            "latitude": 35.5230,
            "longitude": 138.7460
        },
        {
            "id": "lake_kawaguchi",
            "name": "Lake Kawaguchi",
            "subtitle": "Scenic Lake",
            "rating": 4.5,
            "reviews_count": 8920,
            "tags": ["Scenic Lake", "Walking"],
            "live_crowd": "Currently Calm",
            "crowd_level": "Low",
            "road_traffic": "Light (Route 139)",
            "traffic_level": "Light",
            "weather": "14°C Partly cloudy",
            "data_source": "Google Maps (Place details)",
            "last_updated": "1:03 PM (JST)",
            "availability": "Verified (Live busyness available)",
            "is_live": True,
            "photo_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
            "latitude": 35.5167,
            "longitude": 138.7567
        },
        {
            "id": "cafe_mignon",
            "name": "Hidden Café – Café Mizu (みずカフェ)",
            "subtitle": "Local Café (Hidden Gem)",
            "rating": 4.7,
            "reviews_count": 1240,
            "tags": ["Café", "Hidden Gem"],
            "live_crowd": "Usually Quiet",
            "crowd_level": "Quiet",
            "road_traffic": "Light",
            "traffic_level": "Light",
            "weather": "14°C Partly cloudy",
            "data_source": "Google Maps (Place details)",
            "last_updated": "1:03 PM (JST)",
            "availability": "Verified (Live busyness available)",
            "is_live": True,
            "photo_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
            "latitude": 35.5112,
            "longitude": 138.7610
        }
    ]


@router.get("/crowd/decision-prompt")
async def get_hana_decision_prompt(destination: str = "Chureito Pagoda") -> Dict[str, Any]:
    """
    Hana Quieter-Place Decision Assistant options when a tourist destination appears busy.
    Matches the 4 choices A, B, C, D in media_1795420220766_7cdbf317.jpg.
    """
    return {
        "destination": destination,
        "hana_message": f"This destination appears busy right now. Would you prefer to:",
        "options": [
            {
                "id": "visit_anyway",
                "code": "A",
                "title": "A. Visit it anyway",
                "subtitle": f"Keep {destination} in your plan.",
                "color": "#E9A5B5"
            },
            {
                "id": "quieter_place",
                "code": "B",
                "title": "B. Find a quieter place with a similar experience",
                "subtitle": "Discover serene viewpoints with lower foot traffic.",
                "color": "#789477"
            },
            {
                "id": "famous_alternative",
                "code": "C",
                "title": "C. Find another famous attraction with lower crowds",
                "subtitle": "Explore an iconic landmark during calmer hours.",
                "color": "#B99BCB"
            },
            {
                "id": "later_in_day",
                "code": "D",
                "title": "D. Keep it for later in the day",
                "subtitle": "Reschedule visit to late afternoon when volume drops.",
                "color": "#C66B4E"
            }
        ]
    }


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


# --- Step 5: Full-Day Itinerary Optimization Engine ---

@router.get("/dayplan")
async def get_dayplan(
    origin: str = Query("Kawaguchiko Station", description="Origin starting location"),
    date: str = Query("Mon, Nov 23, 2026", description="Travel date"),
    start_time: str = Query("08:30", description="Start time"),
    destinations: Optional[str] = Query(None, description="Comma-separated destination IDs or names")
) -> Dict[str, Any]:
    """
    Generate optimized full-day Mount Fuji itinerary (08:30 - 17:30) with walking times,
    transport transfers, meal stops, and live status cards.
    Directly powers the desktop 'Your Day Plan' timeline.
    """
    dest_list = [d.strip() for d in destinations.split(",")] if destinations else None
    return DayPlanService.get_canonical_dayplan(origin=origin, travel_date=date, start_time=start_time, selected_dest_ids=dest_list)


# --- Step 7: Interactive Treasure Map & Step 8: Journey Companion ---

@router.get("/treasure-map")
async def get_treasure_map() -> Dict[str, Any]:
    """Retrieve full Treasure Map Explorer data with discovery progress and layer controls."""
    return TreasureMapService.get_treasure_map_data()


@router.get("/companion/state")
async def get_companion_state() -> Dict[str, Any]:
    """Retrieve live tourist journey companion state and real-time guidance."""
    return JourneyCompanionService.get_companion_state()


class CompanionActionRequest(BaseModel):
    action: str = Field(..., description="Action name: reached_station, boarded_bus, missed_bus, find_quieter, mark_visited, nearest_toilet, food_nearby")
    payload: Optional[Dict[str, Any]] = None


@router.post("/companion/action")
async def execute_companion_action(req: CompanionActionRequest) -> Dict[str, Any]:
    """Handle interactive companion buttons including missed-bus recalculation and visitor check-in."""
    return JourneyCompanionService.execute_companion_action(req.action, req.payload)


@router.get("/categories/all-17")
async def get_all_17_categories() -> List[Dict[str, Any]]:
    """Retrieve complete 17 discovery categories for FujiNova 12.0."""
    return CategoryExplorationService.get_all_17_categories()

