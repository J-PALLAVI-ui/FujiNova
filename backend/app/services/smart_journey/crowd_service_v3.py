"""
FujiNova 11.0 — CrowdSense 3.0 Real-World Crowd Intelligence & Hana Smart Choices.
Provides multi-source crowd status, confidence scoring, observation metadata,
and interactive alternative recommendations when destinations are busy.
Strictly adheres to ₹0 budget and honest provenance (never claiming fake live sensors).
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from backend.app.core.database import get_db_connection


class CrowdSense3Service:
    """Crowd intelligence engine and interactive alternative decision generator."""

    @staticmethod
    def get_crowd_details(place_id: str) -> Dict[str, Any]:
        """
        Get complete CrowdSense 3.0 status for a destination.
        Returns gauge score, metadata, and the 4 Hana interactive choices.
        """
        with get_db_connection() as conn:
            row = conn.execute("""
            SELECT place_id, place_name_en, place_name_ja, crowd_level, numeric_score,
                   source, confidence_level, confidence_pct, data_type, observed_time_jst,
                   last_update_text, wait_time_minutes, photo_url, alternatives_json
            FROM crowd_observations_v11
            WHERE place_id = ? OR place_id LIKE ?
            LIMIT 1
            """, (place_id, f"%{place_id}%")).fetchone()

            if not row:
                # Fallback to Chureito Pagoda default if not found
                row = conn.execute("""
                SELECT place_id, place_name_en, place_name_ja, crowd_level, numeric_score,
                       source, confidence_level, confidence_pct, data_type, observed_time_jst,
                       last_update_text, wait_time_minutes, photo_url, alternatives_json
                FROM crowd_observations_v11
                WHERE place_id = 'chureito_pagoda'
                """).fetchone()

            alternatives = json.loads(row["alternatives_json"]) if row["alternatives_json"] else {}
            crowd_level = row["crowd_level"]
            place_name = row["place_name_en"]

            # 4 Interactive Hana Options (matching user UI Screen 2)
            hana_prompt = (
                f"{place_name} appears to be busy right now. Would you like to explore another option?"
                if crowd_level in ("High", "Very High")
                else f"{place_name} currently has {crowd_level.lower()} visitor volume. Ready to proceed?"
            )

            hana_choices = [
                {
                    "choice_id": "quieter_places",
                    "title": "Yes, show me quieter places",
                    "subtitle": "Similar views with lower crowd levels",
                    "icon": "leaf",
                    "color": "#789477",
                    "items": alternatives.get("quieter_places", [])
                },
                {
                    "choice_id": "famous_alternatives",
                    "title": "Show me another famous attraction",
                    "subtitle": "A popular place with fewer crowds",
                    "icon": "mountain",
                    "color": "#C66B4E",
                    "items": alternatives.get("famous_alternatives", [])
                },
                {
                    "choice_id": "hidden_gems",
                    "title": "Show hidden gems",
                    "subtitle": "Less-visited spots that match my interests",
                    "icon": "sparkles",
                    "color": "#B99BCB",
                    "items": alternatives.get("hidden_gems", [])
                },
                {
                    "choice_id": "keep_destination",
                    "title": f"I still want to visit {place_name.split(' (')[0]}",
                    "subtitle": "Keep this destination and show the route",
                    "icon": "check",
                    "color": "#29252B",
                    "items": []
                }
            ]

            return {
                "place_id": row["place_id"],
                "place_name_en": row["place_name_en"],
                "place_name_ja": row["place_name_ja"],
                "crowd_level": crowd_level,
                "numeric_score": row["numeric_score"],
                "source": row["source"],
                "confidence_level": row["confidence_level"],
                "confidence_pct": row["confidence_pct"],
                "data_type": row["data_type"],
                "observed_time_jst": row["observed_time_jst"],
                "last_update_text": row["last_update_text"],
                "wait_time_minutes": row["wait_time_minutes"],
                "photo_url": row["photo_url"],
                "live_status_label": "Estimated",
                "illustrative_note": "Illustrative Example (Not Live)",
                "hana_prompt": hana_prompt,
                "hana_choices": hana_choices,
                "alternatives": alternatives
            }

    @staticmethod
    def get_alternatives_by_type(place_id: str, choice_type: str) -> List[Dict[str, Any]]:
        """Get curated alternative options for a specific choice type."""
        details = CrowdSense3Service.get_crowd_details(place_id)
        alts = details.get("alternatives", {})
        
        mapping = {
            "quieter": "quieter_places",
            "quieter_places": "quieter_places",
            "famous": "famous_alternatives",
            "famous_alternatives": "famous_alternatives",
            "hidden": "hidden_gems",
            "hidden_gems": "hidden_gems"
        }
        key = mapping.get(choice_type, "quieter_places")
        return alts.get(key, [])
