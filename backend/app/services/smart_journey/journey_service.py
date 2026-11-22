"""
FujiNova 11.0 — Smart Journey Planning & Step-by-Step Navigation Service.
Calculates multi-modal journeys across walking, Fujikyu rail, and bus routes.
Generates turn-by-turn guidance, platform numbers, fares, and map coordinates.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from backend.app.core.database import get_db_connection


class SmartJourneyService:
    """Computes and structures connected itineraries and navigation instructions."""

    @staticmethod
    def get_journey_plan(origin: str, destination: str) -> Dict[str, Any]:
        """
        Retrieve or compute a connected journey plan between origin and destination.
        Matches UI Screen 4: Route map + 4 stat badges + Step-by-step instructions.
        """
        with get_db_connection() as conn:
            # Check for saved plan
            row = conn.execute("""
            SELECT plan_id, origin_name, destination_name, total_time_min, distance_km,
                   train_fare_jpy, bus_fare_jpy, transfers_count, steps_json, route_geojson
            FROM journey_plans_v11
            WHERE (UPPER(origin_name) LIKE UPPER(?) OR UPPER(?) LIKE UPPER(origin_name))
              AND (UPPER(destination_name) LIKE UPPER(?) OR UPPER(?) LIKE UPPER(destination_name))
            LIMIT 1
            """, (f"%{origin}%", f"%{origin}%", f"%{destination}%", f"%{destination}%")).fetchone()

            if not row:
                # Default canonical route: Kawaguchiko to Chureito
                row = conn.execute("""
                SELECT plan_id, origin_name, destination_name, total_time_min, distance_km,
                       train_fare_jpy, bus_fare_jpy, transfers_count, steps_json, route_geojson
                FROM journey_plans_v11
                WHERE plan_id = 'plan_kawa_to_chureito'
                """).fetchone()

            steps = json.loads(row["steps_json"])
            geojson = json.loads(row["route_geojson"])

            return {
                "plan_id": row["plan_id"],
                "origin_name": row["origin_name"],
                "destination_name": row["destination_name"],
                "illustrative_badge": "Illustrative Route (Example Data)",
                "total_time_min": row["total_time_min"],
                "total_time_display": f"{row['total_time_min']} min",
                "distance_km": row["distance_km"],
                "distance_display": f"~{row['distance_km']} km",
                "train_fare_jpy": row["train_fare_jpy"],
                "bus_fare_jpy": row["bus_fare_jpy"],
                "total_fare_display": f"¥{row['train_fare_jpy'] + row['bus_fare_jpy']}",
                "transfers_count": row["transfers_count"],
                "transfers_display": f"{row['transfers_count']} Transfers" if row["transfers_count"] > 0 else "1 Stop (No Transfer)",
                "steps": steps,
                "route_geojson": geojson,
                "landmarks_on_map": [
                    {"name": "Lake Kawaguchiko", "name_ja": "河口湖", "lat": 35.5160, "lon": 138.7560, "type": "lake"},
                    {"name": "Mt. Fuji (3,776 m)", "name_ja": "富士山 (3,776m)", "lat": 35.3606, "lon": 138.7274, "type": "mountain"},
                    {"name": "Kawaguchiko Station", "name_ja": "河口湖駅", "lat": 35.4983, "lon": 138.7692, "type": "origin"},
                    {"name": "Fujisan Station", "name_ja": "富士山駅", "lat": 35.4839, "lon": 138.7958, "type": "station"},
                    {"name": "Chureito Pagoda", "name_ja": "忠霊塔", "lat": 35.5013, "lon": 138.8016, "type": "destination"}
                ]
            }

    @staticmethod
    def calculate_custom_route(
        origin_name: str,
        origin_lat: float,
        origin_lon: float,
        dest_name: str,
        dest_lat: float,
        dest_lon: float
    ) -> Dict[str, Any]:
        """Dynamically build route steps and fare estimates for arbitrary user origin & destination."""
        # Check if destination is near rail or bus
        # Estimate direct distance
        from backend.app.services.smart_journey.category_service import haversine_km
        dist_km = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
        
        # Estimate travel time based on public transit + walking
        transit_time_min = max(10, int(dist_km * 3.5))
        walk_time_min = 8
        total_time_min = transit_time_min + walk_time_min

        # Estimate fare
        fare_jpy = 210 if dist_km <= 5.0 else 380 if dist_km <= 10.0 else 720

        steps = [
            {
                "step_number": 1,
                "title": f"Depart from {origin_name}",
                "mode": "train",
                "duration_min": transit_time_min,
                "distance_m": int(dist_km * 1000 * 0.8),
                "line_name": "Fujikyu Railway / Local Transit",
                "instruction": f"Board local service towards {dest_name}.",
                "details": f"Estimated duration: {transit_time_min} min | Fare: ¥{fare_jpy}",
                "icon": "train",
                "badge": f"{transit_time_min} min"
            },
            {
                "step_number": 2,
                "title": f"Arrive near {dest_name}",
                "mode": "walk",
                "duration_min": walk_time_min,
                "distance_m": 600,
                "line_name": "Pedestrian Path",
                "instruction": f"Walk following localized scenic signs to {dest_name}.",
                "details": "Step-free walkway available along marked tourist path.",
                "icon": "walk",
                "badge": f"{walk_time_min} min (600 m)"
            },
            {
                "step_number": 3,
                "title": f"Arrive at {dest_name}",
                "mode": "arrival",
                "duration_min": 0,
                "distance_m": 0,
                "line_name": "Destination",
                "instruction": f"Welcome to {dest_name}! Check crowd and photo points.",
                "details": "Enjoy your time at the destination.",
                "icon": "flag",
                "badge": "Arrival Point"
            }
        ]

        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [origin_lon, origin_lat],
                            [(origin_lon + dest_lon) / 2, (origin_lat + dest_lat) / 2],
                            [dest_lon, dest_lat]
                        ]
                    },
                    "properties": {
                        "name": f"{origin_name} to {dest_name}",
                        "color": "#C66B4E"
                    }
                }
            ]
        }

        return {
            "plan_id": f"plan_{int(dist_km*100)}",
            "origin_name": origin_name,
            "destination_name": dest_name,
            "illustrative_badge": "Illustrative Route (Example Data)",
            "total_time_min": total_time_min,
            "total_time_display": f"{total_time_min} min",
            "distance_km": round(dist_km, 1),
            "distance_display": f"~{round(dist_km, 1)} km",
            "train_fare_jpy": fare_jpy,
            "bus_fare_jpy": 0,
            "total_fare_display": f"¥{fare_jpy}",
            "transfers_count": 0,
            "transfers_display": "Direct Transit",
            "steps": steps,
            "route_geojson": geojson,
            "landmarks_on_map": [
                {"name": origin_name, "lat": origin_lat, "lon": origin_lon, "type": "origin"},
                {"name": dest_name, "lat": dest_lat, "lon": dest_lon, "type": "destination"}
            ]
        }
