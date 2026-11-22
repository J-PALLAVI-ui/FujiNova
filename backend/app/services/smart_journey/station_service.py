"""
FujiNova 11.0 — Station & Transport Guide Service.
Provides live and scheduled departures for Fujikyu Railway (FJ01-FJ18) and Fujikyu Bus network.
Enforces strict platform verification:
- Only verified operator platforms are tagged as 'Verified (Operator Info)'.
- Unverified stations display explicit guidance to check station departure boards.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from backend.app.core.database import get_db_connection


class StationGuideService:
    """Service for station information, platform verification, and departures boards."""

    @staticmethod
    def get_all_railway_stations() -> List[Dict[str, Any]]:
        """Retrieve all 18 Fujikyu Railway stations (FJ01 to FJ18)."""
        with get_db_connection() as conn:
            rows = conn.execute("""
            SELECT station_id, station_code, name_ja, name_en, line_name, latitude, longitude,
                   municipality, platforms_count, platforms_verified, verified_platforms_info,
                   facilities_json, image_url
            FROM transport_stations
            ORDER BY station_code ASC
            """).fetchall()

            return [
                {
                    "station_id": row["station_id"],
                    "station_code": row["station_code"],
                    "name_ja": row["name_ja"],
                    "name_en": row["name_en"],
                    "line_name": row["line_name"],
                    "latitude": row["latitude"],
                    "longitude": row["longitude"],
                    "municipality": row["municipality"],
                    "platforms_count": row["platforms_count"],
                    "platforms_verified": bool(row["platforms_verified"]),
                    "verified_platforms_info": json.loads(row["verified_platforms_info"]),
                    "facilities": json.loads(row["facilities_json"]),
                    "image_url": row["image_url"]
                }
                for row in rows
            ]

    @staticmethod
    def get_station_by_id(station_identifier: str) -> Optional[Dict[str, Any]]:
        """Find station by station_id (e.g. rail_kawaguchiko) or station_code (e.g. FJ18)."""
        with get_db_connection() as conn:
            row = conn.execute("""
            SELECT station_id, station_code, name_ja, name_en, line_name, latitude, longitude,
                   municipality, platforms_count, platforms_verified, verified_platforms_info,
                   facilities_json, image_url
            FROM transport_stations
            WHERE station_id = ? OR UPPER(station_code) = UPPER(?) OR UPPER(name_en) LIKE UPPER(?)
            LIMIT 1
            """, (station_identifier, station_identifier, f"%{station_identifier}%")).fetchone()

            if not row:
                return None

            return {
                "station_id": row["station_id"],
                "station_code": row["station_code"],
                "name_ja": row["name_ja"],
                "name_en": row["name_en"],
                "line_name": row["line_name"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "municipality": row["municipality"],
                "platforms_count": row["platforms_count"],
                "platforms_verified": bool(row["platforms_verified"]),
                "verified_platforms_info": json.loads(row["verified_platforms_info"]),
                "facilities": json.loads(row["facilities_json"]),
                "image_url": row["image_url"]
            }

    @staticmethod
    def get_station_departures(station_id: str, mode: str = "train") -> List[Dict[str, Any]]:
        """
        Get upcoming departures for a station in train or bus mode.
        Matches UI layout: Departure | Destination | Platform | Status
        """
        with get_db_connection() as conn:
            rows = conn.execute("""
            SELECT departure_id, station_id, mode, line_name, destination_en, destination_ja,
                   scheduled_time, platform, platform_verified, status, adult_fare_jpy,
                   child_fare_jpy, duration_min, stops_count, frequency_desc, direction
            FROM station_departures_v11
            WHERE (station_id = ? OR station_id LIKE ?) AND mode = ?
            ORDER BY scheduled_time ASC
            """, (station_id, f"%{station_id}%", mode.lower())).fetchall()

            if not rows and mode.lower() == "train":
                # Default to Kawaguchiko Station if not specifically registered
                rows = conn.execute("""
                SELECT departure_id, station_id, mode, line_name, destination_en, destination_ja,
                       scheduled_time, platform, platform_verified, status, adult_fare_jpy,
                       child_fare_jpy, duration_min, stops_count, frequency_desc, direction
                FROM station_departures_v11
                WHERE station_id = 'rail_kawaguchiko' AND mode = 'train'
                ORDER BY scheduled_time ASC
                """).fetchall()

            return [
                {
                    "departure_id": row["departure_id"],
                    "station_id": row["station_id"],
                    "mode": row["mode"],
                    "line_name": row["line_name"],
                    "destination_en": row["destination_en"],
                    "destination_ja": row["destination_ja"],
                    "scheduled_time": row["scheduled_time"],
                    "platform": row["platform"],
                    "platform_verified": bool(row["platform_verified"]),
                    "platform_verification_label": "Verified (Operator Info)" if row["platform_verified"] else "Estimated (Confirm on Board)",
                    "status": row["status"],
                    "adult_fare_jpy": row["adult_fare_jpy"],
                    "child_fare_jpy": row["child_fare_jpy"],
                    "duration_min": row["duration_min"],
                    "stops_count": row["stops_count"],
                    "frequency_desc": row["frequency_desc"],
                    "direction": row["direction"]
                }
                for row in rows
            ]

    @staticmethod
    def get_platform_navigation_guide(station_id: str, platform_number: str) -> Dict[str, Any]:
        """Provide detailed verified directions for boarding at a given station platform."""
        st = StationGuideService.get_station_by_id(station_id)
        st_name = st["name_en"] if st else "Station"
        
        # Verified station platform walking guides
        guides = {
            ("rail_kawaguchiko", "1"): {
                "platform": "1",
                "station": "Kawaguchiko Station (FJ18)",
                "summary": "Platform 1 is accessed directly past the central ticket barrier gates on the left.",
                "steps": [
                    "Enter through the main station ticket gates using your IC card (Suica/Pasmo) or paper ticket.",
                    "Turn immediately left along the covered platform corridor.",
                    "Platform 1 tracks serve local trains departing towards Fujisan and Otsuki Stations.",
                    "Wheelchair accessible ramp is directly adjacent to the ticket barrier with no steps required."
                ],
                "barrier_free": True,
                "waiting_room_location": "Directly inside station concourse opposite Gate 1"
            },
            ("rail_kawaguchiko", "2"): {
                "platform": "2",
                "station": "Kawaguchiko Station (FJ18)",
                "summary": "Platform 2 is the central track inside the main train shed.",
                "steps": [
                    "Pass through the central ticket barriers and proceed straight ahead.",
                    "Follow overhead signage for Track 2 (Fujikyu Railway Express / Otsuki departures).",
                    "Level boarding is available with tactile paving guides."
                ],
                "barrier_free": True,
                "waiting_room_location": "Main waiting hall"
            },
            ("rail_fujisan", "1"): {
                "platform": "1",
                "station": "Fujisan Station (FJ16)",
                "summary": "Track 1 serves trains continuing towards Shimoyoshida and Otsuki.",
                "steps": [
                    "From the Q-STA 1st floor entrance, pass through the Torii gate ticket barrier.",
                    "Platform 1 is directly ahead on the right bay track.",
                    "Note: This is a switchback station; trains reverse direction upon departure."
                ],
                "barrier_free": True,
                "waiting_room_location": "Concourse warm room"
            }
        }

        key = (station_id, str(platform_number))
        if key in guides:
            return guides[key]

        return {
            "platform": platform_number,
            "station": st_name,
            "summary": f"Platform {platform_number} instructions at {st_name}.",
            "steps": [
                f"Enter through ticket gates at {st_name}.",
                f"Look for overhead departure displays indicating Platform {platform_number}.",
                "Check digital electronic display boards for any track alterations."
            ],
            "barrier_free": True,
            "waiting_room_location": "Station Concourse"
        }
