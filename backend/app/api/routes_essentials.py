"""FujiNova 9.0: Essential Services API Routes (Hospitals, Pharmacies, Konbini, ATMs, Toilets)."""
import math
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/api/v1/essentials", tags=["Travel Essentials"])

EMERGENCY_HOTLINES = [
    {
        "title_en": "Police Assistance (110)",
        "title_ja": "警察 (110番)",
        "number": "110",
        "description_en": "Traffic accidents, theft, lost property, general emergencies. Free call from any phone without coins.",
        "description_ja": "事故、事件、紛失物、緊急通報。公衆電話からも無料通話可能。",
        "available_languages": ["Japanese", "English"]
    },
    {
        "title_en": "Ambulance & Fire Department (119)",
        "title_ja": "救急・消防 (119番)",
        "number": "119",
        "description_en": "Sudden medical illness, severe injury, fire. State clearly: 'Kyu-kyu desu' (Medical emergency).",
        "description_ja": "急病、重傷、火災。救急要請。",
        "available_languages": ["Japanese", "English", "Chinese", "Korean", "Spanish"]
    },
    {
        "title_en": "Japan Visitor Hotline (JNTO)",
        "title_ja": "日本政府観光局 ビジターホットライン",
        "number": "050-3816-2720",
        "description_en": "24/7 official multilingual support for tourists across Japan. Accident advice, natural disaster updates.",
        "description_ja": "外国人旅行者向け24時間365日多言語コールセンター。",
        "available_languages": ["English", "Japanese", "Chinese", "Korean"]
    },
    {
        "title_en": "Japan Helpline (24hr Emergency Non-Profit)",
        "title_ja": "ジャパン・ヘルプライン",
        "number": "0570-000-911",
        "description_en": "24-hour nationwide emergency counseling, language assistance, and foreign resident medical guidance.",
        "description_ja": "24時間緊急電話相談サービス。",
        "available_languages": ["English", "Japanese"]
    }
]


class EssentialServiceSchema(BaseModel):
    service_id: str
    name_en: str
    name_ja: str
    category: str
    latitude: float
    longitude: float
    address_en: Optional[str] = None
    address_ja: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    is_24_hours: int = 0
    has_english_support: int = 0
    distance_km: Optional[float] = None
    source: str
    last_verified_date: str


@router.get("", response_model=List[EssentialServiceSchema])
def list_essential_services(
    category: Optional[str] = Query(None, description="hospital, pharmacy, convenience_store, atm, toilet, tourist_info, train_station, bus_stop, parking, restaurant"),
    lat: Optional[float] = Query(None, description="User current latitude for distance sorting"),
    lon: Optional[float] = Query(None, description="User current longitude for distance sorting"),
    limit: int = Query(20, ge=1, le=100)
):
    """List verified regional emergency, medical, convenience, and transit facilities."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT * FROM essential_services WHERE category = ? LIMIT ?;", (category, limit * 2))
        else:
            cursor.execute("SELECT * FROM essential_services LIMIT ?;", (limit * 2,))
        rows = [dict(r) for r in cursor.fetchall()]

    if lat is not None and lon is not None:
        for r in rows:
            d_lat = (r["latitude"] - lat) * 111.0
            d_lon = (r["longitude"] - lon) * 111.0 * math.cos(math.radians(lat))
            r["distance_km"] = round(math.sqrt(d_lat * d_lat + d_lon * d_lon), 2)
        rows.sort(key=lambda x: x.get("distance_km") or 999.0)

    return rows[:limit]


@router.get("/emergency")
def get_emergency_directory():
    """Retrieve official Japanese emergency hotline contacts (no AI required)."""
    return {
        "success": True,
        "country": "Japan (Regional: Yamanashi Prefecture)",
        "hotlines": EMERGENCY_HOTLINES,
        "local_police_station": {
            "name_ja": "富士吉田警察署 (河口湖交番)",
            "name_en": "Fujiyoshida Police Station - Kawaguchiko Koban",
            "address": "3641-2 Funatsu, Fujikawaguchiko (opposite Kawaguchiko Station)",
            "phone": "+81-555-22-0110"
        }
    }
