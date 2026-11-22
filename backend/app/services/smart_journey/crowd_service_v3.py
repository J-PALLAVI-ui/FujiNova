"""
FujiNova 11.0 — CrowdSense 3.0 Real-World Crowd Intelligence & Hana Smart Choices.
Provides multi-source crowd status, first-party opt-in crowd reporting,
strict threshold verification (< 3 reports -> Unavailable), and honest historical patterns.
Strictly adheres to $0 budget and honest provenance (never claiming fake live sensors).
"""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from backend.app.core.database import get_db_connection


class CrowdSense3Service:
    """Crowd intelligence engine, opt-in crowd reports, and interactive alternative decision generator."""

    SALT = "fujinova_crowd_salt_2026"

    @classmethod
    def _hash_device(cls, device_id: str) -> str:
        """Hash device ID or IP for privacy-preserving reporting."""
        return hashlib.sha256(f"{cls.SALT}_{device_id}".encode()).hexdigest()[:32]

    @classmethod
    def submit_user_report(
        cls,
        place_id: str,
        crowd_level: str,
        device_id: str,
        consent: bool,
        coarse_area: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a first-party opt-in crowd report with privacy hashing and rate-limiting.
        Rate limit: 1 report per 15 minutes per device per location.
        """
        if not consent:
            raise ValueError("User consent is required to submit anonymous crowd reports.")

        valid_levels = ("Quiet", "Normal", "Busy", "Very Busy")
        if crowd_level not in valid_levels:
            raise ValueError(f"Invalid crowd_level '{crowd_level}'. Must be one of {valid_levels}.")

        device_hash = cls._hash_device(device_id)
        now = datetime.utcnow()
        cutoff_15m = (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            # Check rate limiting in last 15 minutes
            recent = conn.execute("""
            SELECT report_id, created_at FROM crowd_user_reports
            WHERE reporter_device_hash = ? AND place_id = ? AND created_at >= ?
            LIMIT 1
            """, (device_hash, place_id, cutoff_15m)).fetchone()

            if recent:
                return {
                    "success": False,
                    "rate_limited": True,
                    "message": "Only one crowd report per 15 minutes per location is permitted to prevent distortion.",
                    "place_id": place_id
                }

            report_id = f"cr_{uuid.uuid4().hex[:12]}"
            created_at_str = now.strftime("%Y-%m-%d %H:%M:%S")

            conn.execute("""
            INSERT INTO crowd_user_reports (
                report_id, place_id, crowd_level, reporter_device_hash,
                consent_flag, coarse_area, created_at
            ) VALUES (?, ?, ?, ?, 1, ?, ?)
            """, (report_id, place_id, crowd_level, device_hash, coarse_area or "Fuji Five Lakes", created_at_str))
            conn.commit()

        return {
            "success": True,
            "rate_limited": False,
            "report_id": report_id,
            "place_id": place_id,
            "crowd_level": crowd_level,
            "message": "Thank you! Your crowd observation has been recorded and will update live visitor estimates."
        }

    @classmethod
    def get_crowd_place_status(cls, place_id: str) -> Dict[str, Any]:
        """
        Retrieve live community report status for a place.
        Threshold: >= 3 reports in the last 60 minutes required for a live reading.
        Otherwise crowd_level is 'Unavailable' and typical historical pattern is served separately.
        """
        now = datetime.utcnow()
        cutoff_60m = (now - timedelta(minutes=60)).strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            reports = conn.execute("""
            SELECT crowd_level, created_at
            FROM crowd_user_reports
            WHERE place_id = ? AND created_at >= ?
            ORDER BY created_at DESC
            """, (place_id, cutoff_60m)).fetchall()

        count = len(reports)

        # Baseline typical historical pattern (honest provenance, non-live)
        typical_pattern = {
            "provenance": "HISTORICAL_ESTIMATE_ONLY",
            "is_live": False,
            "model_description": "Historical seasonal baseline model calibrated against peak visiting hours and clear weather days.",
            "peak_hours": "10:00 - 14:30 JST",
            "quieter_hours": "Early morning before 09:00 JST or late afternoon after 16:00 JST",
            "baseline_level": "Moderate",
            "hourly_trend": [
                {"hour": "07:00", "level": "Low", "busyness_score": 25},
                {"hour": "09:00", "level": "Moderate", "busyness_score": 55},
                {"hour": "11:00", "level": "High", "busyness_score": 85},
                {"hour": "13:00", "level": "Very High", "busyness_score": 92},
                {"hour": "15:00", "level": "Moderate", "busyness_score": 60},
                {"hour": "17:00", "level": "Low", "busyness_score": 30}
            ]
        }

        if count < 3:
            return {
                "place_id": place_id,
                "live_available": False,
                "crowd_level": "Unavailable",
                "reports_count": count,
                "threshold_required": 3,
                "status_message": f"Crowd data unavailable (insufficient fresh reports: {count}/3 in last 60m)",
                "live_badge": "Unavailable (N < 3)",
                "typical_crowd_pattern": typical_pattern
            }

        # Aggregate >= 3 reports
        score_map = {"Quiet": 1, "Normal": 2, "Busy": 3, "Very Busy": 4}
        scores = [score_map.get(r["crowd_level"], 2) for r in reports]
        avg_score = sum(scores) / len(scores)

        if avg_score < 1.75:
            aggregated_level = "Low"
            numeric_score = 30
        elif avg_score < 2.5:
            aggregated_level = "Moderate"
            numeric_score = 55
        elif avg_score < 3.25:
            aggregated_level = "High"
            numeric_score = 80
        else:
            aggregated_level = "Very High"
            numeric_score = 95

        confidence_pct = min(95, 60 + count * 5)

        return {
            "place_id": place_id,
            "live_available": True,
            "crowd_level": aggregated_level,
            "numeric_score": numeric_score,
            "reports_count": count,
            "threshold_required": 3,
            "confidence_pct": confidence_pct,
            "status_message": f"Live community verified visitor volume based on {count} traveler reports in last 60m",
            "live_badge": f"Live Community Verified ({count} reports)",
            "typical_crowd_pattern": typical_pattern
        }

    @classmethod
    def get_crowd_details(cls, place_id: str) -> Dict[str, Any]:
        """
        Get complete CrowdSense 3.0 status for a destination.
        Returns gauge score, metadata, live report telemetry, and the 4 Hana interactive choices.
        """
        live_status = cls.get_crowd_place_status(place_id)

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
                row = conn.execute("""
                SELECT place_id, place_name_en, place_name_ja, crowd_level, numeric_score,
                       source, confidence_level, confidence_pct, data_type, observed_time_jst,
                       last_update_text, wait_time_minutes, photo_url, alternatives_json
                FROM crowd_observations_v11
                WHERE place_id = 'chureito_pagoda'
                """).fetchone()

            alternatives = json.loads(row["alternatives_json"]) if row["alternatives_json"] else {}
            place_name = row["place_name_en"]

            # If live community reports meet threshold, adopt live reading; otherwise use baseline
            if live_status["live_available"]:
                crowd_level = live_status["crowd_level"]
                numeric_score = live_status["numeric_score"]
                confidence_pct = live_status["confidence_pct"]
                confidence_level = "High" if confidence_pct >= 80 else "Moderate"
                live_status_label = "Live Community Verified"
                illustrative_note = f"Verified by {live_status['reports_count']} traveler reports (last 60m)"
                source_label = "FujiNova First-Party Opt-in Community Reports"
            else:
                crowd_level = row["crowd_level"]
                numeric_score = row["numeric_score"]
                confidence_pct = row["confidence_pct"]
                confidence_level = row["confidence_level"]
                live_status_label = "Estimated"
                illustrative_note = "Illustrative Example (Not Live)"
                source_label = row["source"]

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
                "numeric_score": numeric_score,
                "source": source_label,
                "confidence_level": confidence_level,
                "confidence_pct": confidence_pct,
                "data_type": "Live Reports" if live_status["live_available"] else row["data_type"],
                "observed_time_jst": row["observed_time_jst"],
                "last_update_text": row["last_update_text"],
                "wait_time_minutes": row["wait_time_minutes"],
                "photo_url": row["photo_url"],
                "live_status_label": live_status_label,
                "illustrative_note": illustrative_note,
                "live_reports_status": live_status["status_message"],
                "live_available": live_status["live_available"],
                "reports_count": live_status["reports_count"],
                "typical_crowd_pattern": live_status["typical_crowd_pattern"],
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
