"""
Tests for FujiNova 11.0: Hana Smart Journey, Station Guide & CrowdSense 3.0 Engine.
Verifies all 4 steps of the user experience and API endpoints:
1. Station & Category exploration (18 stations FJ01-FJ18, 8 categories)
2. CrowdSense 3.0 metrics & 4 Hana interactive choices
3. Station departure boards, verified platform numbers, adult/child fares
4. Step-by-step multi-modal journey planning and navigation
5. Grounded Hana conversational tools
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.agent.tools import (
    detect_user_location,
    search_transport_stations,
    get_station_departures as tool_get_station_departures,
    get_platform_information as tool_get_platform_information,
    get_live_crowd_information,
    find_quieter_alternatives,
    calculate_transport_route,
    calculate_journey_fare
)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()


@pytest.fixture
def client():
    return TestClient(app)


def test_station_endpoints_fj01_to_fj18(client):
    """Verify all 18 Fujikyu Railway stations (FJ01-FJ18) are indexed with verified platforms."""
    resp = client.get("/api/v1/journey/stations")
    assert resp.status_code == 200
    stations = resp.json()
    assert len(stations) == 18
    codes = [s["station_code"] for s in stations]
    assert "FJ01" in codes
    assert "FJ14" in codes  # Shimoyoshida (Chureito)
    assert "FJ16" in codes  # Fujisan
    assert "FJ18" in codes  # Kawaguchiko

    # Check Kawaguchiko details
    kawa = next(s for s in stations if s["station_code"] == "FJ18")
    assert kawa["name_ja"] == "河口湖駅"
    assert kawa["platforms_verified"] is True
    assert "verified_platforms" in kawa["verified_platforms_info"]


def test_station_departures_train_board(client):
    """Verify train departure board matching Screen 3 layout: departures, platforms, fares, status."""
    resp = client.get("/api/v1/journey/stations/rail_kawaguchiko/departures?mode=train")
    assert resp.status_code == 200
    departures = resp.json()
    assert len(departures) >= 3

    # Check first departure (14:28 to Fujisan Platform 1)
    dep1 = departures[0]
    assert dep1["scheduled_time"] == "14:28"
    assert "Fujisan" in dep1["destination_en"]
    assert dep1["platform"] == "1"
    assert dep1["platform_verified"] is True
    assert dep1["status"] == "On Time"
    assert dep1["adult_fare_jpy"] == 210
    assert dep1["child_fare_jpy"] == 110


def test_station_departures_bus_board(client):
    """Verify bus departure board for Kawaguchiko bus terminal (Red, Green, Blue lines)."""
    resp = client.get("/api/v1/journey/stations/rail_kawaguchiko/departures?mode=bus")
    assert resp.status_code == 200
    departures = resp.json()
    assert len(departures) >= 3
    routes = [d["line_name"] for d in departures]
    assert any("Red Line" in r for r in routes)
    assert any("Green Line" in r for r in routes)


def test_platform_guidance(client):
    """Verify verified walking directions to Platform 1 at Kawaguchiko Station."""
    resp = client.get("/api/v1/journey/stations/rail_kawaguchiko/platform-guide?platform=1")
    assert resp.status_code == 200
    guide = resp.json()
    assert guide["platform"] == "1"
    assert "Platform 1" in guide["summary"]
    assert guide["barrier_free"] is True
    assert len(guide["steps"]) >= 2


def test_exploration_categories_overview(client):
    """Verify all 8 distinct exploration categories from Part 2 are present."""
    resp = client.get("/api/v1/journey/categories")
    assert resp.status_code == 200
    categories = resp.json()
    assert len(categories) == 8
    cat_ids = [c["category_id"] for c in categories]
    assert "places_to_visit" in cat_ids
    assert "railway_stations" in cat_ids
    assert "bus_stops" in cat_ids
    assert "hotels_and_stays" in cat_ids
    assert "food_and_cafes" in cat_ids
    assert "entertainment_activities" in cat_ids
    assert "essential_services" in cat_ids
    assert "airports_connections" in cat_ids


def test_category_items_query(client):
    """Verify places inside category are retrievable and filterable."""
    resp = client.get("/api/v1/journey/categories/places_to_visit/items")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 4
    names = [item["name_en"] for item in items]
    assert any("Chureito Pagoda" in n for n in names)
    assert any("Oishi Park" in n for n in names)


def test_location_manual_search(client):
    """Verify manual search finds stations, bus stops, hotels, and landmarks."""
    resp = client.get("/api/v1/journey/locations/search?q=kawaguchiko")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) > 0
    types = [r["type"] for r in results]
    assert "station" in types


def test_location_nearby_detection(client):
    """Verify GPS proximity detection detects closest stations and landmarks."""
    # Kawaguchiko coords
    resp = client.get("/api/v1/journey/locations/nearby?lat=35.4983&lon=138.7692")
    assert resp.status_code == 200
    data = resp.json()
    assert data["closest_station"] is not None
    assert "Kawaguchiko" in data["closest_station"]["name_en"]
    assert len(data["nearby_stations"]) > 0


def test_crowdsense_3_intel_and_hana_choices(client):
    """Verify CrowdSense 3.0 gauge score, metadata, and the 4 Hana choices for Chureito."""
    resp = client.get("/api/v1/journey/crowd/chureito_pagoda")
    assert resp.status_code == 200
    crowd = resp.json()
    assert crowd["crowd_level"] == "High"
    assert crowd["numeric_score"] == 78
    assert crowd["source"] == "CrowdSense (Multi-Source)"
    assert crowd["data_type"] == "Estimated (based on busyness, trends & sensors)"
    assert crowd["live_status_label"] == "Estimated"
    assert len(crowd["hana_choices"]) == 4

    choice_ids = [c["choice_id"] for c in crowd["hana_choices"]]
    assert "quieter_places" in choice_ids
    assert "famous_alternatives" in choice_ids
    assert "hidden_gems" in choice_ids
    assert "keep_destination" in choice_ids


def test_crowdsense_alternatives_filtering(client):
    """Verify quieter alternatives returns calmer destinations."""
    resp = client.get("/api/v1/journey/crowd/chureito_pagoda/alternatives?choice_type=quieter")
    assert resp.status_code == 200
    alts = resp.json()
    assert len(alts) >= 1
    scores = [a["score"] for a in alts]
    assert all(s <= 40 for s in scores)


def test_journey_plan_navigation(client):
    """Verify multi-modal journey plan from Kawaguchiko Station to Chureito Pagoda."""
    resp = client.get("/api/v1/journey/plan?origin=Kawaguchiko+Station&destination=Chureito+Pagoda")
    assert resp.status_code == 200
    plan = resp.json()
    assert plan["total_time_min"] == 18
    assert plan["distance_km"] == 4.2
    assert plan["train_fare_jpy"] == 210
    assert plan["transfers_count"] == 0
    assert len(plan["steps"]) == 3

    step1 = plan["steps"][0]
    assert "Kawaguchiko Station" in step1["title"]
    assert "14:28" in step1["details"]
    assert "Platform: 1" in step1["details"]
    assert "¥210" in step1["details"]


def test_hana_conversational_tools_integration():
    """Verify the new Hana AI tools return structured validated data for conversations."""
    loc_res = detect_user_location(35.4983, 138.7692)
    assert loc_res["success"] is True
    assert loc_res["closest_station"]["station_code"] == "FJ18"

    st_res = search_transport_stations("otsuki")
    assert st_res["success"] is True
    assert len(st_res["stations"]) >= 1

    dep_res = tool_get_station_departures("rail_kawaguchiko", "train")
    assert dep_res["success"] is True
    assert len(dep_res["departures"]) >= 3

    plat_res = tool_get_platform_information("rail_kawaguchiko", "1")
    assert plat_res["success"] is True
    assert "Platform 1" in plat_res["platform_guide"]["summary"]

    crowd_res = get_live_crowd_information("chureito_pagoda")
    assert crowd_res["success"] is True
    assert crowd_res["crowd_intelligence"]["numeric_score"] == 78

    alt_res = find_quieter_alternatives("chureito_pagoda")
    assert alt_res["success"] is True
    assert len(alt_res["quieter_alternatives"]) >= 1

    route_res = calculate_transport_route("Kawaguchiko Station", "Chureito Pagoda")
    assert route_res["success"] is True
    assert route_res["journey_plan"]["total_time_min"] == 18

    fare_res = calculate_journey_fare("Kawaguchiko Station", "Chureito Pagoda", "adult")
    assert fare_res["success"] is True
    assert fare_res["adult_fare_jpy"] == 210
    assert fare_res["child_fare_jpy"] == 105
