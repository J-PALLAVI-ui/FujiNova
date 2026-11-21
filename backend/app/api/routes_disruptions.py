"""FujiNova 9.0: Travel Disruption & Warning Monitoring Router."""
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/api/v1/disruptions", tags=["Travel Disruptions"])


class DisruptionSchema(BaseModel):
    disruption_id: str
    line_or_area: str
    disruption_type: str
    severity: str
    title_en: str
    title_ja: str
    description_en: str
    description_ja: str
    alternative_advice_en: Optional[str] = None
    alternative_advice_ja: Optional[str] = None
    source: str
    reported_at: str
    is_active: int = 1


@router.get("", response_model=List[DisruptionSchema])
def list_disruptions(
    active_only: bool = Query(True, description="Only return currently active disruptions"),
    severity: Optional[str] = Query(None, description="Filter by severity: minor, moderate, severe")
):
    """Retrieve active transit delays, weather alerts, road freezes, and scenic trail notices."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        sql = "SELECT * FROM travel_disruptions WHERE 1=1"
        params = []
        if active_only:
            sql += " AND is_active = 1"
        if severity:
            sql += " AND severity = ?"
            params.append(severity)
        sql += " ORDER BY reported_at DESC;"

        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]

    return rows
