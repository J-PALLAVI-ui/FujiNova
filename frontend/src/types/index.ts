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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hana';
  text: string;
  places?: Place[];
  timestamp: string;
}
