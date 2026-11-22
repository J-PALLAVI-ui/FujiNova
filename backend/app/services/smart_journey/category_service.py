"""
FujiNova 11.0 — 8 Exploration Categories Service & Spatial Location Search.
Handles the 8 distinct categories, manual search across stations/stops/hotels/landmarks,
and GPS location proximity detection for 'Use My Current Location'.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
from backend.app.core.database import get_db_connection


CATEGORIES_METADATA = [
    {
        "category_id": "places_to_visit",
        "title": "Places to Visit",
        "title_ja": "観光名所・絶景",
        "description": "Attractions, iconic viewpoints, ancient shrines, and pristine lakes",
        "icon": "mountain",
        "count": 14,
        "sample_image": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "railway_stations",
        "title": "Railway Stations",
        "title_ja": "富士急行線 駅一覧",
        "description": "Official Fujikyu Railway stations from Otsuki (FJ01) to Kawaguchiko (FJ18)",
        "icon": "train",
        "count": 18,
        "sample_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "bus_stops",
        "title": "Bus Stops & Routes",
        "title_ja": "バス停・路線",
        "description": "Red, Green, Blue sightseeing omnibuses and Mt. Fuji 5th Station shuttles",
        "icon": "bus",
        "count": 28,
        "sample_image": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "hotels_and_stays",
        "title": "Hotels & Stays",
        "title_ja": "ホテル・旅館",
        "description": "Lakeside ryokans, onsen retreats, boutique hotels, and glamping lodges",
        "icon": "bed",
        "count": 22,
        "sample_image": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "food_and_cafes",
        "title": "Food & Cafés",
        "title_ja": "グルメ・カフェ",
        "description": "Authentic Yamanashi Houtou noodles, Yoshida udon, third-wave roasteries",
        "icon": "utensils",
        "count": 35,
        "sample_image": "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "entertainment_activities",
        "title": "Entertainment & Activities",
        "title_ja": "レジャー・温泉",
        "description": "Fuji-Q Highland coasters, scenic ropeways, cruising boats, and mineral onsens",
        "icon": "ticket",
        "count": 16,
        "sample_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "essential_services",
        "title": "Essential Services",
        "title_ja": "便利・安心サービス",
        "description": "Hospitals, 24h ATMs, police koban, coin lockers, and tourist assistance",
        "icon": "shield",
        "count": 19,
        "sample_image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80"
    },
    {
        "category_id": "airports_connections",
        "title": "Airports & Connections",
        "title_ja": "空港・広域アクセス",
        "description": "Direct highway express coaches to Tokyo, Shinjuku, Haneda, and Narita",
        "icon": "plane",
        "count": 6,
        "sample_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
    }
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class CategoryExplorationService:
    """Exploration categories, manual location search, and GPS nearby resolver."""

    @staticmethod
    def get_categories_overview() -> List[Dict[str, Any]]:
        """Return the 8 categories with metadata and current counts."""
        return CATEGORIES_METADATA

    @staticmethod
    def get_items_by_category(category_id: str, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve items belonging to a category, optionally filtered by keyword."""
        with get_db_connection() as conn:
            if query:
                rows = conn.execute("""
                SELECT item_id, category_id, category_name, name_en, name_ja, description_en, description_ja,
                       latitude, longitude, municipality, icon_name, image_url, badge, rating,
                       admission_fee_jpy, opening_hours, crowd_level, accessibility
                FROM category_places_v11
                WHERE category_id = ? AND (
                    UPPER(name_en) LIKE UPPER(?) OR UPPER(name_ja) LIKE UPPER(?) OR UPPER(description_en) LIKE UPPER(?)
                )
                ORDER BY rating DESC
                """, (category_id, f"%{query}%", f"%{query}%", f"%{query}%")).fetchall()
            else:
                rows = conn.execute("""
                SELECT item_id, category_id, category_name, name_en, name_ja, description_en, description_ja,
                       latitude, longitude, municipality, icon_name, image_url, badge, rating,
                       admission_fee_jpy, opening_hours, crowd_level, accessibility
                FROM category_places_v11
                WHERE category_id = ?
                ORDER BY rating DESC
                """, (category_id,)).fetchall()

            return [
                {
                    "item_id": row["item_id"],
                    "category_id": row["category_id"],
                    "category_name": row["category_name"],
                    "name_en": row["name_en"],
                    "name_ja": row["name_ja"],
                    "description_en": row["description_en"],
                    "description_ja": row["description_ja"],
                    "latitude": row["latitude"],
                    "longitude": row["longitude"],
                    "municipality": row["municipality"],
                    "icon_name": row["icon_name"],
                    "image_url": row["image_url"],
                    "badge": row["badge"],
                    "rating": row["rating"],
                    "admission_fee_jpy": row["admission_fee_jpy"],
                    "opening_hours": row["opening_hours"],
                    "crowd_level": row["crowd_level"],
                    "accessibility": row["accessibility"]
                }
                for row in rows
            ]

    @staticmethod
    def search_all_locations(query: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Global manual search across stations, bus stops, landmarks, hotels, and towns.
        Provides auto-complete options for 'Select My Location Manually'.
        """
        results: List[Dict[str, Any]] = []
        term = f"%{query.strip()}%"

        with get_db_connection() as conn:
            # 1. Search Railway Stations
            stations = conn.execute("""
            SELECT station_id, station_code, name_ja, name_en, latitude, longitude, municipality, image_url
            FROM transport_stations
            WHERE UPPER(name_en) LIKE UPPER(?) OR UPPER(name_ja) LIKE UPPER(?) OR UPPER(station_code) LIKE UPPER(?)
            LIMIT 5
            """, (term, term, term)).fetchall()

            for s in stations:
                results.append({
                    "id": s["station_id"],
                    "type": "station",
                    "title": f"{s['name_en']} [{s['station_code']}]",
                    "subtitle": f"{s['name_ja']} · Fujikyu Line ({s['municipality']})",
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "icon": "train",
                    "image_url": s["image_url"]
                })

            # 2. Search Bus Stops
            stops = conn.execute("""
            SELECT stop_id, stop_name_ja, stop_name_en, latitude, longitude, image_url
            FROM transport_bus_stops
            WHERE UPPER(stop_name_en) LIKE UPPER(?) OR UPPER(stop_name_ja) LIKE UPPER(?)
            LIMIT 5
            """, (term, term)).fetchall()

            for bs in stops:
                results.append({
                    "id": bs["stop_id"],
                    "type": "bus_stop",
                    "title": bs["stop_name_en"],
                    "subtitle": f"{bs['stop_name_ja']} · Fujikyu Bus",
                    "latitude": bs["latitude"],
                    "longitude": bs["longitude"],
                    "icon": "bus",
                    "image_url": bs["image_url"]
                })

            # 3. Search Category Places (Hotels, Landmarks, Dining)
            places = conn.execute("""
            SELECT item_id, category_id, name_en, name_ja, municipality, latitude, longitude, image_url, badge
            FROM category_places_v11
            WHERE UPPER(name_en) LIKE UPPER(?) OR UPPER(name_ja) LIKE UPPER(?) OR UPPER(description_en) LIKE UPPER(?)
            LIMIT 10
            """, (term, term, term)).fetchall()

            for p in places:
                results.append({
                    "id": p["item_id"],
                    "type": p["category_id"],
                    "title": p["name_en"],
                    "subtitle": f"{p['name_ja']} ({p['municipality']})",
                    "badge": p["badge"],
                    "latitude": p["latitude"],
                    "longitude": p["longitude"],
                    "icon": "map-pin",
                    "image_url": p["image_url"]
                })

        return results[:limit]

    @staticmethod
    def get_nearby_locations(lat: float, lon: float, radius_km: float = 5.0) -> Dict[str, Any]:
        """
        Detect nearby transport stations, bus stops, and popular places given GPS coordinates.
        Powers the 'Use My Current Location' flow.
        """
        with get_db_connection() as conn:
            # Stations
            stations_rows = conn.execute("""
            SELECT station_id, station_code, name_ja, name_en, latitude, longitude, municipality, image_url
            FROM transport_stations
            """).fetchall()

            nearby_stations = []
            for s in stations_rows:
                dist = haversine_km(lat, lon, s["latitude"], s["longitude"])
                if dist <= radius_km:
                    nearby_stations.append({
                        "station_id": s["station_id"],
                        "station_code": s["station_code"],
                        "name_en": s["name_en"],
                        "name_ja": s["name_ja"],
                        "distance_km": round(dist, 2),
                        "distance_meters": int(dist * 1000),
                        "image_url": s["image_url"]
                    })
            nearby_stations.sort(key=lambda x: x["distance_km"])

            # Category items
            places_rows = conn.execute("""
            SELECT item_id, category_id, name_en, name_ja, latitude, longitude, image_url, badge
            FROM category_places_v11
            """).fetchall()

            nearby_places = []
            for p in places_rows:
                dist = haversine_km(lat, lon, p["latitude"], p["longitude"])
                if dist <= radius_km:
                    nearby_places.append({
                        "item_id": p["item_id"],
                        "name_en": p["name_en"],
                        "name_ja": p["name_ja"],
                        "category_id": p["category_id"],
                        "badge": p["badge"],
                        "distance_km": round(dist, 2),
                        "image_url": p["image_url"]
                    })
            nearby_places.sort(key=lambda x: x["distance_km"])

            closest_station = nearby_stations[0] if nearby_stations else None

            return {
                "user_lat": lat,
                "user_lon": lon,
                "radius_km": radius_km,
                "closest_station": closest_station,
                "nearby_stations": nearby_stations[:5],
                "nearby_places": nearby_places[:8],
                "detected_location_name": closest_station["name_en"] if closest_station else "Mount Fuji Region"
            }
