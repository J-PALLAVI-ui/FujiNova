"""
FujiNova 12.0: Interactive Treasure Map Service.
Powers the Mount Fuji Treasure Hunt with hidden gem discovery pins,
completion badges, progress indicators (3/7), and spatial exploration layers.
"""
from __future__ import annotations

from typing import Any, Dict, List


class TreasureMapService:
    """Manages the gamified local discovery spots and traveler achievements."""

    DISCOVERIES = [
        {
            "id": "chureito_pagoda",
            "name": "Chureito Pagoda",
            "tag": "Next Stop",
            "category": "Famous Attraction",
            "latitude": 35.5013,
            "longitude": 138.8016,
            "discovered": True,
            "icon": "pagoda",
            "image_url": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
            "hint": "Iconic five-story pagoda overlooking Mount Fuji and sakura gardens."
        },
        {
            "id": "lake_kawaguchi",
            "name": "Lake Kawaguchi",
            "tag": "Next 15:30",
            "category": "Lakes & Nature",
            "latitude": 35.5167,
            "longitude": 138.7567,
            "discovered": True,
            "icon": "waves",
            "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
            "hint": "Serene shoreline walk with stunning reflection photography."
        },
        {
            "id": "arakurayama_viewpoint",
            "name": "Arakurayama Viewpoint",
            "tag": "Hidden Gem ⭐",
            "category": "Hidden Gem",
            "latitude": 35.5028,
            "longitude": 138.8025,
            "discovered": True,
            "icon": "mountain",
            "image_url": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
            "hint": "Tucked away behind the pagoda along the cedar trail with zero crowds."
        },
        {
            "id": "oishi_park",
            "name": "Oishi Park",
            "tag": "Photo Spot",
            "category": "Photo Location",
            "latitude": 35.5230,
            "longitude": 138.7460,
            "discovered": False,
            "icon": "camera",
            "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
            "hint": "Flower terraces on the northern shore with unobstructed Fuji panoramas."
        },
        {
            "id": "cafe_mignon",
            "name": "Café Mignon (みずカフェ)",
            "tag": "Hidden Café",
            "category": "Cafés & Bakeries",
            "latitude": 35.5112,
            "longitude": 138.7610,
            "discovered": False,
            "icon": "coffee",
            "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
            "hint": "Artisan coffee and matcha chiffon in a peaceful cottage garden."
        },
        {
            "id": "momiji_tunnel",
            "name": "Momiji Secret Tunnel",
            "tag": "Hidden Gem",
            "category": "Hidden Gem",
            "latitude": 35.5310,
            "longitude": 138.7390,
            "discovered": False,
            "icon": "tree",
            "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
            "hint": "Lakeside maple canopies creating a natural picture frame for Mt. Fuji."
        },
        {
            "id": "kawaguchiko_station",
            "name": "Kawaguchiko Station",
            "tag": "You are here",
            "category": "Railway Station",
            "latitude": 35.4983,
            "longitude": 138.7692,
            "discovered": True,
            "icon": "train",
            "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
            "hint": "The vibrant terminus gateway where your Mount Fuji adventure begins."
        }
    ]

    @classmethod
    def get_treasure_map_data(cls) -> Dict[str, Any]:
        """Return all discovery markers, layers, and player stats."""
        discovered_count = sum(1 for d in cls.DISCOVERIES if d["discovered"] and d["id"] != "kawaguchiko_station")
        total_count = len([d for d in cls.DISCOVERIES if d["id"] != "kawaguchiko_station"])

        return {
            "title": "FujiNova Treasure Map Explorer",
            "subtitle": "Discover hidden viewpoints, artisan teahouses, and scenic gems around Mount Fuji",
            "progress": {
                "discovered": discovered_count,
                "total": total_count,
                "text": f"{discovered_count} / {total_count} Discoveries",
                "percentage": int((discovered_count / total_count) * 100)
            },
            "discoveries": cls.DISCOVERIES,
            "layers": [
                {"id": "traffic", "name": "Traffic (Live)", "enabled": True},
                {"id": "transit", "name": "Transit Routes", "enabled": True},
                {"id": "walking", "name": "Walking Route", "enabled": True},
                {"id": "biking", "name": "Bike Route", "enabled": False},
                {"id": "destinations", "name": "Destinations", "enabled": True}
            ]
        }
