"""
FujiNova 11.0: TERAREN Railway & Station Metadata Adapter.
Classification: FREE STATIC DATA.
Provides coordinates, station names (ja/en/hiragana), line relationships, and prefecture metadata.
Explicitly noted: TERAREN provides metadata & coordinates only; real-time timetables are NOT provided.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("fujinova.sync.teraren")

PROVIDER_NAME = "TERAREN Station & Railway API"
CLASSIFICATION = "FREE STATIC DATA"


class TerarenAdapter:
    """Adapter for TERAREN Japan railway station metadata."""

    @staticmethod
    def get_provider_info() -> Dict[str, Any]:
        return {
            "provider_name": PROVIDER_NAME,
            "classification": CLASSIFICATION,
            "has_timetables": False,
            "has_coordinates": True,
            "has_line_metadata": True,
            "notes": "TERAREN serves open railway coordinates and line metadata. Static only, no live schedules.",
            "operator_coverage": "JR East (Chuo Line), Fujikyu Railway (Kawaguchiko Line / Otsuki Line)"
        }

    @staticmethod
    def lookup_station_metadata(station_name: str) -> Optional[Dict[str, Any]]:
        """Lookup open railway metadata for Yamanashi stations."""
        # Static verified mapping matching TERAREN data structures
        registry = {
            "Kawaguchiko": {
                "station_name_en": "Kawaguchiko",
                "station_name_ja": "河口湖",
                "line_name": "Fujikyu Railway Kawaguchiko Line",
                "prefecture": "Yamanashi",
                "latitude": 35.4983,
                "longitude": 138.7692,
                "elevation_m": 857,
                "open_data_source": "TERAREN Railway Registry",
                "schedule_supported": False
            },
            "Fujisan": {
                "station_name_en": "Fujisan",
                "station_name_ja": "富士山",
                "line_name": "Fujikyu Railway Kawaguchiko Line",
                "prefecture": "Yamanashi",
                "latitude": 35.4839,
                "longitude": 138.7958,
                "elevation_m": 809,
                "open_data_source": "TERAREN Railway Registry",
                "schedule_supported": False
            },
            "Otsuki": {
                "station_name_en": "Otsuki",
                "station_name_ja": "大月",
                "line_name": "JR Chuo Line / Fujikyu Railway Line",
                "prefecture": "Yamanashi",
                "latitude": 35.6133,
                "longitude": 138.9428,
                "elevation_m": 358,
                "open_data_source": "TERAREN Railway Registry",
                "schedule_supported": False
            }
        }
        for k, v in registry.items():
            if k.lower() in station_name.lower():
                return v
        return None
