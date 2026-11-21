"""FujiNova 10.0: Live Intelligence & Real-Time Sync Unit & Integration Tests."""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.sync.open_meteo_adapter import (
    OpenMeteoAdapter, calculate_fuji_visibility_score, get_visibility_verdict, KEY_REGIONAL_STATIONS
)
from backend.app.services.sync.jma_hazards_adapter import JMAHazardsAdapter
from backend.app.services.sync.wikimedia_adapter import WikimediaAdapter, CANONICAL_WIKIMEDIA_REGISTRY
from backend.app.services.sync.crowdsense_2 import CrowdSense2Engine
from backend.app.agent.tools import (
    get_live_weather_and_visibility,
    get_hazard_and_safety_alerts,
    get_destination_gallery,
    get_live_crowdsense_2,
    get_provider_sync_status
)


def test_visibility_score_calculation():
    """Verify deterministic Mount Fuji visibility probability metric."""
    # Clear sky, low humidity, high visibility -> High score
    score_clear = calculate_fuji_visibility_score(cloud_cover_pct=10, humidity_pct=40, visibility_m=30000)
    assert score_clear >= 80
    assert "Excellent" in get_visibility_verdict(score_clear)

    # Overcast, high humidity, low visibility -> Low score
    score_overcast = calculate_fuji_visibility_score(cloud_cover_pct=100, humidity_pct=95, visibility_m=5000)
    assert score_overcast <= 35
    assert "Low" in get_visibility_verdict(score_overcast) or "Poor" in get_visibility_verdict(score_overcast)


@pytest.mark.asyncio
async def test_open_meteo_adapter_fallback():
    """Verify Open-Meteo adapter provides realistic elevation-based conditions."""
    adapter = OpenMeteoAdapter()
    kawaguchiko_station = KEY_REGIONAL_STATIONS[2]
    data = await adapter.fetch_station_weather(kawaguchiko_station)
    assert data["location_id"] == "kawaguchiko"
    assert "temperature_c" in data
    assert "fuji_visibility_probability" in data
    assert "wind_speed_kmh" in data


@pytest.mark.asyncio
async def test_jma_hazards_adapter():
    """Verify JMA hazard adapter tracks Mt. Fuji volcanic status and advisories."""
    adapter = JMAHazardsAdapter()
    alerts = await adapter.synchronize_alerts()
    assert len(alerts) >= 1
    # Verify volcanic status is tracked
    has_volcano = any(a.get("hazard_type") == "volcanic" for a in alerts)
    assert has_volcano is True


def test_wikimedia_commons_gallery():
    """Verify Wikimedia Commons adapter retrieves real photographs with attribution."""
    adapter = WikimediaAdapter()
    adapter.seed_initial_gallery()
    
    # Test Chureito Pagoda
    chureito_photos = CANONICAL_WIKIMEDIA_REGISTRY.get("arakurayama_chureito", [])
    assert len(chureito_photos) >= 1
    p = chureito_photos[0]
    assert "upload.wikimedia.org" in p["image_url"]
    assert "author" in p
    assert "license_name" in p
    assert "source_url" in p


def test_crowdsense_2_multi_evidence():
    """Verify CrowdSense 2.0 multi-evidence model and weather modification."""
    engine = CrowdSense2Engine()

    # Sunny weekend afternoon at Oishi Park -> High crowd
    res_busy = engine.evaluate_place_crowd(
        place_id="kawaguchiko_oishi_park",
        current_hour=13,
        is_weekend=True,
        weather_rain_prob=0,
        weather_cloud_cover=10
    )
    assert res_busy["crowd_level"] in ("Moderate", "High", "Very High")
    assert res_busy["evidence_type"] in ("OFFICIAL_OPERATOR_ANNOUNCEMENT", "HISTORICAL_SEASONAL_ESTIMATE", "WEATHER_MODIFIED_FLOW_MODEL")

    # Place with no active operator alert evaluates to historical estimate (not live head count)
    res_saiko = engine.evaluate_place_crowd(
        place_id="saiko_iyashi_no_sato",
        current_hour=13,
        is_weekend=True,
        weather_rain_prob=10,
        weather_cloud_cover=20
    )
    assert res_saiko["is_live_observation"] is False

    # Heavy rain at Saiko -> Outdoor crowd reduced via weather modifier
    res_rain = engine.evaluate_place_crowd(
        place_id="saiko_iyashi_no_sato",
        current_hour=13,
        is_weekend=True,
        weather_rain_prob=90,
        weather_cloud_cover=100
    )
    assert res_rain["evidence_type"] == "WEATHER_MODIFIED_FLOW_MODEL"
    # Diversion recommendation exists
    if res_busy["crowd_level"] in ("High", "Very High"):
        assert res_busy["diversion"] is not None


def test_hana_fujinova_10_tools():
    """Verify all 5 new Hana tools execute cleanly."""
    weather = get_live_weather_and_visibility()
    assert weather["success"] is True

    hazards = get_hazard_and_safety_alerts()
    assert hazards["success"] is True
    assert hazards["fuji_volcanic_level"] == 1

    gallery = get_destination_gallery("kawaguchiko_oishi_park")
    assert gallery["success"] is True
    assert len(gallery["photos"]) >= 1

    crowd = get_live_crowdsense_2("kawaguchiko_oishi_park")
    assert crowd["success"] is True

    health = get_provider_sync_status()
    assert health["success"] is True
    assert health["zero_cost_lock_enforced"] is True


def test_live_intel_api_endpoints():
    """Verify FastAPI live intelligence endpoints."""
    with TestClient(app) as client:
        # Weather
        r_w = client.get("/api/v1/live/weather")
        assert r_w.status_code == 200
        data_w = r_w.json()
        assert data_w["success"] is True
        assert "overall_fuji_visibility_score" in data_w

        # Hazards
        r_h = client.get("/api/v1/live/hazards")
        assert r_h.status_code == 200
        data_h = r_h.json()
        assert data_h["fuji_volcanic_level"] == 1

        # Gallery
        r_g = client.get("/api/v1/live/gallery/arakurayama_chureito")
        assert r_g.status_code == 200
        data_g = r_g.json()
        assert data_g["count"] >= 1
        assert "photos" in data_g

        # Crowd 2.0
        r_c = client.get("/api/v1/live/crowd/kawaguchiko_oishi_park?hour=12&is_weekend=true")
        assert r_c.status_code == 200
        data_c = r_c.json()
        assert "crowd_status" in data_c

        # Health
        r_hl = client.get("/api/v1/live/health")
        assert r_hl.status_code == 200
        data_hl = r_hl.json()
        assert data_hl["zero_cost_lock_enforced"] is True
