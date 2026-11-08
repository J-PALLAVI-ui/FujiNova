export interface Place {
  place_id: string;
  name_ja: string;
  name_en?: string;
  latitude: number;
  longitude: number;
  coords_source: string;
  primary_category: string;
  sub_category?: string;
  opening_status: 'ALWAYS_OPEN' | 'REGULAR_HOURS' | 'SEASONAL_CLOSURE' | 'TEMPORARILY_CLOSED' | 'UNKNOWN';
  opening_hours_text?: string;
  opening_hours_source: string;
  general_admission_type: 'FREE' | 'PAID' | 'UNKNOWN';
  general_admission_fee_jpy?: number | null;
  optional_activities_fee_desc?: string | null;
  admission_fee_source: string;
  accessibility_status: 'VERIFIED_ACCESSIBLE' | 'PARTIAL_STEPS' | 'STEEP_STAIRS' | 'INACCESSIBLE' | 'UNKNOWN';
  accessibility_evidence?: string;
  stair_step_count?: number | null;
  accessibility_source: string;
  fuji_view_rating: number;
  indoor_alternative: boolean;
  provenance_tier: 'OFFICIAL_GOV' | 'OFFICIAL_OPERATOR' | 'COMMUNITY_OSM' | 'UNVERIFIED';
  source_url: string;
  required_attribution: string;
  source_retrieval_date: string;
  last_verified_date: string;
}

export interface TravellerProfile {
  origin_location?: string;
  party_composition?: string;
  has_elderly?: boolean;
  has_children?: boolean;
  mobility_limitations?: boolean;
  mobility_needs?: string;
  preferred_pace?: 'relaxed' | 'moderate' | 'active';
  interests?: string[];
  budget_tier?: 'budget' | 'standard' | 'luxury';
  trip_duration_days?: number;
  fuji_view_priority?: number;
  indoor_preference?: boolean;
}

export interface JourneyLeg {
  mode: 'bus' | 'rail' | 'walk';
  operator: string;
  route_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_color: string;
  route_text_color: string;
  trip_headsign?: string;
  origin_stop_id: string;
  origin_stop_name: string;
  origin_stop_name_en: string;
  departure_time: string;
  departure_timestamp_sec: number;
  destination_stop_id: string;
  destination_stop_name: string;
  destination_stop_name_en: string;
  arrival_time: string;
  arrival_timestamp_sec: number;
  duration_minutes: number;
  intermediate_stops_count: number;
  intermediate_stops: string[];
  fare_jpy?: number | null;
  provenance: string;
  provenance_badge: string;
  advisory_notes?: string | null;
}

export interface Journey {
  journey_id: string;
  departure_time: string;
  arrival_time: string;
  total_duration_minutes: number;
  transfers_count: number;
  total_fare_jpy?: number | null;
  legs: JourneyLeg[];
  provenance_badges: string[];
  warnings: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hana';
  text: string;
  places?: Place[];
  journeys?: Journey[];
  timestamp: string;
}
