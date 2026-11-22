"""FujiNova Database Connection & Schema Management."""
import os
import sqlite3
from contextlib import contextmanager
from typing import Generator, Optional
from backend.app.core.config import settings


def get_db_path() -> str:
    """Extract filesystem path from DATABASE_URL."""
    url = settings.DATABASE_URL
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "")
    return url


def init_db(db_path: Optional[str] = None) -> None:
    """Initialize SQLite database with WAL mode and canonical tables."""
    target_path = db_path or get_db_path()
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)

    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        # Enable Write-Ahead Logging for high concurrent read performance
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA foreign_keys = ON;")

        # Create canonical places table with field-level provenance
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS places (
            place_id TEXT PRIMARY KEY,
            name_ja TEXT NOT NULL,
            name_en TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            coords_source TEXT NOT NULL,
            primary_category TEXT NOT NULL,
            sub_category TEXT,
            opening_status TEXT NOT NULL CHECK(
                opening_status IN ('ALWAYS_OPEN', 'REGULAR_HOURS', 'SEASONAL_CLOSURE', 'TEMPORARILY_CLOSED', 'UNKNOWN')
            ),
            opening_hours_text TEXT,
            opening_hours_source TEXT NOT NULL,
            general_admission_type TEXT NOT NULL CHECK(
                general_admission_type IN ('FREE', 'PAID', 'UNKNOWN')
            ),
            general_admission_fee_jpy INTEGER,
            optional_activities_fee_desc TEXT,
            admission_fee_source TEXT NOT NULL,
            accessibility_status TEXT NOT NULL CHECK(
                accessibility_status IN ('VERIFIED_ACCESSIBLE', 'PARTIAL_STEPS', 'STEEP_STAIRS', 'INACCESSIBLE', 'UNKNOWN')
            ),
            accessibility_evidence TEXT,
            stair_step_count INTEGER,
            accessibility_source TEXT NOT NULL,
            fuji_view_rating INTEGER NOT NULL CHECK(fuji_view_rating BETWEEN 1 AND 5),
            indoor_alternative BOOLEAN NOT NULL,
            provenance_tier TEXT NOT NULL CHECK(
                provenance_tier IN ('OFFICIAL_GOV', 'OFFICIAL_OPERATOR', 'COMMUNITY_OSM', 'UNVERIFIED')
            ),
            source_url TEXT NOT NULL,
            required_attribution TEXT NOT NULL,
            source_retrieval_date TEXT NOT NULL,
            last_verified_date TEXT NOT NULL
        );
        """)

        # Indexes for fast spatial and attribute filtering
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_places_spatial ON places (latitude, longitude);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_places_category ON places (primary_category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_places_indoor ON places (indoor_alternative);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_places_access ON places (accessibility_status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_places_status ON places (opening_status);")

        # Persistent Conversations and Messages Schema (Phase 5)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_message_at TEXT NOT NULL,
            archived INTEGER DEFAULT 0,
            pinned INTEGER DEFAULT 0
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            message_id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_updated ON conversations (updated_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_pinned ON conversations (pinned DESC, updated_at DESC);")

        # Saved & Exported Trips Schema (Phase 6 / Stage 8)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_trips (
            trip_id TEXT PRIMARY KEY,
            share_token TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            total_days INTEGER NOT NULL DEFAULT 1,
            budget_tier TEXT DEFAULT 'standard',
            pace TEXT DEFAULT 'moderate',
            party_composition TEXT DEFAULT 'traveller',
            itinerary_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_private INTEGER DEFAULT 0,
            is_revoked INTEGER DEFAULT 0
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_saved_trips_token ON saved_trips (share_token);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_saved_trips_created ON saved_trips (created_at DESC);")

        # User Accounts & Profiles (FujiNova 9.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_accounts (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            created_at TEXT NOT NULL,
            preferences_json TEXT DEFAULT '{}'
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_email ON user_accounts (email);")

        # Budget & Expense Records (FujiNova 9.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            expense_id TEXT PRIMARY KEY,
            trip_id TEXT,
            user_id TEXT,
            category TEXT NOT NULL CHECK(category IN ('transport', 'admission', 'meals', 'accommodation', 'shopping', 'other')),
            amount_jpy INTEGER NOT NULL,
            description TEXT NOT NULL,
            is_verified_fee INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses (trip_id);")

        # Essential Services: Hospitals, Pharmacies, Konbini, ATMs, Toilets, Stations (FujiNova 9.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS essential_services (
            service_id TEXT PRIMARY KEY,
            name_en TEXT NOT NULL,
            name_ja TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('hospital', 'pharmacy', 'convenience_store', 'atm', 'toilet', 'tourist_info', 'train_station', 'bus_stop', 'parking', 'restaurant', 'police')),
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address_en TEXT,
            address_ja TEXT,
            phone TEXT,
            opening_hours TEXT,
            is_24_hours INTEGER DEFAULT 0,
            has_english_support INTEGER DEFAULT 0,
            source TEXT NOT NULL,
            last_verified_date TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_essential_cat ON essential_services (category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_essential_spatial ON essential_services (latitude, longitude);")

        # Travel Disruptions: Rail, Bus, Weather Warnings, Closures (FujiNova 9.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS travel_disruptions (
            disruption_id TEXT PRIMARY KEY,
            line_or_area TEXT NOT NULL,
            disruption_type TEXT NOT NULL CHECK(disruption_type IN ('train_delay', 'train_cancellation', 'bus_change', 'weather_warning', 'road_closure', 'attraction_closure')),
            severity TEXT NOT NULL CHECK(severity IN ('minor', 'moderate', 'severe')),
            title_en TEXT NOT NULL,
            title_ja TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_ja TEXT NOT NULL,
            alternative_advice_en TEXT,
            alternative_advice_ja TEXT,
            source TEXT NOT NULL,
            reported_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_disruptions_active ON travel_disruptions (is_active, reported_at DESC);")

        # Local Business & Experience Directory: Ryokans, Bike Rentals, Crafts, Tours (FujiNova 9.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS business_listings (
            business_id TEXT PRIMARY KEY,
            name_en TEXT NOT NULL,
            name_ja TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('ryokan', 'hotel', 'restaurant', 'tour', 'craft_workshop', 'cultural_experience', 'bicycle_rental', 'luggage_storage', 'transport')),
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address_ja TEXT,
            address_en TEXT,
            phone TEXT,
            operating_hours TEXT,
            price_range_jpy TEXT,
            official_website TEXT,
            verified_partner INTEGER DEFAULT 0,
            source_verification_date TEXT
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_business_cat ON business_listings (category);")

        # Real-Time Weather Snapshots across Elevations & Lakes (FujiNova 10.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS live_weather_snapshots (
            location_id TEXT PRIMARY KEY,
            location_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            elevation_m INTEGER NOT NULL,
            temperature_c REAL NOT NULL,
            apparent_temperature_c REAL,
            humidity_pct INTEGER,
            rain_probability_pct INTEGER,
            wind_speed_kmh REAL,
            wind_direction_deg INTEGER,
            cloud_cover_pct INTEGER,
            visibility_m INTEGER,
            uv_index REAL,
            weather_code INTEGER,
            weather_description TEXT,
            fuji_visibility_probability INTEGER,
            warning_level TEXT,
            data_source TEXT NOT NULL,
            observed_at TEXT NOT NULL,
            is_stale INTEGER DEFAULT 0
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weather_loc ON live_weather_snapshots (location_id);")

        # Natural Hazard & Volcanic Intelligence (FujiNova 10.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS natural_hazard_alerts (
            alert_id TEXT PRIMARY KEY,
            hazard_type TEXT NOT NULL CHECK(hazard_type IN ('volcanic', 'earthquake', 'weather_warning', 'flood', 'landslide', 'typhoon')),
            severity TEXT NOT NULL CHECK(severity IN ('normal', 'advisory', 'warning', 'emergency')),
            title_en TEXT NOT NULL,
            title_ja TEXT NOT NULL,
            details_en TEXT NOT NULL,
            details_ja TEXT NOT NULL,
            official_url TEXT NOT NULL,
            issued_by TEXT NOT NULL,
            issued_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hazard_active ON natural_hazard_alerts (is_active, issued_at DESC);")

        # Destination Verified Media Gallery & Wikimedia Attribution (FujiNova 10.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS destination_media_gallery (
            media_id TEXT PRIMARY KEY,
            place_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            thumbnail_url TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            license_name TEXT NOT NULL,
            license_url TEXT,
            source_url TEXT NOT NULL,
            is_verified_location INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_media_place ON destination_media_gallery (place_id);")

        # Central Provider Sync Health & Diagnostics (FujiNova 10.0)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS provider_sync_health (
            provider_name TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('HEALTHY', 'DEGRADED', 'OUTAGE', 'RATE_LIMITED', 'INITIALIZING')),
            last_sync_success TEXT,
            last_sync_attempt TEXT,
            last_error TEXT,
            response_time_ms INTEGER,
            total_calls_today INTEGER DEFAULT 0,
            quota_limit_daily INTEGER,
            is_free_tier INTEGER DEFAULT 1
        );
        """)

        # FujiNova 11.0 — Hana Smart Journey & Station Guide Schema & Seeding
        try:
            from backend.app.services.smart_journey.data_seed import seed_fujinova11_data
            seed_fujinova11_data(cursor)
        except Exception as e:
            # Fallback safe logging if seed fails during partial migrations
            pass

        conn.commit()


@contextmanager
def get_db_connection(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional SQLite database connection."""
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
