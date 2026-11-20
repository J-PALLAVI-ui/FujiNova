"""Tests for FujiNova Itinerary Export & QR System (Stage 8)."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

SAMPLE_ITINERARY = {
    "plan_id": "test_plan_001",
    "title": "Mt Fuji Spring Sakura Tour",
    "total_days": 1,
    "budget_tier": "standard",
    "pace": "moderate",
    "party_composition": "solo",
    "days": [
        {
            "day_number": 1,
            "title": "Lakeside Sakura & Cultural Pagoda",
            "stops": [
                {
                    "stop_id": "s1",
                    "place_id": "kawaguchiko_oishi_park",
                    "name_en": "Oishi Park",
                    "name_ja": "大石公園",
                    "fuji_view_rating": 5,
                    "accessibility_status": "VERIFIED_ACCESSIBLE",
                    "estimated_arrival": "09:00",
                    "duration_minutes": 60,
                    "admission_info": "Free"
                },
                {
                    "stop_id": "s2",
                    "place_id": "arakurayama_chureito",
                    "name_en": "Chureito Pagoda",
                    "name_ja": "新倉山浅間公園（忠霊塔）",
                    "fuji_view_rating": 5,
                    "accessibility_status": "STEEP_STAIRS",
                    "estimated_arrival": "11:00",
                    "duration_minutes": 90,
                    "admission_info": "Free"
                }
            ]
        }
    ]
}


def test_save_and_fetch_shared_itinerary():
    """Verify itinerary can be saved and retrieved via share token."""
    res = client.post("/api/v1/itinerary/save", json={
        "title": "Mt Fuji Spring Sakura Tour",
        "itinerary": SAMPLE_ITINERARY,
        "is_private": False
    })
    assert res.status_code == 200
    data = res.json()
    assert "share_token" in data
    assert "share_url" in data
    assert "qr_url" in data
    assert "pdf_url" in data

    token = data["share_token"]

    # Fetch shared trip
    fetch_res = client.get(f"/api/v1/itinerary/share/{token}")
    assert fetch_res.status_code == 200
    fetched = fetch_res.json()
    assert fetched["title"] == "Mt Fuji Spring Sakura Tour"
    assert len(fetched["itinerary"]["days"]) == 1


def test_generate_qr_code_image():
    """Verify QR endpoint returns valid image/png bytes."""
    save_res = client.post("/api/v1/itinerary/save", json={
        "title": "QR Test Trip",
        "itinerary": SAMPLE_ITINERARY
    })
    token = save_res.json()["share_token"]

    qr_res = client.get(f"/api/v1/itinerary/qr/{token}")
    assert qr_res.status_code == 200
    assert qr_res.headers["content-type"] == "image/png"
    assert len(qr_res.content) > 100


def test_export_itinerary_pdf():
    """Verify PDF export returns valid application/pdf bytes with Japanese characters."""
    save_res = client.post("/api/v1/itinerary/save", json={
        "title": "PDF Test Trip",
        "itinerary": SAMPLE_ITINERARY
    })
    token = save_res.json()["share_token"]

    # Test via query token
    pdf_res = client.get(f"/api/v1/itinerary/export-pdf?token={token}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")
    assert len(pdf_res.content) > 1000

    # Test via direct JSON body
    pdf_direct = client.post("/api/v1/itinerary/export-pdf", json=SAMPLE_ITINERARY)
    assert pdf_direct.status_code == 200
    assert pdf_direct.headers["content-type"] == "application/pdf"
    assert pdf_direct.content.startswith(b"%PDF")
