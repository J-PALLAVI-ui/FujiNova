"""Tests for the 19 Grounded AI Agent Tools in FujiNova 9.0."""
import pytest
from backend.app.agent.tools import (
    search_destinations,
    get_destination_details,
    get_weather,
    get_transport_schedule,
    calculate_route,
    find_alternative_routes,
    get_crowd_information,
    check_accessibility,
    find_nearby_services,
    create_itinerary,
    update_itinerary,
    reorder_itinerary_stops,
    remove_itinerary_stop,
    calculate_trip_budget,
    save_trip,
    generate_trip_pdf,
    generate_trip_qr,
    get_saved_trips,
    get_travel_advisories,
    TOOL_REGISTRY
)


def test_tool_registry_has_all_19_tools():
    expected_tools = [
        "search_destinations",
        "get_destination_details",
        "get_weather",
        "get_transport_schedule",
        "calculate_route",
        "find_alternative_routes",
        "get_crowd_information",
        "check_accessibility",
        "find_nearby_services",
        "create_itinerary",
        "update_itinerary",
        "reorder_itinerary_stops",
        "remove_itinerary_stop",
        "calculate_trip_budget",
        "save_trip",
        "generate_trip_pdf",
        "generate_trip_qr",
        "get_saved_trips",
        "get_travel_advisories"
    ]
    for tool_name in expected_tools:
        assert tool_name in TOOL_REGISTRY, f"Tool {tool_name} must be in TOOL_REGISTRY"
    assert len(TOOL_REGISTRY) >= 19


def test_search_and_get_destination_details():
    res = search_destinations(query="oishi", limit=2)
    assert res["success"] is True
    assert len(res["destinations"]) > 0
    first_pid = res["destinations"][0]["place_id"]

    details = get_destination_details(first_pid)
    assert details["success"] is True
    assert details["destination"]["place_id"] == first_pid
    assert "data_source" in details


def test_get_weather():
    w = get_weather(month=4)
    assert w["success"] is True
    assert w["month"] == "April"
    assert "temperature_range_celsius" in w
    assert "fuji_visibility_probability" in w


def test_calculate_route_and_alternatives():
    route = calculate_route(
        origin="kawaguchiko_station",
        destination="kawaguchiko_oishi_park",
        departure_time="09:00:00"
    )
    assert route["success"] is True
    assert "journey_options" in route
    assert "engine" in route

    alt = find_alternative_routes("kawaguchiko_station", "kawaguchiko_oishi_park")
    assert alt["success"] is True


def test_crowd_and_accessibility():
    crowd = get_crowd_information("kawaguchiko_oishi_park")
    assert crowd["success"] is True
    assert "confidence" in crowd

    access = check_accessibility("arakurayama_sengen_park")
    assert access["success"] is True
    assert access["stair_step_count"] == 398
    assert access["accessibility_status"] == "STEEP_STAIRS"


def test_find_nearby_services():
    # Near Kawaguchiko Station (35.498, 138.768)
    res = find_nearby_services(latitude=35.498, longitude=138.768, limit=3)
    assert res["success"] is True
    assert len(res["services"]) > 0
    assert "distance_km" in res["services"][0]


def test_itinerary_lifecycle():
    # 1. Create
    created = create_itinerary(party_type="family_with_kids", duration_days=1, pace="relaxed")
    assert created["success"] is True
    plan = created["itinerary"]
    assert len(plan["days"]) == 1

    # 2. Budget
    budget = calculate_trip_budget(plan)
    assert budget["success"] is True
    assert budget["total_estimated_budget_jpy"] > 0
    assert "breakdown" in budget

    # 3. Update
    updated = update_itinerary(plan, "reduce_walking")
    assert updated["success"] is True

    # 4. Save
    saved = save_trip(plan, title="Automated Test Trip")
    assert saved["success"] is True
    assert "share_token" in saved
    assert "trip_id" in saved

    # 5. PDF & QR
    pdf = generate_trip_pdf(saved["trip_id"])
    assert pdf["success"] is True
    assert "/api/v1/export/pdf/" in pdf["download_url"]

    qr = generate_trip_qr(saved["share_token"])
    assert qr["success"] is True
    assert "/api/v1/export/qr/" in qr["qr_image_url"]


def test_get_travel_advisories():
    res = get_travel_advisories(active_only=True)
    assert res["success"] is True
    assert "advisories" in res
