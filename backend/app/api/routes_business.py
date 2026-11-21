"""FujiNova 9.0: Local Regional Business & Tourism Directory Router."""
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/api/v1/businesses", tags=["Business Directory"])


class BusinessListingSchema(BaseModel):
    business_id: str
    name_en: str
    name_ja: str
    category: str
    latitude: float
    longitude: float
    address_ja: Optional[str] = None
    address_en: Optional[str] = None
    phone: Optional[str] = None
    operating_hours: Optional[str] = None
    price_range_jpy: Optional[str] = None
    official_website: Optional[str] = None
    verified_partner: int = 0
    source_verification_date: Optional[str] = None


@router.get("", response_model=List[BusinessListingSchema])
def list_business_directory(
    category: Optional[str] = Query(None, description="ryokan, hotel, restaurant, tour, craft_workshop, cultural_experience, bicycle_rental, luggage_storage, transport")
):
    """Retrieve verified local businesses, traditional ryokans, rentals, and workshops."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT * FROM business_listings WHERE category = ? ORDER BY verified_partner DESC;", (category,))
        else:
            cursor.execute("SELECT * FROM business_listings ORDER BY verified_partner DESC;")
        rows = [dict(r) for r in cursor.fetchall()]
    return rows
