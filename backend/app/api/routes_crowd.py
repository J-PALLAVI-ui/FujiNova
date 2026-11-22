"""FujiNova CrowdSense API Router."""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.services.crowd.crowd_models import (
    CrowdScenario,
    CrowdSystemStatusResponse,
    CrowdRecommendationRequest,
    CrowdRecommendationResponse,
    PlaceCrowdStatus,
    CrowdUserReportRequest,
)
from backend.app.services.crowd.crowd_service import crowd_service
from backend.app.services.crowd.recommendation_service import recommendation_service
from backend.app.services.smart_journey.crowd_service_v3 import CrowdSense3Service

router = APIRouter(prefix="/api/v1/crowd", tags=["CrowdSense"])


@router.post("/reports")
def submit_crowd_report(report: CrowdUserReportRequest):
    """
    Submit a first-party opt-in crowd report with privacy hashing and 15-minute rate-limiting.
    Guarantees ₹0 spend and honest community verification.
    """
    try:
        res = CrowdSense3Service.submit_user_report(
            place_id=report.place_id,
            crowd_level=report.crowd_level,
            device_id=report.device_id,
            consent=report.consent,
            coarse_area=report.coarse_area
        )
        if res.get("rate_limited"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=res["message"]
            )
        return res
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving crowd report: {str(e)}"
        )


@router.get("/status", response_model=CrowdSystemStatusResponse)
def get_crowd_system_status(scenario: CrowdScenario = Query("high", description="Current demonstration scenario")):
    """Inspect crowd data provider availability and active demonstration scenarios."""
    return crowd_service.get_system_status(active_scenario=scenario)


@router.post("/recommendations", response_model=CrowdRecommendationResponse)
def get_crowd_recommendations(request: CrowdRecommendationRequest):
    """Calculate deterministic quieter alternative destinations matching visitor preferences."""
    try:
        return recommendation_service.get_recommendations(request)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating crowd alternatives: {str(e)}"
        )


@router.get("/places/{place_id}", response_model=PlaceCrowdStatus)
def get_single_place_crowd_status(
    place_id: str,
    scenario: CrowdScenario = Query("high", description="Simulated crowd scenario: 'low', 'moderate', or 'high'")
):
    """
    Retrieve crowd score, live community report telemetry, and honest historical pattern.
    If >= 3 fresh reports exist in the last 60 minutes, returns live aggregated status.
    Otherwise reports live data as unavailable with separate historical pattern.
    """
    base_status = crowd_service.get_place_crowd_status(place_id=place_id, scenario=scenario)

    try:
        live = CrowdSense3Service.get_crowd_place_status(place_id)
        base_status.live_available = live["live_available"]
        base_status.reports_count = live["reports_count"]
        base_status.status_message = live["status_message"]
        base_status.typical_crowd_pattern = live["typical_crowd_pattern"]

        if live["live_available"]:
            level_str = live["crowd_level"].upper()
            if level_str == "VERY HIGH":
                level_str = "HIGH"
            base_status.level = level_str
            base_status.score = live["numeric_score"]
            base_status.classification = "USER_REPORTED"
            base_status.classification_label = live["live_badge"]
            base_status.is_simulated = False
    except Exception:
        pass

    return base_status


@router.get("/places", response_model=Dict[str, PlaceCrowdStatus])
def get_all_places_crowd_status(
    scenario: CrowdScenario = Query("high", description="Simulated crowd scenario: 'low', 'moderate', or 'high'")
):
    """Retrieve simulated crowd metrics across all 35 destinations under selected scenario."""
    return crowd_service.get_all_places_crowd_status(scenario=scenario)
