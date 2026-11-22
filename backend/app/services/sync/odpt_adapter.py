"""
FujiNova 11.0: ODPT (Open Data Challenge for Public Transportation) Adapter.
Classification: NEEDS REGISTRATION / UNAVAILABLE for Fuji Five Lakes.
ODPT provides real-time transit telemetry for participating operators across Greater Tokyo.
Crucial operational reality: FujiKyuko is NOT a participating operator in the ODPT open data initiative.
Therefore, real-time vehicle GPS / occupancy for FujiKyuko is strictly marked as:
"Live vehicle tracking: Unavailable (Operator feed required)".
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("fujinova.sync.odpt")

PROVIDER_NAME = "ODPT API"
CLASSIFICATION = "NEEDS REGISTRATION"


class OdptAdapter:
    """ODPT API adapter with operator participation verification."""

    PARTICIPATING_OPERATORS = [
        "JR-East", "TokyoMetro", "Toei", "Tokyu", "Keio", "Odakyu", "Seibu", "Tobu"
    ]

    NON_PARTICIPATING_REGIONAL = [
        "Fujikyu Railway", "Fujikyu Bus", "Yamanashi Kotsu"
    ]

    @classmethod
    def get_provider_status(cls) -> Dict[str, Any]:
        return {
            "provider_name": PROVIDER_NAME,
            "classification": CLASSIFICATION,
            "token_required": True,
            "participating_operators_count": len(cls.PARTICIPATING_OPERATORS),
            "fujikyu_participating": False,
            "fuji_five_lakes_live_vehicle_status": "UNAVAILABLE",
            "required_disclaimer": "Live vehicle tracking: Unavailable (Operator feed required)",
            "notes": (
                "ODPT provides real-time feeds for Tokyo metro & JR East trunk lines feeding into Otsuki. "
                "Local Fuji Five Lakes operators (Fujikyu Railway and Fujikyu Bus) do not broadcast real-time "
                "GTFS-RT/ODPT feeds. Static GTFS-JP timetables are used instead."
            )
        }

    @classmethod
    def check_operator_coverage(cls, operator_name: str) -> Dict[str, Any]:
        """Verify whether an operator publishes live ODPT streams."""
        for non_p in cls.NON_PARTICIPATING_REGIONAL:
            if non_p.lower() in operator_name.lower():
                return {
                    "operator": operator_name,
                    "is_live_stream_available": False,
                    "status": "UNAVAILABLE",
                    "reason": "Operator does not participate in ODPT real-time vehicle broadcast feeds.",
                    "platform_fallback_message": "Platform/boarding information unavailable - please confirm on the operator departure board/signage"
                }

        return {
            "operator": operator_name,
            "is_live_stream_available": True,
            "status": "AVAILABLE_FOR_PARTICIPANTS"
        }
