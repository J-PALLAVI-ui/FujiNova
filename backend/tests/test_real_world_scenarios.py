"""
FujiNova 9.0 — Real-World Tourist Scenarios Automated Verification Suite.
Validates Scenarios 1 through 10 using Hana Agent Tools and Database APIs.
"""
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
    calculate_trip_budget,
    save_trip,
    get_travel_advisories,
)

KAWAGUCHIKO_LAT = 35.5000
KAWAGUCHIKO_LON = 138.7600

@pytest.fixture(autouse=True)
def setup_seed_data():
    from backend.data.seed_fujinova9 import seed_fujinova9_data
    seed_fujinova9_data()

def test_scenario_1_budget_backpacker():
    """Scenario 1: Budget Backpacker (5,000 JPY/day, free viewpoints, konbini meals)."""
    # 1. Search free destinations under 1000 JPY
    free_spots = search_destinations(query="park", max_fee_jpy=1000)
    assert free_spots["success"] is True
    assert free_spots["count"] >= 1
    
    # 2. Find nearby convenience stores for cheap meals
    konbini = find_nearby_services(latitude=KAWAGUCHIKO_LAT, longitude=KAWAGUCHIKO_LON, category="konbini")
    assert konbini["success"] is True
    assert konbini["count"] >= 1
    
    # 3. Create budget itinerary
    itin = create_itinerary(party_type="solo", duration_days=1, budget_tier="budget", pace="fast")
    assert itin["success"] is True
    assert itin["total_days"] == 1
    
    # 4. Budget calculation
    budget = calculate_trip_budget(itin["itinerary"])
    assert budget["success"] is True
    assert "total_estimated_budget_jpy" in budget


def test_scenario_2_tokyo_day_tripper():
    """Scenario 2: Tokyo Day-Tripper (Single day trip, Chureito, Oishi Park, Retro bus)."""
    # 1. Check transit departures from Kawaguchiko Station
    schedule = get_transport_schedule(station_or_stop="kawaguchiko_station")
    assert schedule["success"] is True
    assert len(schedule["scheduled_departures"]) >= 1
    
    # 2. Calculate route between Kawaguchiko Station and Chureito Pagoda (Arakurayama)
    route = calculate_route(origin="kawaguchiko_station", destination="arakurayama_sengen_park")
    assert route["success"] is True
    assert route["total_options"] >= 1
    
    # 3. Weather check for Fuji visibility
    weather = get_weather(month=4)
    assert weather["success"] is True
    assert "fuji_visibility_probability" in weather


def test_scenario_3_multigenerational_family():
    """Scenario 3: Multigenerational Family (Grandparents, children, barrier-free, elevator)."""
    # 1. Check accessibility for Arakurayama (steep steps warning)
    acc_chureito = check_accessibility(place_id="arakurayama_chureito")
    assert acc_chureito["success"] is True
    assert acc_chureito["is_wheelchair_accessible"] is False or acc_chureito.get("stair_step_count", 0) > 300
    
    # 2. Check accessibility for Oishi Park (accessible)
    acc_oishi = check_accessibility(place_id="kawaguchiko_oishi_park")
    assert acc_oishi["success"] is True
    assert acc_oishi["is_wheelchair_accessible"] is True
    
    # 3. Locate accessible restrooms
    toilets = find_nearby_services(latitude=KAWAGUCHIKO_LAT, longitude=KAWAGUCHIKO_LON, category="accessible_toilet")
    assert toilets["success"] is True
    assert toilets["count"] >= 1


def test_scenario_4_teen_content_creator():
    """Scenario 4: Teen Content Creator (Top photography spots, vibrant sakura, aesthetics)."""
    # 1. Search photo viewpoints
    spots = search_destinations(category="viewpoint", query="fuji")
    assert spots["success"] is True
    assert spots["count"] >= 1
    
    # 2. Check crowd to avoid congested photos
    crowd = get_crowd_information(place_id="kawaguchiko_oishi_park", scenario="high")
    assert crowd["success"] is True
    assert "crowd_level" in crowd
    assert len(crowd["alternatives"]) >= 1


def test_scenario_5_rain_poor_visibility():
    """Scenario 5: Rain / Poor Visibility Day (Museums, cultural activities, onsen)."""
    # 1. Search indoor cultural activities
    indoor_spots = search_destinations(category="museum")
    assert indoor_spots["success"] is True
    assert indoor_spots["count"] >= 1
    
    # 2. Check weather advisories
    advisories = get_travel_advisories()
    assert advisories["success"] is True
    assert "advisories" in advisories


def test_scenario_6_off_season_winter_traveler():
    """Scenario 6: Off-Season Winter Traveler (Road ice warnings, cold weather)."""
    disruptions = get_travel_advisories()
    assert disruptions["success"] is True
    assert "advisories" in disruptions
    assert any("freeze" in str(d).lower() or "ice" in str(d).lower() or "road" in str(d).lower() or "delay" in str(d).lower() for d in disruptions["advisories"])


def test_scenario_7_solo_female_traveler():
    """Scenario 7: Solo Female Traveler (Safe transit, 24/7 konbini, emergency hotline 110/119)."""
    police = find_nearby_services(latitude=KAWAGUCHIKO_LAT, longitude=KAWAGUCHIKO_LON, category="police")
    assert police["success"] is True
    assert police["count"] >= 1
    
    hospitals = find_nearby_services(latitude=KAWAGUCHIKO_LAT, longitude=KAWAGUCHIKO_LON, category="hospital")
    assert hospitals["success"] is True
    assert hospitals["count"] >= 1


def test_scenario_8_japanese_culture_enthusiast():
    """Scenario 8: Japanese Culture Enthusiast (Traditional crafts, authentic shrines)."""
    chureito = get_destination_details(place_id="arakurayama_chureito")
    assert chureito["success"] is True
    assert "pagoda" in chureito["destination"]["name_en"].lower() or "chureito" in chureito["destination"]["name_en"].lower() or "sengen" in chureito["destination"]["name_ja"]


def test_scenario_9_outdoor_adventurer():
    """Scenario 9: Outdoor Adventurer (Hiking, lakes, alternative trails)."""
    # Alternative routing when bus is missed
    alt_routes = find_alternative_routes(origin="kawaguchiko_station", destination="kawaguchiko_oishi_park")
    assert alt_routes["success"] is True
    assert alt_routes["total_options"] >= 1


def test_scenario_10_culinary_traveler():
    """Scenario 10: Foodie / Culinary Traveler (Local Hoto noodles, dining)."""
    # Create food and nature itinerary
    itin = create_itinerary(party_type="couple", duration_days=1, interests=["cultural", "viewpoint"])
    assert itin["success"] is True
    
    # Calculate budget including meals
    budget = calculate_trip_budget(itin["itinerary"])
    assert budget["success"] is True
    assert budget["total_estimated_budget_jpy"] > 0
    
    # Save itinerary permanently
    saved = save_trip(itinerary_dict=itin["itinerary"], title="Gourmet Fuji Culinary Trail")
    assert saved["success"] is True
    assert "share_token" in saved
    assert "pdf_url" in saved
