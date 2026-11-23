"""
FujiNova 12.0: Acceptance & Integration Tests for AI Travel Companion Suite.
Tests:
- 17 Functional Discovery Categories
- Google Maps Platform Adapter with strict Free-Tier Quota Lock
- Day Plan Full-Day Itinerary Optimization Engine (08:30 - 17:30)
- Destination Comparison with Operational Truth (Verified live vs Unavailable)
- Hana 4-Choice Quieter-Place Decision Assistant
- Live Journey Companion with connection tracking, missed-bus rerouting, and badges
- Interactive Treasure Map with Discovery Progress (3/7)
"""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.sync.google_maps_adapter import GoogleMapsAdapter
from backend.app.services.smart_journey.dayplan_service import DayPlanService
from backend.app.services.smart_journey.companion_service import JourneyCompanionService
from backend.app.services.smart_journey.treasure_map_service import TreasureMapService

client = TestClient(app)


def test_17_discovery_categories_endpoint():
    """Verify all 17 distinct functional discovery categories are returned with metadata."""
    resp = client.get("/api/v1/journey/categories/all-17")
    assert resp.status_code == 200
    categories = resp.json()
    assert len(categories) == 17

    cat_ids = [c["category_id"] for c in categories]
    expected_categories = [
        "famous_attractions", "hidden_gems", "quiet_scenic", "cafes_bakeries",
        "japanese_restaurants", "local_food", "lakes_nature", "shopping_souvenirs",
        "museums_entertainment", "shrines_temples", "photo_locations", "family_activities",
        "hotels_ryokans", "activities_experiences", "railway_stations", "bus_stops",
        "essential_services"
    ]
    for exp in expected_categories:
        assert exp in cat_ids, f"Expected category {exp} missing"


def test_google_maps_adapter_quota_and_operational_truth():
    """Verify Google Maps Platform quota tracking and strict Operational Truth handling."""
    adapter = GoogleMapsAdapter()
    
    # 1. Quota guard permits initial calls within daily allowance
    allowed = adapter.check_and_increment_quota(1)
    assert allowed is True

    # 2. Chureito Pagoda returns verified busyness
    chureito = adapter.get_place_busyness("chureito", "Chureito Pagoda")
    assert chureito["has_live_busyness"] is True
    assert "Busier than usual" in chureito["busyness_status"]
    assert chureito["data_source"] == "Google Maps (Place details)"

    # 3. Oishi Park explicitly returns 'Live crowd information unavailable'
    oishi = adapter.get_place_busyness("oishi", "Oishi Park")
    assert oishi["has_live_busyness"] is False
    assert "Live crowd information unavailable for this destination" in oishi["busyness_status"]

    # 4. Route traffic provides Route 137 flow
    traffic = adapter.get_route_traffic((35.4983, 138.7692), (35.5013, 138.8016), "Route 137")
    assert "Route 137" in traffic["route_corridor"]
    assert traffic["traffic_condition"] in ("Light", "Moderate", "Heavy")


def test_dayplan_itinerary_endpoint():
    """Verify full-day timeline from 08:30 to 17:30 with transit segments and meal stops."""
    resp = client.get("/api/v1/journey/dayplan?origin=Kawaguchiko%20Station&start_time=08:30")
    assert resp.status_code == 200
    data = resp.json()

    assert data["origin"] == "Kawaguchiko Station"
    assert "08:30 - 17:30" in data["time_window"]
    assert len(data["destinations"]) >= 4

    # Check key destinations present
    dest_names = [d["name"] for d in data["destinations"]]
    assert any("Chureito" in name for name in dest_names)
    assert any("Lake Kawaguchi" in name for name in dest_names)
    assert any("Oishi Park" in name for name in dest_names)
    assert any("Café" in name or "Mignon" in name for name in dest_names)

    # Check timeline starts at 08:30 and includes return at 17:30
    timeline = data["timeline"]
    assert timeline[0]["time"] == "08:30"
    assert timeline[-1]["time"] == "17:30"

    # Check metrics present
    assert "crowd_overview" in data["metrics"]
    assert "road_traffic" in data["metrics"]
    assert "weather" in data["metrics"]


def test_destination_comparison_endpoint():
    """Verify Destination Comparison table with live/unavailable status labels."""
    resp = client.get("/api/v1/journey/crowd/comparison")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 4

    # Chureito should be verified live
    chureito = next(i for i in items if "Chureito" in i["name"])
    assert chureito["is_live"] is True
    assert "Busier than usual" in chureito["live_crowd"]
    assert "Route 137" in chureito["road_traffic"]

    # Oishi Park must honestly state unavailable live crowd
    oishi = next(i for i in items if "Oishi" in i["name"])
    assert oishi["is_live"] is False
    assert "Live crowd information unavailable for this destination" in oishi["live_crowd"]


def test_hana_decision_prompt_endpoint():
    """Verify the 4-choice Hana decision prompt when a venue is crowded."""
    resp = client.get("/api/v1/journey/crowd/decision-prompt?destination=Chureito%20Pagoda")
    assert resp.status_code == 200
    data = resp.json()
    assert "This destination appears busy right now" in data["hana_message"]
    assert len(data["options"]) == 4

    codes = [opt["code"] for opt in data["options"]]
    assert codes == ["A", "B", "C", "D"]
    assert "Visit it anyway" in data["options"][0]["title"]
    assert "quieter place" in data["options"][1]["title"]
    assert "famous attraction" in data["options"][2]["title"]
    assert "later in the day" in data["options"][3]["title"]


def test_journey_companion_state_and_actions():
    """Verify the Journey Companion state machine, missed-bus recalculation, and discovery badges."""
    # 1. State check
    resp = client.get("/api/v1/journey/companion/state")
    assert resp.status_code == 200
    state = resp.json()
    assert state["current_step_index"] == 2
    assert "Chureito Pagoda" in state["next_stop"]["name"]
    assert "Fujikyu Bus F1" in state["transit_segment"]["service_line"]
    assert state["treasure_hunt"]["discovered_count"] == 3
    assert state["treasure_hunt"]["total_count"] == 7

    # 2. Action: Reached station
    resp_reached = client.post("/api/v1/journey/companion/action", json={"action": "reached_station"})
    assert resp_reached.status_code == 200
    assert resp_reached.json()["success"] is True
    assert "Bus Stop No. 1" in resp_reached.json()["message"]

    # 3. Action: Boarded bus
    resp_board = client.post("/api/v1/journey/companion/action", json={"action": "boarded_bus"})
    assert resp_board.status_code == 200
    assert resp_board.json()["success"] is True

    # 4. Action: Missed bus (Crucial recalculation)
    resp_missed = client.post("/api/v1/journey/companion/action", json={"action": "missed_bus"})
    assert resp_missed.status_code == 200
    data_missed = resp_missed.json()
    assert data_missed["success"] is True
    assert "next_departure" in data_missed
    assert data_missed["next_departure"]["wait_time_min"] == 15
    assert "Bus Stop No. 1" in data_missed["next_departure"]["platform"]

    # 5. Action: Mark as visited
    resp_visited = client.post("/api/v1/journey/companion/action", json={"action": "mark_visited"})
    assert resp_visited.status_code == 200
    assert resp_visited.json()["progress_update"]["discovered_count"] == 4


def test_treasure_map_endpoint():
    """Verify Treasure Map Explorer endpoint returning discoveries and progress."""
    resp = client.get("/api/v1/journey/treasure-map")
    assert resp.status_code == 200
    data = resp.json()
    assert "FujiNova Treasure Map Explorer" in data["title"]
    assert len(data["discoveries"]) >= 6
    assert data["progress"]["total"] == 6
    assert len(data["layers"]) >= 4
