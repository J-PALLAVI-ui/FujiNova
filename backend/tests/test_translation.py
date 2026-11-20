"""Tests for FujiNova Multilingual Japanese Travel Translation Engine."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_translation_transit_endpoint():
    """Verify POST /api/v1/translate returns culturally grounded Japanese translation."""
    payload = {
        "text": "Where is the Red Line bus stop?",
        "source_language": "en",
        "target_language": "ja",
        "travel_mode": "transit",
        "formality": "polite_keigo"
    }
    response = client.post("/api/v1/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_language"] == "ja"
    assert "バス" in data["translated_text"] or "停" in data["translated_text"] or "どこ" in data["translated_text"]
    assert data["phonetic_reading"] is not None
    assert len(data["phonetic_reading"]) > 0


def test_translation_hotel_endpoint():
    """Verify hotel luggage request translation."""
    payload = {
        "text": "Could you please hold my luggage before check-in?",
        "source_language": "en",
        "target_language": "ja",
        "travel_mode": "hotel",
        "formality": "polite_keigo"
    }
    response = client.post("/api/v1/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_language"] == "ja"
    assert data["formality"] == "polite_keigo"
    assert data["cultural_tip"] is not None


def test_translation_places_have_image_url():
    """Verify places API returns image_url for all items."""
    response = client.get("/api/v1/places?limit=5")
    assert response.status_code == 200
    places = response.json()
    assert len(places) > 0
    for p in places:
        assert "image_url" in p
        assert p["image_url"] is not None
        assert p["image_url"].startswith("http")
