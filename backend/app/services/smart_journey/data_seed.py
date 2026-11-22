"""
FujiNova 11.0 — Smart Journey & Station Guide Seed Data & Schema Definitions.
Classifications:
- Railway Stations: 18 Stations along Fujikyu Railway (FJ01-FJ18) with verified platform numbers.
- Bus Stops: Key Fujikyu Bus stops (Red, Green, Blue, Fujisan shuttle).
- 8 Categories: Places to Visit, Railway Stations, Bus Stops, Hotels, Food & Cafes,
                Entertainment, Essential Services, Airports & Connections.
- CrowdSense 3.0: High-fidelity crowd observations with multi-source metadata & Hana choices.
- Departures: Scheduled & verified departures for rail and bus with verified operator platform info.
"""
from __future__ import annotations

import json
import sqlite3
from typing import Dict, List, Any


def init_fujinova11_schema(cursor: sqlite3.Cursor) -> None:
    """Initialize SQLite tables for FujiNova 11.0 Smart Journey & Station Guide."""
    
    # 1. Transport Stations (Fujikyu Railway FJ01 - FJ18)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transport_stations (
        station_id TEXT PRIMARY KEY,
        station_code TEXT NOT NULL UNIQUE,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        line_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        municipality TEXT NOT NULL,
        platforms_count INTEGER NOT NULL,
        platforms_verified INTEGER NOT NULL DEFAULT 1,
        verified_platforms_info TEXT NOT NULL,
        facilities_json TEXT DEFAULT '[]',
        image_url TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stations_code ON transport_stations (station_code);")

    # 2. Transport Bus Stops (Fujikyu Bus Lines)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transport_bus_stops (
        stop_id TEXT PRIMARY KEY,
        stop_name_ja TEXT NOT NULL,
        stop_name_en TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        routes_json TEXT NOT NULL,
        has_shelter INTEGER DEFAULT 1,
        has_timetable INTEGER DEFAULT 1,
        image_url TEXT NOT NULL
    );
    """)

    # 3. Station Departures (Train & Bus departures board)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS station_departures_v11 (
        departure_id TEXT PRIMARY KEY,
        station_id TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('train', 'bus')),
        line_name TEXT NOT NULL,
        destination_en TEXT NOT NULL,
        destination_ja TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        platform TEXT NOT NULL,
        platform_verified INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL,
        adult_fare_jpy INTEGER NOT NULL,
        child_fare_jpy INTEGER NOT NULL,
        duration_min INTEGER NOT NULL,
        stops_count INTEGER NOT NULL,
        frequency_desc TEXT NOT NULL,
        direction TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_departures_station ON station_departures_v11 (station_id, mode);")

    # 4. CrowdSense 3.0 Observations & Hana Alternative Recommendations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crowd_observations_v11 (
        place_id TEXT PRIMARY KEY,
        place_name_en TEXT NOT NULL,
        place_name_ja TEXT NOT NULL,
        crowd_level TEXT NOT NULL CHECK(crowd_level IN ('Very Low', 'Low', 'Moderate', 'High', 'Very High', 'Unavailable')),
        numeric_score INTEGER NOT NULL,
        source TEXT NOT NULL,
        confidence_level TEXT NOT NULL,
        confidence_pct INTEGER NOT NULL,
        data_type TEXT NOT NULL,
        observed_time_jst TEXT NOT NULL,
        last_update_text TEXT NOT NULL,
        wait_time_minutes INTEGER DEFAULT 0,
        photo_url TEXT NOT NULL,
        alternatives_json TEXT NOT NULL
    );
    """)

    # 5. The 8 Distinct Exploration Categories (Part 2)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS category_places_v11 (
        item_id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        category_name TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_ja TEXT NOT NULL,
        description_en TEXT NOT NULL,
        description_ja TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        municipality TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        badge TEXT,
        rating REAL DEFAULT 4.5,
        admission_fee_jpy INTEGER DEFAULT 0,
        opening_hours TEXT,
        crowd_level TEXT DEFAULT 'Moderate',
        accessibility TEXT DEFAULT 'Verified Accessible'
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cat_places ON category_places_v11 (category_id);")

    # 6. Journey Plans (Step-by-step route directions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journey_plans_v11 (
        plan_id TEXT PRIMARY KEY,
        origin_name TEXT NOT NULL,
        destination_name TEXT NOT NULL,
        total_time_min INTEGER NOT NULL,
        distance_km REAL NOT NULL,
        train_fare_jpy INTEGER NOT NULL,
        bus_fare_jpy INTEGER NOT NULL,
        transfers_count INTEGER NOT NULL,
        steps_json TEXT NOT NULL,
        route_geojson TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)


def seed_fujinova11_data(cursor: sqlite3.Cursor) -> None:
    """Seed comprehensive FujiNova 11.0 reference and operational data."""
    init_fujinova11_schema(cursor)

    # 1. Seed 18 Fujikyu Railway Stations (FJ01 to FJ18)
    stations_data = [
        (
            "rail_otsuki", "FJ01", "大月駅", "Otsuki Station", "Fujikyu Railway Line",
            35.6133, 138.9428, "Otsuki", 3, 1,
            json.dumps({"verified_platforms": ["1", "2", "3"], "transfer": "JR Chuo Main Line (Limited Express Kaiji / Azusa)"}),
            json.dumps(["Elevator", "Restrooms", "Coin Lockers", "Ticket Office", "Convenience Store", "Multilingual Assistance"]),
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_kamiotsuki", "FJ02", "上大月駅", "Kami-Otsuki Station", "Fujikyu Railway Line",
            35.6074, 138.9376, "Otsuki", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "None (Single Track)"}),
            json.dumps(["Waiting Bench", "IC Card Touchpoint"]),
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_tanokura", "FJ03", "田野倉駅", "Tanokura Station", "Fujikyu Railway Line",
            35.5847, 138.9272, "Tsuru", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "None"}),
            json.dumps(["Waiting Room", "Restroom", "IC Card Touchpoint"]),
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_kasei", "FJ04", "禾生駅", "Kasei Station", "Fujikyu Railway Line",
            35.5681, 138.9247, "Tsuru", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "None"}),
            json.dumps(["Waiting Room", "Bicycle Parking"]),
            "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_akasaka", "FJ05", "赤坂駅", "Akasaka Station", "Fujikyu Railway Line",
            35.5583, 138.9167, "Tsuru", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "None"}),
            json.dumps(["Sheltered Bench", "Bicycle Racks"]),
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_tsurushi", "FJ06", "都留市駅", "Tsurushi Station", "Fujikyu Railway Line",
            35.5539, 138.9092, "Tsuru", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "Local Bus Connections"}),
            json.dumps(["Ticket Machine", "Waiting Room", "Accessible Restroom"]),
            "https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_yamuramachi", "FJ07", "谷村町駅", "Yamuramachi Station", "Fujikyu Railway Line",
            35.5492, 138.9039, "Tsuru", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "City Hall Access"}),
            json.dumps(["Station Building", "IC Card Readers", "Restrooms"]),
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_tsurubunkadaigakumae", "FJ08", "都留文科大学前駅", "Tsurubunkadaigakumae Station", "Fujikyu Railway Line",
            35.5431, 138.8986, "Tsuru", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "Tsuru University Campus"}),
            json.dumps(["Staffed Ticket Counter", "Waiting Area", "Wheelchair Ramp", "Convenience Kiosk"]),
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_tokaichiba", "FJ09", "十日市場駅", "Tokaichiba Station", "Fujikyu Railway Line",
            35.5342, 138.8906, "Tsuru", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "None"}),
            json.dumps(["Waiting Shelter", "Bicycle Parking"]),
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_higashikatsura", "FJ10", "東桂駅", "Higashikatsura Station", "Fujikyu Railway Line",
            35.5261, 138.8789, "Tsuru", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "None"}),
            json.dumps(["Waiting Room", "Restroom", "Drink Vending Machine"]),
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_mitsutoge", "FJ11", "三つ峠駅", "Mitsutoge Station", "Fujikyu Railway Line",
            35.5186, 138.8464, "Nishikatsura", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "Mitsutoge Trailhead Shuttles"}),
            json.dumps(["Hiker Rest Area", "Lockers", "Trail Maps", "Restrooms"]),
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_kotobuki", "FJ12", "寿駅", "Kotobuki Station", "Fujikyu Railway Line",
            35.5089, 138.8258, "Fujiyoshida", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "None"}),
            json.dumps(["Lucky Commemorative Ticket Board", "Shelter"]),
            "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_yoshiikeonsenmae", "FJ13", "葭池温泉前駅", "Yoshiikeonsenmae Station", "Fujikyu Railway Line",
            35.5031, 138.8142, "Fujiyoshida", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "Yoshiike Onsen Bathhouse Walk"}),
            json.dumps(["Shelter", "IC Card Gate"]),
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_shimoyoshida", "FJ14", "下吉田駅", "Shimoyoshida Station (Chureito Gateway)", "Fujikyu Railway Line",
            35.4981, 138.8056, "Fujiyoshida", 2, 1,
            json.dumps({"verified_platforms": ["1", "2"], "transfer": "Chureito Pagoda Shuttle & Walking Route"}),
            json.dumps(["Shimoyoshida Club Cafe", "Historic Train Yard Museum", "Coin Lockers", "Baggage Storage", "Wheelchair Slope"]),
            "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_gekkoji", "FJ15", "月江寺駅", "Gekkoji Station", "Fujikyu Railway Line",
            35.4922, 138.8017, "Fujiyoshida", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "Historic Nishiura District"}),
            json.dumps(["Retro Station Building", "Restrooms", "Bicycle Parking"]),
            "https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_fujisan", "FJ16", "富士山駅", "Fujisan Station (Mt. Fuji Station)", "Fujikyu Railway Line",
            35.4839, 138.7958, "Fujiyoshida", 3, 1,
            json.dumps({"verified_platforms": ["1", "2", "3"], "transfer": "Switchback Station; Gateway to Mt. Fuji 5th Station Shuttles"}),
            json.dumps(["Q-STA Department Store", "Rooftop Mt. Fuji Observation Deck", "Tourist Information", "Coin Lockers", "Accessible Elevators", "Torii Gate Entrance"]),
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_fujikyu_highland", "FJ17", "富士急ハイランド駅", "Fujikyu-Highland Station", "Fujikyu Railway Line",
            35.4878, 138.7797, "Fujiyoshida", 1, 1,
            json.dumps({"verified_platforms": ["1"], "transfer": "Fuji-Q Highland 2nd Gate Entrance"}),
            json.dumps(["Direct Park Entrance", "Luggage Storage", "Theme Park Ticket Counters", "Accessible Ramp"]),
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
        ),
        (
            "rail_kawaguchiko", "FJ18", "河口湖駅", "Kawaguchiko Station", "Fujikyu Railway Line",
            35.4983, 138.7692, "Fujikawaguchiko", 3, 1,
            json.dumps({"verified_platforms": ["1", "2", "3"], "transfer": "Terminus Station; Central Bus Terminal for Fuji Five Lakes"}),
            json.dumps(["Fujikyu Concierge Desk", "Large Baggage Lockers", "Foreign Currency Exchange", "Bus Ticket Center", "Gateway Souvenir Cafe", "Full Wheelchair Accessibility"]),
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"
        ),
    ]

    for st in stations_data:
        cursor.execute("""
        INSERT OR REPLACE INTO transport_stations (
            station_id, station_code, name_ja, name_en, line_name, latitude, longitude,
            municipality, platforms_count, platforms_verified, verified_platforms_info,
            facilities_json, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, st)

    # 2. Seed Major Bus Stops
    bus_stops_data = [
        ("bus_kawaguchiko_term", "河口湖駅バス乗り場", "Kawaguchiko Station Bus Terminal", 35.4983, 138.7692,
         json.dumps(["Red Line (Omnibus)", "Green Line (Saiko)", "Blue Line (Shojiko/Motosuko)", "Fujisan 5th Station Shuttle", "Tokyo/Shinjuku Express"]),
         1, 1, "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80"),
        ("bus_chureito_iriguchi", "忠霊塔入口", "Chureito Pagoda Bus Stop", 35.4985, 138.8048,
         json.dumps(["Fuji Five Lakes Loop Bus", "Fujiyoshida City Route"]),
         1, 1, "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"),
        ("bus_oishi_park", "大石公園・自然生活館", "Oishi Park / Kawaguchiko Natural Living Center", 35.5230, 138.7460,
         json.dumps(["Red Line (Omnibus) Terminus"]),
         1, 1, "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80"),
        ("bus_saiko_iyashinosato", "西湖いやしの里根場", "Saiko Iyashi-no-Sato Nenba", 35.5036, 138.6575,
         json.dumps(["Green Line (Saiko Omnibus)"]),
         1, 1, "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80"),
        ("bus_fuji_5th_station", "富士山五合目", "Mt. Fuji 5th Station (Yoshida Trail)", 35.3683, 138.7328,
         json.dumps(["Subaru Line Climbing Shuttle"]),
         1, 1, "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80"),
        ("bus_oshino_hakkai", "忍野八海", "Oshino Hakkai Bus Stop", 35.4608, 138.8329,
         json.dumps(["Fuji Five Lakes Heritage Route", "Gotemba Route"]),
         1, 1, "https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=800&auto=format&fit=crop&q=80"),
    ]
    for bs in bus_stops_data:
        cursor.execute("""
        INSERT OR REPLACE INTO transport_bus_stops (
            stop_id, stop_name_ja, stop_name_en, latitude, longitude, routes_json, has_shelter, has_timetable, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, bs)

    # 3. Seed Station Departures (matching user screenshot for Kawaguchiko FJ18)
    departures_data = [
        # Kawaguchiko Trains
        ("dep_kawa_train_1428", "rail_kawaguchiko", "train", "Fujikyu Line", "Fujisan Station", "富士山駅", "14:28", "1", 1, "On Time", 210, 110, 3, 1, "~30 min", "Inbound to Fujisan / Otsuki"),
        ("dep_kawa_train_1458", "rail_kawaguchiko", "train", "Fujikyu Line", "Otsuki", "大月駅", "14:58", "2", 1, "On Time", 1170, 590, 48, 17, "~30 min", "Inbound to Otsuki"),
        ("dep_kawa_train_1528", "rail_kawaguchiko", "train", "Fujikyu Line", "Fujisan Station", "富士山駅", "15:28", "1", 1, "On Time", 210, 110, 3, 1, "~30 min", "Inbound to Fujisan / Otsuki"),
        ("dep_kawa_train_1558", "rail_kawaguchiko", "train", "Fuji Excursion (JR Ltd Exp)", "Shinjuku Direct", "新宿直通", "15:58", "3", 1, "On Time", 1770, 890, 42, 4, "Limited Express", "Inbound to Shinjuku"),
        
        # Kawaguchiko Buses
        ("dep_kawa_bus_1435", "rail_kawaguchiko", "bus", "Red Line Sightseeing Omnibus", "Oishi Park via Lakefront", "大石公園（河口湖北岸経由）", "14:35", "Stop 1", 1, "On Time", 490, 250, 26, 12, "Every 15 min", "Lake Kawaguchiko North Shore"),
        ("dep_kawa_bus_1450", "rail_kawaguchiko", "bus", "Green Line Saiko Omnibus", "Saiko Iyashi-no-Sato", "西湖いやしの里根場", "14:50", "Stop 2", 1, "On Time", 720, 360, 35, 18, "Every 30 min", "Lake Saiko Heritage Circuit"),
        ("dep_kawa_bus_1510", "rail_kawaguchiko", "bus", "Blue Line Heritage Omnibus", "Lake Motosuko (1000-Yen View)", "本栖湖観光案内所", "15:10", "Stop 3", 1, "On Time", 1050, 530, 45, 22, "Every 60 min", "Western Fuji Lakes"),
        ("dep_kawa_bus_1530", "rail_kawaguchiko", "bus", "Subaru Line Climbing Bus", "Mt. Fuji 5th Station (Yoshida)", "富士山五合目", "15:30", "Stop 7", 1, "On Time", 1570, 790, 50, 6, "Hourly Shuttle", "Subaru Line Toll Highway"),

        # Fujisan Station Departures
        ("dep_fuji_train_1435", "rail_fujisan", "train", "Fujikyu Line", "Shimoyoshida / Otsuki", "下吉田・大月方面", "14:35", "1", 1, "On Time", 310, 160, 8, 2, "~30 min", "Inbound to Otsuki"),
        ("dep_fuji_train_1442", "rail_fujisan", "train", "Fujikyu Line", "Kawaguchiko", "河口湖方面", "14:42", "2", 1, "On Time", 210, 110, 3, 1, "~30 min", "Outbound to Kawaguchiko"),
        ("dep_fuji_train_1505", "rail_fujisan", "train", "Fujikyu Line", "Shimoyoshida / Otsuki", "下吉田・大月方面", "15:05", "1", 1, "On Time", 310, 160, 8, 2, "~30 min", "Inbound to Otsuki"),
    ]

    for dep in departures_data:
        cursor.execute("""
        INSERT OR REPLACE INTO station_departures_v11 (
            departure_id, station_id, mode, line_name, destination_en, destination_ja,
            scheduled_time, platform, platform_verified, status, adult_fare_jpy,
            child_fare_jpy, duration_min, stops_count, frequency_desc, direction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, dep)

    # 4. Seed CrowdSense 3.0 Observations (specifically Chureito Pagoda matching user image)
    crowd_data = [
        (
            "chureito_pagoda", "Chureito Pagoda (Arakurayama Sengen Park)", "新倉山浅間公園 忠霊塔",
            "High", 78, "CrowdSense (Multi-Source)", "High (78%)", 78,
            "Estimated (based on busyness, trends & sensors)", "Today, 2:10 PM (JST)", "5 minutes ago", 35,
            "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
            json.dumps({
                "quieter_places": [
                    {"id": "arakura_peace_trail", "name_en": "Arakurayama Peace Pagoda Forest Trail", "name_ja": "新倉山平和観音遊歩道", "crowd_level": "Very Low", "score": 20, "reason": "Quiet wooded trail right behind the main shrine with unobstructed mountain views."},
                    {"id": "saiko_iyashinosato", "name_en": "Lake Saiko Iyashi-no-Sato Nenba", "name_ja": "西湖いやしの里根場", "crowd_level": "Low", "score": 28, "reason": "Thatched-roof artisan village with relaxed walking paths and direct Fuji vistas."}
                ],
                "famous_alternatives": [
                    {"id": "oishi_park", "name_en": "Oishi Park (Kawaguchiko North Shore)", "name_ja": "大石公園", "crowd_level": "Moderate", "score": 52, "reason": "Iconic flower terrace overlooking Lake Kawaguchiko and Mt. Fuji with lower wait times."},
                    {"id": "kitaguchi_sengen", "name_en": "Kitaguchi Hongu Fuji Sengen Shrine", "name_ja": "北口本宮冨士浅間神社", "crowd_level": "Moderate", "score": 45, "reason": "Ancient cedar sanctuary with towering moss-covered lanterns and sacred Fuji history."}
                ],
                "hidden_gems": [
                    {"id": "narusawa_ice_cave", "name_en": "Narusawa Ice Cave", "name_ja": "鳴沢氷穴", "crowd_level": "Low", "score": 30, "reason": "Natural subterranean lava tube encased in year-round ice stalagmites in the deep forest."},
                    {"id": "kaneyamaen_gardens", "name_en": "Kaneyamaen Japanese Stroll Garden", "name_ja": "鐘山苑 日本庭園", "crowd_level": "Very Low", "score": 18, "reason": "20,000-tsubo authentic Japanese garden featuring tea pavilion and clear mountain streams."}
                ]
            })
        ),
        (
            "oishi_park", "Oishi Park (Kawaguchiko)", "大石公園",
            "Moderate", 55, "CrowdSense (Multi-Source)", "High (82%)", 82,
            "Estimated (based on busyness, trends & sensors)", "Today, 2:10 PM (JST)", "12 minutes ago", 10,
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
            json.dumps({"quieter_places": [], "famous_alternatives": [], "hidden_gems": []})
        ),
        (
            "oshino_hakkai", "Oshino Hakkai (Sacred Ponds)", "忍野八海",
            "High", 84, "CrowdSense (Multi-Source)", "High (80%)", 80,
            "Estimated (based on busyness, trends & sensors)", "Today, 2:10 PM (JST)", "8 minutes ago", 45,
            "https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=800&auto=format&fit=crop&q=80",
            json.dumps({"quieter_places": [], "famous_alternatives": [], "hidden_gems": []})
        ),
        (
            "fuji_5th_station", "Mt. Fuji 5th Station (Yoshida)", "富士山五合目",
            "High", 76, "CrowdSense (Multi-Source)", "Moderate (70%)", 70,
            "Estimated (based on busyness, trends & sensors)", "Today, 2:05 PM (JST)", "15 minutes ago", 30,
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80",
            json.dumps({"quieter_places": [], "famous_alternatives": [], "hidden_gems": []})
        ),
    ]

    for cd in crowd_data:
        cursor.execute("""
        INSERT OR REPLACE INTO crowd_observations_v11 (
            place_id, place_name_en, place_name_ja, crowd_level, numeric_score, source,
            confidence_level, confidence_pct, data_type, observed_time_jst,
            last_update_text, wait_time_minutes, photo_url, alternatives_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, cd)

    # 5. Seed Category Places across all 8 Categories (A through H)
    category_items = [
        # Category A: Places to Visit
        ("cat_a_chureito", "places_to_visit", "Places to Visit", "Chureito Pagoda (Arakurayama Sengen Park)", "新倉山浅間公園 忠霊塔",
         "The worldwide iconic five-storied red pagoda overlooking Mount Fuji surrounded by 650 cherry blossom trees.", "富士山と五重塔、桜が織りなす日本屈指の絶景スポット。",
         35.5013, 138.8016, "Fujiyoshida", "Landmark", "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
         "Iconic Viewpoint", 4.9, 0, "24 Hours (Park open always)", "High", "398 Steps or Sloped Path"),
        ("cat_a_oishi", "places_to_visit", "Places to Visit", "Oishi Park", "大石公園",
         "Lakeside flower promenade famed for lavender in summer and kochia in autumn directly in front of Mount Fuji.", "河口湖北岸のラベンダーやコキアが美しい湖畔公園。",
         35.5230, 138.7460, "Fujikawaguchiko", "Sparkles", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "Seasonal Blooms", 4.8, 0, "9:00 AM – 5:00 PM", "Moderate", "Wheelchair Accessible Paths"),
        ("cat_a_oshino", "places_to_visit", "Places to Visit", "Oshino Hakkai", "忍野八海",
         "Eight crystalline spring water ponds fed by filtered snowmelt from Mount Fuji, certified World Cultural Heritage.", "富士山の雪解け水が湧き出る天然の八つの湧水池。",
         35.4608, 138.8329, "Oshino", "Droplet", "https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=800&auto=format&fit=crop&q=80",
         "World Heritage", 4.7, 300, "9:00 AM – 5:00 PM", "High", "Partially Cobblestoned"),
        ("cat_a_saiko", "places_to_visit", "Places to Visit", "Lake Saiko Iyashi-no-Sato Nenba", "西湖いやしの里根場",
         "Reconstructed traditional thatched-roof farming village featuring folk handicrafts, pottery, and Mt. Fuji backdrop.", "富士山を望む美しい茅葺き屋根の伝統集落。",
         35.5036, 138.6575, "Fujikawaguchiko", "Home", "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
         "Peaceful Heritage", 4.6, 500, "9:00 AM – 4:30 PM", "Low", "Paved Walkways"),

        # Category B: Railway Stations
        ("cat_b_kawaguchiko", "railway_stations", "Railway Stations", "Kawaguchiko Station [FJ18]", "河口湖駅",
         "Terminus station for the Fujikyu Railway and premier multi-modal gateway for the Fuji Five Lakes.", "富士五湖観光の拠点となる富士急行線の終着駅。",
         35.4983, 138.7692, "Fujikawaguchiko", "Train", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "Major Hub (FJ18)", 4.8, 0, "5:30 AM – 11:30 PM", "High", "Full Step-Free Access"),
        ("cat_b_fujisan", "railway_stations", "Railway Stations", "Fujisan Station [FJ16]", "富士山駅",
         "Historic switchback station with panoramic rooftop observation deck and direct access to Mt. Fuji climbing shuttles.", "屋上展望デッキから雄大な富士山が望めるスイッチバック駅。",
         35.4839, 138.7958, "Fujiyoshida", "Train", "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80",
         "Switchback (FJ16)", 4.7, 0, "5:30 AM – 11:30 PM", "Moderate", "Step-Free Elevator"),
        ("cat_b_shimoyoshida", "railway_stations", "Railway Stations", "Shimoyoshida Station [FJ14]", "下吉田駅",
         "Retro-styled wooden station serving as the gateway to Chureito Pagoda with cafe and heritage rail garden.", "新倉山浅間公園（忠霊塔）への最寄り駅。レトロな駅舎が人気。",
         35.4981, 138.8056, "Fujiyoshida", "Train", "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
         "Chureito Gateway (FJ14)", 4.7, 0, "6:00 AM – 10:30 PM", "Moderate", "Ramp Access"),
        ("cat_b_otsuki", "railway_stations", "Railway Stations", "Otsuki Station [FJ01]", "大月駅",
         "Interchange station connecting JR Chuo Line Limited Express trains from Tokyo to the Fujikyu Line.", "JR中央線特急と富士急行線の乗換拠点駅。",
         35.6133, 138.9428, "Otsuki", "Train", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
         "JR Transfer (FJ01)", 4.6, 0, "5:00 AM – Midnight", "High", "Accessible Elevators"),

        # Category C: Bus Stops & Routes
        ("cat_c_kawaguchiko_term", "bus_stops", "Bus Stops & Routes", "Kawaguchiko Station Bus Terminal", "河口湖駅バスターミナル",
         "Seven dedicated bus platforms servicing Red/Green/Blue sightseeing lines and Tokyo express coaches.", "河口湖・西湖周遊バスや東京方面高速バスの総合バスターミナル。",
         35.4983, 138.7692, "Fujikawaguchiko", "Bus", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
         "7 Covered Platforms", 4.7, 0, "6:00 AM – 10:00 PM", "High", "Flat Pavement & Tactile Tiles"),
        ("cat_c_chureito_stop", "bus_stops", "Bus Stops & Routes", "Chureito Pagoda Bus Stop", "忠霊塔入口バス停",
         "Local loop bus stop situated on Route 139 directly at the foot of Arakurayama Sengen Park.", "新倉山浅間公園入口にある周遊バス停留所。",
         35.4985, 138.8048, "Fujiyoshida", "Bus", "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
         "Route 139", 4.4, 0, "7:00 AM – 7:00 PM", "Moderate", "Curbside Access"),

        # Category D: Hotels & Stays
        ("cat_d_hoshinoya", "hotels_and_stays", "Hotels & Stays", "Hoshinoya Fuji", "星のや富士",
         "Japan's premier luxury glamping resort nestled in red pine forest terraces overlooking Lake Kawaguchiko.", "河口湖を見下ろす丘陵に佇む日本初の本格的ラグジュアリーリゾート。",
         35.5189, 138.7512, "Fujikawaguchiko", "Bed", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
         "Luxury Glamping", 4.9, 45000, "Check-in 3:00 PM", "Low", "Terrace Shuttle Carts"),
        ("cat_d_ubuya", "hotels_and_stays", "Hotels & Stays", "Ubuya Ryokan", "うぶや",
         "High-end traditional onsen ryokan where every guest room and open-air bath directly faces Mount Fuji.", "全ての客室と露天風呂から富士山と河口湖が眺められる高級老舗旅館。",
         35.5097, 138.7758, "Fujikawaguchiko", "Bed", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "Onsen Ryokan", 4.9, 38000, "Check-in 3:00 PM", "Low", "Elevator & Barrier-Free Rooms"),
        ("cat_d_kaneyamaen", "hotels_and_stays", "Hotels & Stays", "Hotel Kaneyamaen", "ホテル鐘山苑",
         "Renowned hot spring resort famed for 3-tier open-air rooftop baths and a celebrated traditional Japanese garden.", "富士山を一望する露天風呂と広大な日本庭園が誇りの名門温泉宿。",
         35.4745, 138.8182, "Fujiyoshida", "Bed", "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80",
         "Rooftop Onsen", 4.8, 29000, "Check-in 3:00 PM", "Moderate", "Accessible Facilities"),

        # Category E: Food & Cafés
        ("cat_e_hoto_fudo", "food_and_cafes", "Food & Cafés", "Hoto Fudo Kawaguchiko Ekimae", "ほうとう不動 河口湖駅前店",
         "Signature Yamanashi flat noodles in rich iron-pot miso broth loaded with pumpkin and forest vegetables.", "山梨名物の極太手打ち麺を特製味噌と南瓜で煮込んだ絶品ほうとう。",
         35.4979, 138.7686, "Fujikawaguchiko", "Utensils", "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80",
         "Local Specialty", 4.6, 1200, "11:00 AM – 7:00 PM", "High", "Ground Floor Accessible"),
        ("cat_e_miura_udon", "food_and_cafes", "Food & Cafés", "Miura Udon (Yoshida Udon)", "みうらうどん",
         "Famous Fujiyoshida chew-firm udon served in horsemeat and boiled cabbage savory dashi soup.", "日本一コシが強いと名高い伝統の吉田のうどん名店。",
         35.4855, 138.8102, "Fujiyoshida", "Utensils", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
         "Handmade Udon", 4.7, 600, "10:00 AM – 2:00 PM", "Moderate", "Tatami & Table Seating"),
        ("cat_e_cisco_coffee", "food_and_cafes", "Food & Cafés", "CISCO Coffee", "シスココーヒー",
         "San Francisco style specialty third-wave roastery serving pour-overs, Boston cream pie, and lake breezes.", "河口湖畔で極上のスペシャリティコーヒーと焼き菓子が味わえる人気カフェ。",
         35.5124, 138.7592, "Fujikawaguchiko", "Coffee", "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
         "Specialty Coffee", 4.6, 650, "9:30 AM – 5:00 PM", "Moderate", "Outdoor Terrace"),

        # Category F: Entertainment & Activities
        ("cat_f_fujiq", "entertainment_activities", "Entertainment & Activities", "Fuji-Q Highland", "富士急ハイランド",
         "Thrill capital of Japan featuring world-record roller coasters (Fujiyama, Do-Dodonpa) and Thomas Land.", "ギネス級の絶叫コースターと人気アトラクションが集まるテーマパーク。",
         35.4878, 138.7797, "Fujiyoshida", "Ticket", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "World-Class Coasters", 4.7, 6000, "9:00 AM – 6:00 PM", "High", "Accessible Priority Passes"),
        ("cat_f_ropeway", "entertainment_activities", "Entertainment & Activities", "Mt. Fuji Panoramic Ropeway", "富士山パノラマロープウェイ",
         "Scenic aerial cable car gliding up Mt. Tenjo to view Mount Fuji, bell of Tenjo, and Lake Kawaguchiko.", "カチカチ山の舞台から河口湖と富士山を360度見晴らす空中遊覧。",
         35.5039, 138.7731, "Fujikawaguchiko", "Compass", "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
         "Panoramic View", 4.7, 1000, "9:00 AM – 5:00 PM", "High", "Gondola Wheelchair Ready"),
        ("cat_f_yurari", "entertainment_activities", "Entertainment & Activities", "Fuji Yurari Hot Spring", "富士眺望の湯 ゆらり",
         "Traditional onsen facility featuring 16 different baths including panoramic Mt. Fuji carbonated baths.", "霊峰富士の絶景を望みながら多彩な16種のお風呂を満喫できる日帰り温泉。",
         35.4851, 138.6942, "Narusawa", "Sun", "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80",
         "16 Fuji View Baths", 4.8, 1500, "10:00 AM – 9:00 PM", "Moderate", "Elevator to All Floors"),

        # Category G: Essential Services
        ("cat_g_hospital", "essential_services", "Essential Services", "Fujiyoshida Municipal Hospital", "富士吉田市立病院",
         "Regional acute medical hospital equipped with 24-hour emergency room and multilingual support staff.", "24時間救急救命センターを備えた地域基幹病院（多言語対応可）。",
         35.4795, 138.7885, "Fujiyoshida", "Shield", "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
         "24/7 Emergency Care", 4.6, 0, "24 Hours Emergency", "Low", "Fully Accessible Hospital"),
        ("cat_g_koban", "essential_services", "Essential Services", "Kawaguchiko Station Police Koban", "河口湖駅前交番",
         "Police branch providing safety guidance, lost & found filing, and tourist emergency assistance.", "観光案内や落とし物、緊急時対応を行う駅前交番。",
         35.4984, 138.7690, "Fujikawaguchiko", "Shield", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
         "Police & Safety", 4.8, 0, "24 Hours Always Open", "Low", "Street Level Access"),
        ("cat_g_lockers", "essential_services", "Essential Services", "Kawaguchiko Luggage & Locker Center", "河口湖コインロッカー・手荷物預かり所",
         "Large-scale coin locker facility and same-day luggage delivery to Fuji Five Lakes hotels.", "大型スーツケース対応コインロッカーとホテル当日配送サービス。",
         35.4981, 138.7694, "Fujikawaguchiko", "Briefcase", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "Baggage Forwarding", 4.7, 700, "6:00 AM – 9:00 PM", "Moderate", "Level Flooring"),

        # Category H: Airports & Connections
        ("cat_h_shinjuku", "airports_connections", "Airports & Connections", "Busta Shinjuku Highway Coach", "バスタ新宿直通高速バス",
         "Direct express highway bus departing Kawaguchiko Station to Shinjuku Expressway Bus Terminal (105 min).", "河口湖駅からバスタ新宿まで直通約105分の快適高速バス。",
         35.6895, 139.7005, "Tokyo", "Plane", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
         "Direct Tokyo Link (105 min)", 4.8, 2200, "Every 15–30 min", "Moderate", "Accessible Bus Lift Option"),
        ("cat_h_haneda", "airports_connections", "Airports & Connections", "Haneda Airport Limousine Coach", "羽田空港直行リムジンバス",
         "Direct airport link connecting Kawaguchiko Station with Haneda Airport Terminals 1, 2, and 3.", "河口湖駅から羽田空港国際線・国内線ターミナルへ直行する連絡バス。",
         35.5494, 139.7798, "Tokyo", "Plane", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
         "Airport Direct (150 min)", 4.7, 2800, "Scheduled Daily Services", "Low", "Luggage Bay Included"),
        ("cat_h_narita", "airports_connections", "Airports & Connections", "Narita Airport Express Bus", "成田空港高速直通バス",
         "Long-distance comfortable coach connecting Mt. Fuji region directly with Narita International Airport.", "成田空港へ乗り換えなしでアクセスできる長距離高速バス。",
         35.7720, 140.3929, "Chiba", "Plane", "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80",
         "Airport Link (200 min)", 4.6, 3600, "Morning & Evening Trips", "Low", "Reclining Seats & WiFi"),
    ]

    for item in category_items:
        cursor.execute("""
        INSERT OR REPLACE INTO category_places_v11 (
            item_id, category_id, category_name, name_en, name_ja, description_en, description_ja,
            latitude, longitude, municipality, icon_name, image_url, badge, rating,
            admission_fee_jpy, opening_hours, crowd_level, accessibility
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item)

    # 6. Seed Canonical Kawaguchiko to Chureito Journey Plan (matching user screenshot Screen 4)
    steps_kawa_chureito = [
        {
            "step_number": 1,
            "title": "Depart from Kawaguchiko Station",
            "mode": "train",
            "duration_min": 3,
            "distance_m": 2900,
            "line_name": "Fujikyu Railway Line",
            "instruction": "Take the Fujikyu Railway to Fujisan Station.",
            "details": "Depart: 14:28 | Platform: 1 | Fare: ¥210",
            "icon": "train",
            "badge": "3 min"
        },
        {
            "step_number": 2,
            "title": "Arrive at Fujisan Station",
            "mode": "walk",
            "duration_min": 12,
            "distance_m": 900,
            "line_name": "Walking Route",
            "instruction": "Exit the station and follow signs to Chureito Pagoda.",
            "details": "Walk along the shaded pedestrian way towards Arakura Sengen shrine.",
            "icon": "walk",
            "badge": "12 min (900 m)"
        },
        {
            "step_number": 3,
            "title": "Arrive at Chureito Pagoda (Arakurayama Sengen Park)",
            "mode": "arrival",
            "duration_min": 0,
            "distance_m": 0,
            "line_name": "Destination",
            "instruction": "Enjoy the iconic view of Mt. Fuji and the pagoda!",
            "details": "Ascend the observation deck terrace for the panorama.",
            "icon": "flag",
            "badge": "Arrival Point",
            "photo_url": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80"
        }
    ]

    route_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [138.7692, 35.4983],  # Kawaguchiko
                        [138.7797, 35.4878],  # Fuji-Q
                        [138.7958, 35.4839],  # Fujisan Station
                        [138.8016, 35.5013]   # Chureito Pagoda
                    ]
                },
                "properties": {
                    "name": "Kawaguchiko to Chureito Journey Route",
                    "color": "#C66B4E"
                }
            }
        ]
    }

    cursor.execute("""
    INSERT OR REPLACE INTO journey_plans_v11 (
        plan_id, origin_name, destination_name, total_time_min, distance_km,
        train_fare_jpy, bus_fare_jpy, transfers_count, steps_json, route_geojson, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (
        "plan_kawa_to_chureito",
        "Kawaguchiko Station",
        "Chureito Pagoda",
        18,
        4.2,
        210,
        0,
        0,
        json.dumps(steps_kawa_chureito),
        json.dumps(route_geojson)
    ))
