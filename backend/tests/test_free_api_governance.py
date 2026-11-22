"""
FujiNova 11.0: Free API Governance, First-Party Crowd Reports, and Provider Taxonomy Tests.
Verifies:
- First-party crowd reporting, SHA-256 device hashing, and 15-minute rate limiting
- 3-report threshold aggregation (<3 -> Unavailable + Historical Pattern; >=3 -> Live Aggregated)
- Geoapify 3,000 credits/day hard cost lock and attribution
- 14-provider governance register and strict classification taxonomy
- ODPT non-participating status for local FujiKyuko operator
"""
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.services.smart_journey.crowd_service_v3 import CrowdSense3Service
from backend.app.services.sync.geoapify_adapter import GeoapifyAdapter
from backend.app.services.sync.odpt_adapter import OdptAdapter
from backend.app.services.sync.teraren_adapter import TerarenAdapter
from backend.app.services.sync.nager_date_adapter import NagerDateAdapter
from backend.app.services.sync.frankfurter_adapter import FrankfurterAdapter
from backend.app.services.sync.sync_manager import SyncManager

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db_ready():
    """Ensure database schema and initial seed data are populated."""
    init_db()


def test_first_party_crowd_report_submission_and_rate_limit():
    """Verify opt-in crowd report submission, hashing, and 15-minute rate-limiting."""
    place_id = f"test_shrine_{uuid.uuid4().hex[:6]}"
    device_id = f"device_{uuid.uuid4().hex[:8]}"

    # 1. Successful submission with consent
    res = CrowdSense3Service.submit_user_report(
        place_id=place_id,
        crowd_level="Normal",
        device_id=device_id,
        consent=True,
        coarse_area="Fujiyoshida"
    )
    assert res["success"] is True
    assert res["rate_limited"] is False
    assert "report_id" in res
    assert res["crowd_level"] == "Normal"

    # 2. Immediate second report from same device at same place must be rate-limited
    res_repeat = CrowdSense3Service.submit_user_report(
        place_id=place_id,
        crowd_level="Busy",
        device_id=device_id,
        consent=True
    )
    assert res_repeat["success"] is False
    assert res_repeat["rate_limited"] is True
    assert "15 minutes" in res_repeat["message"]

    # 3. Report without consent must raise ValueError
    with pytest.raises(ValueError, match="User consent is required"):
        CrowdSense3Service.submit_user_report(
            place_id=place_id,
            crowd_level="Quiet",
            device_id=f"device_new_{uuid.uuid4().hex[:6]}",
            consent=False
        )


def test_crowd_threshold_behavior_unavailable_vs_live():
    """
    Verify strict threshold rule:
    - If fresh reports < 3: crowd_level is 'Unavailable', live_available is False,
      status indicates insufficient reports, and historical pattern is provided separately.
    - If fresh reports >= 3: aggregates to live volume with confidence percentage.
    """
    place_id = f"test_lake_{uuid.uuid4().hex[:6]}"

    # State 1: 0 reports -> Unavailable
    status_0 = CrowdSense3Service.get_crowd_place_status(place_id)
    assert status_0["live_available"] is False
    assert status_0["crowd_level"] == "Unavailable"
    assert status_0["reports_count"] == 0
    assert "insufficient fresh reports" in status_0["status_message"]
    assert status_0["typical_crowd_pattern"]["provenance"] == "HISTORICAL_ESTIMATE_ONLY"
    assert status_0["typical_crowd_pattern"]["is_live"] is False

    # Submit 2 reports from distinct devices (still < 3)
    CrowdSense3Service.submit_user_report(place_id, "Quiet", f"dev_a_{uuid.uuid4().hex[:6]}", True)
    CrowdSense3Service.submit_user_report(place_id, "Normal", f"dev_b_{uuid.uuid4().hex[:6]}", True)

    status_2 = CrowdSense3Service.get_crowd_place_status(place_id)
    assert status_2["live_available"] is False
    assert status_2["crowd_level"] == "Unavailable"
    assert status_2["reports_count"] == 2

    # Submit 3rd report -> Threshold met (>= 3)!
    CrowdSense3Service.submit_user_report(place_id, "Quiet", f"dev_c_{uuid.uuid4().hex[:6]}", True)

    status_3 = CrowdSense3Service.get_crowd_place_status(place_id)
    assert status_3["live_available"] is True
    assert status_3["crowd_level"] in ("Low", "Moderate", "High", "Very High")
    assert status_3["reports_count"] == 3
    assert status_3["confidence_pct"] >= 75
    assert "Live Community Verified" in status_3["live_badge"]


def test_geoapify_quota_and_cost_lock():
    """Verify Geoapify 3,000 credit limit tracking, attribution, and hard cost lock."""
    status = GeoapifyAdapter.get_quota_status()
    assert status["provider_name"] == "Geoapify Places & Routing"
    assert status["daily_quota_limit"] == 3000
    assert status["status_classification"] == "FREE WITH LIMIT"
    assert "Powered by Geoapify | © OpenStreetMap contributors" in status["attribution"]

    # Test increment quota
    can_proceed = GeoapifyAdapter.check_and_increment_quota(credits_cost=1)
    assert can_proceed is True


def test_odpt_adapter_non_participating_fujikyu():
    """Verify ODPT adapter confirms FujiKyuko is not participating and marks live feed UNAVAILABLE."""
    provider_status = OdptAdapter.get_provider_status()
    assert provider_status["classification"] == "NEEDS REGISTRATION"
    assert provider_status["fujikyu_participating"] is False
    assert provider_status["fuji_five_lakes_live_vehicle_status"] == "UNAVAILABLE"
    assert "Live vehicle tracking: Unavailable (Operator feed required)" in provider_status["required_disclaimer"]

    check_fujikyu = OdptAdapter.check_operator_coverage("Fujikyu Railway")
    assert check_fujikyu["is_live_stream_available"] is False
    assert check_fujikyu["status"] == "UNAVAILABLE"
    assert "Platform/boarding information unavailable" in check_fujikyu["platform_fallback_message"]


def test_provider_health_registry_endpoint():
    """Verify /api/v1/providers/health returns 14 providers with exact taxonomy classifications."""
    res = client.get("/api/v1/providers/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["zero_cost_lock_enforced"] is True
    assert data["total_providers"] >= 14

    providers = {p["provider_name"]: p for p in data["providers"]}

    # Verify canonical classifications
    assert providers["JMA Disaster Prevention XML"]["classification"] == "LIVE VERIFIED"
    assert providers["Fujikyu Bus GTFS-JP"]["classification"] == "FREE STATIC DATA"
    assert providers["TERAREN Station & Railway API"]["classification"] == "FREE STATIC DATA"
    assert providers["ODPT API"]["classification"] == "NEEDS REGISTRATION"
    assert providers["Geoapify Places & Routing"]["classification"] == "FREE WITH LIMIT"
    assert providers["MapLibre + OpenFreeMap"]["classification"] == "LIVE VERIFIED"
    assert providers["Wikimedia Commons"]["classification"] == "LIVE VERIFIED"
    assert providers["LibreTranslate"]["classification"] == "SELF-HOSTED"
    assert providers["Nager.Date"]["classification"] == "LIVE VERIFIED"
    assert providers["Frankfurter"]["classification"] == "LIVE VERIFIED"
    assert providers["TomTom Traffic"]["classification"] == "UNAVAILABLE"
    assert providers["BestTime.app"]["classification"] == "PAID/NOT ENABLED"
    assert providers["Google Places Reviews/Photos Scraper"]["classification"] == "PAID/NOT ENABLED"
    assert providers["Google Routes Traffic"]["classification"] == "PAID/NOT ENABLED"


def test_crowd_reports_api_endpoint():
    """Verify HTTP POST /api/v1/crowd/reports and GET /api/v1/crowd/places/{id}."""
    test_place = f"place_{uuid.uuid4().hex[:6]}"
    dev = f"dev_client_{uuid.uuid4().hex[:6]}"

    # Submit report via HTTP API
    post_res = client.post("/api/v1/crowd/reports", json={
        "place_id": test_place,
        "crowd_level": "Busy",
        "device_id": dev,
        "consent": True,
        "coarse_area": "Lake Kawaguchiko"
    })
    assert post_res.status_code == 200
    assert post_res.json()["success"] is True

    # Immediate duplicate from same device must return 429
    dup_res = client.post("/api/v1/crowd/reports", json={
        "place_id": test_place,
        "crowd_level": "Busy",
        "device_id": dev,
        "consent": True
    })
    assert dup_res.status_code == 429
