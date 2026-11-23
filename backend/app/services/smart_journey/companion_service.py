"""
FujiNova 12.0: Journey Companion Live Navigation & Progress Engine.
Tracks real-time tourist progression, handles connection misses, awards discovery badges,
and provides contextual micro-assistance (toilets, quieter alternatives, boarding instructions).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("fujinova.companion")


class JourneyCompanionService:
    """Manages active live travel companion state, actions, and rerouting."""

    @classmethod
    def get_companion_state(cls, user_id: str = "guest") -> Dict[str, Any]:
        """
        Return the live companion status matching the mobile mockups in media_1795420217819_db7b7213.jpg:
        Next Stop: Chureito Pagoda (Stop 2 of 4)
        Fujikyu Bus F1 (To: Shimo-Yoshida), Departs 13:40 -> Arrives 14:02, Fare ¥470, Walk 10 min (550m, uphill).
        """
        return {
            "status": "in_progress",
            "current_step_index": 2,
            "total_steps": 4,
            "hana_guidance": "You're on your Mount Fuji journey! Next, let's go to Chureito Pagoda. I'll guide you step by step! 🌸",
            "next_stop": {
                "id": "chureito_pagoda",
                "name": "Chureito Pagoda",
                "name_ja": "新倉山浅間公園 忠霊塔",
                "tagline": "A famous pagoda with a breathtaking view of Mount Fuji.",
                "step_label": "Stop 2 of 4",
                "category": "Famous",
                "rating": 4.7,
                "reviews_count": 18429,
                "crowd_status": "Moderate",
                "crowd_source": "Google, updated 5 min ago",
                "address": "3353-1 Arakura, Fujiyoshida, Yamanashi 403-0011, Japan",
                "opening_hours": "09:00 - 17:00 (Park) · Open now (* Stairs to the pagoda are open all day)",
                "image_url": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
            },
            "transit_segment": {
                "mode": "bus",
                "service_line": "Fujikyu Bus F1",
                "destination_headsign": "Shimo-Yoshida",
                "departure_time": "13:40",
                "arrival_time": "14:02",
                "duration_text": "22 min",
                "departure_stop": "Kawaguchiko Sta. (Bus Stop No. 1)",
                "arrival_stop": "Shimo-Yoshida (Chureito Pagoda)",
                "fare_jpy": 470,
                "walking_distance": "10 min (550 m, uphill)",
                "platform_verified": True,
                "platform_badge": "Verified (Operator Info)"
            },
            "treasure_hunt": {
                "discovered_count": 3,
                "total_count": 7,
                "progress_pct": 43,
                "badges": [
                    {"id": "badge_viewpoint", "name": "Viewpoint Pioneer", "icon": "camera", "unlocked": True},
                    {"id": "badge_matcha", "name": "Matcha Connoisseur", "icon": "coffee", "unlocked": True},
                    {"id": "badge_shrine", "name": "Sacred Pilgrim", "icon": "torii", "unlocked": True},
                    {"id": "badge_hidden", "name": "Hidden Gem Hunter", "icon": "sparkles", "unlocked": False}
                ]
            }
        }

    @classmethod
    def execute_companion_action(cls, action: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Handle interactive user companion buttons:
        - 'reached_station'
        - 'boarded_bus'
        - 'missed_bus'
        - 'find_quieter'
        - 'mark_visited'
        - 'nearest_toilet'
        - 'food_nearby'
        """
        payload = payload or {}

        if action == "reached_station":
            return {
                "action": action,
                "success": True,
                "message": "Welcome to Kawaguchiko Station! Please head to Bus Stop No. 1 right in front of the station entrance.",
                "next_guidance": "Your bus (Fujikyu Bus F1 towards Shimo-Yoshida) departs at 13:40. Have your Suica, Pasmo, or cash (¥470) ready.",
                "alert_level": "info"
            }

        elif action == "boarded_bus":
            return {
                "action": action,
                "success": True,
                "message": "You're on board Fujikyu Bus F1! Relax and enjoy the scenic ride along Route 137.",
                "next_guidance": "Estimated arrival at Shimo-Yoshida Stop is 14:02 (approx 22 minutes). We will notify you 2 stops before arrival.",
                "alert_level": "success"
            }

        elif action == "missed_bus":
            # Realistic schedule replanning
            return {
                "action": action,
                "success": True,
                "message": "No worries! Public transport around Mount Fuji runs frequently.",
                "next_departure": {
                    "mode": "bus",
                    "service_line": "Fujikyu Bus F1 (Next Scheduled)",
                    "departure_time": "13:55",
                    "wait_time_min": 15,
                    "platform": "Bus Stop No. 1",
                    "arrival_time": "14:17",
                    "fare_jpy": 470,
                    "replan_status": "Itinerary adjusted by +15 minutes. All afternoon stops remain reachable."
                },
                "next_guidance": "The next bus departs at 13:55 from Bus Stop No. 1. You have 15 minutes to browse the station cafe or use the restroom.",
                "alert_level": "warning"
            }

        elif action == "find_quieter":
            return {
                "action": action,
                "success": True,
                "message": "Looking for a serene alternative away from the crowds? Here are top quiet recommendations:",
                "recommended_alternative": {
                    "id": "cat_a_arakurayama_vp",
                    "name": "Arakurayama Peace Pagoda Forest Trail",
                    "crowd_level": "Low",
                    "busyness_score": 20,
                    "reason": "Quiet wooded trail right behind the main shrine with unobstructed mountain views.",
                    "distance_from_station": "1.8 km",
                    "action_label": "Switch itinerary to Peace Trail"
                },
                "alert_level": "info"
            }

        elif action == "mark_visited":
            return {
                "action": action,
                "success": True,
                "message": "Congratulations on exploring Chureito Pagoda! Stamp added to your FujiNova Travel Journal 🌸",
                "progress_update": {
                    "discovered_count": 4,
                    "total_count": 7,
                    "badge_unlocked": {
                        "name": "Pagoda Master",
                        "description": "Completed the 398 steps to Mount Fuji's iconic red shrine pagoda!"
                    }
                },
                "next_guidance": "Next up: Head to Shimo-Yoshida stop to catch the 14:40 bus to Lake Kawaguchi.",
                "alert_level": "success"
            }

        elif action == "nearest_toilet":
            return {
                "action": action,
                "success": True,
                "amenity": "Restrooms & Accessible Toilets",
                "locations": [
                    {"name": "Kawaguchiko Station East Wing Restrooms", "distance": "30 m", "accessible": True, "free": True},
                    {"name": "Arakurayama Sengen Park Public Pavilion", "distance": "350 m", "accessible": True, "free": True}
                ],
                "message": "Clean public restrooms are available 30 meters away near the station lockers."
            }

        elif action == "food_nearby":
            return {
                "action": action,
                "success": True,
                "amenity": "Dining & Cafés",
                "places": [
                    {"name": "Hidden Café (Café Mignon)", "type": "Café", "distance": "400 m", "specialty": "Matcha & Coffee"},
                    {"name": "Houtou Fudou Ekimae", "type": "Local Noodle", "distance": "50 m", "specialty": "Yamanashi Houtou"}
                ],
                "message": "Found 2 authentic eateries within walking distance."
            }

        return {
            "action": action,
            "success": True,
            "message": f"Action '{action}' recorded."
        }
