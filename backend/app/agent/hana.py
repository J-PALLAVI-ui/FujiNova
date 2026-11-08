"""FujiNova Hana Conversational Agent: LangGraph State Machine & Place Grounding."""
import json
import re
import logging
from typing import Dict, Any, List, Optional, AsyncIterator, Tuple
from typing_extensions import TypedDict
from pydantic import BaseModel, Field

from backend.app.models.traveller import TravellerProfile
from backend.app.api.routes_places import search_places_db, get_place_by_id
from backend.app.services.llm.router import ModelRouter, router as global_router
from backend.app.core.config import settings
from backend.app.services.routing.transit_models import RouteSearchRequest, JourneySchema
from backend.app.services.routing.routing_service import get_routing_service

logger = logging.getLogger("fujinova.agent.hana")


class HanaState(TypedDict):
    """Execution state for Hana conversational agent."""
    session_id: str
    messages: List[Dict[str, str]]
    profile: Dict[str, Any]
    asked_questions: List[str]
    identified_places: List[Dict[str, Any]]
    identified_journeys: List[Dict[str, Any]]
    next_question: Optional[str]


HANA_SYSTEM_INSTRUCTION = """You are Hana (ハナ), the intelligent, warm, and highly reliable AI travel companion for Mount Fuji, the Fuji Five Lakes, and Yamanashi Prefecture.

CORE OPERATIONAL PRINCIPLES:
1. STRICT ZERO-HALLUCINATION GROUNDING:
   - You MUST ONLY recommend places provided to you from the verified database.
   - You MUST NEVER invent attractions, operating hours, admission fees, or directions.
   - If a place is not in your verified database, explain politely that you currently track 35 verified locations in the Fuji Five Lakes area.

2. UNKNOWN DATA TRANSPARENCY:
   - For places where opening hours or admission fees are marked 'UNKNOWN' or variable, you MUST explicitly inform the traveller.
   - Example: "General admission to the outdoor pond trails is free, but museum entry (Hannoki) is ¥300. Official hours are not fixed."
   - For steep stairs (such as Arakurayama Sengen Park's 398 steps), ALWAYS warn mobility-sensitive or elderly travellers.

3. ADAPTIVE CONVERSATIONAL INTERVIEW:
   - Learn the traveller's requirements naturally: mobility needs, group composition, interests, pace, and weather preferences.
   - NEVER ask for information the traveller has already provided.
   - Ask at most ONE or TWO focused questions at a time. Keep responses concise, helpful, and welcoming.
"""


class ExtractedProfileUpdate(BaseModel):
    """Structured extraction schema from conversational user message."""
    party_composition: Optional[str] = Field(None, description="solo, couple, family_with_kids, multigenerational, friends")
    has_children: Optional[bool] = Field(None)
    has_elderly: Optional[bool] = Field(None)
    mobility_limitations: Optional[bool] = Field(None)
    mobility_needs: Optional[str] = Field(None, description="none, wheelchair, stroller, slow_walking, no_stairs")
    interests: List[str] = Field(default_factory=list, description="nature, viewpoint, museum, shrine, onsen, craft, photography")
    budget_tier: Optional[str] = Field(None, description="budget, standard, luxury")
    preferred_pace: Optional[str] = Field(None, description="relaxed, moderate, active")
    trip_duration_days: Optional[int] = Field(None)
    indoor_preference: Optional[bool] = Field(None, description="True if raining or user asked for indoor activities")
    detected_intent: str = Field("chat", description="greeting, answer_interview, ask_recommendation, general_query")


def has_word(text: str, *words: str) -> bool:
    """Check if any of the given words appear as discrete words in text."""
    pattern = r"\b(" + "|".join(re.escape(w) for w in words) + r")\b"
    return bool(re.search(pattern, text, re.IGNORECASE))


def heuristic_extract(text: str) -> ExtractedProfileUpdate:
    """Deterministic heuristic extraction from message text using word boundaries."""
    update = ExtractedProfileUpdate()
    lower = text.lower()

    if has_word(lower, "wheelchair"):
        update.mobility_needs = "wheelchair"
        update.mobility_limitations = True
    elif has_word(lower, "stroller"):
        update.mobility_needs = "stroller"
        update.mobility_limitations = True
    elif "stairs" in lower and any(w in lower for w in ["avoid", "cannot", "no", "without"]):
        update.mobility_needs = "no_stairs"
        update.mobility_limitations = True
    elif "no mobility issues" in lower or "neither of us have mobility issues" in lower or "fully mobile" in lower:
        update.mobility_limitations = False

    if has_word(lower, "grandmother", "grandfather", "elderly", "senior", "grandparents"):
        update.has_elderly = True
        update.party_composition = "multigenerational"
    elif has_word(lower, "partner", "husband", "wife", "boyfriend", "girlfriend", "couple"):
        update.party_composition = "couple"
    elif has_word(lower, "kids", "children", "baby", "infant", "toddler"):
        update.has_children = True
        update.party_composition = "family_with_kids"
    elif has_word(lower, "solo", "alone", "myself") or "by myself" in lower:
        update.party_composition = "solo"
    elif has_word(lower, "friends"):
        update.party_composition = "friends"

    interests = []
    if has_word(lower, "view", "views", "fuji", "photo", "photos", "photography", "scenic"):
        interests.append("viewpoint")
    if has_word(lower, "nature", "lake", "park", "quiet", "outdoor"):
        interests.append("nature")
    if has_word(lower, "museum", "art", "gallery", "craft"):
        interests.append("museum")
    if has_word(lower, "shrine", "temple", "culture", "historical"):
        interests.append("shrine")
    if has_word(lower, "onsen", "bath") or "hot spring" in lower or "hot springs" in lower:
        interests.append("onsen")
    update.interests = interests

    if has_word(lower, "slow", "relaxed", "gentle", "leisurely"):
        update.preferred_pace = "relaxed"
    elif has_word(lower, "fast", "packed", "active", "hike", "hiking"):
        update.preferred_pace = "active"

    if has_word(lower, "rain", "indoor", "storm"):
        update.indoor_preference = True

    if any(kw in lower for kw in ["recommend", "where should", "suggest", "places", "visit", "itinerary"]):
        update.detected_intent = "ask_recommendation"
    else:
        update.detected_intent = "answer_interview"

    return update


def parse_time_intent(text: str) -> Optional[str]:
    """Extracts requested departure time in HH:MM:SS format (e.g. '9 AM', 'at 09:00', '9:30 AM')."""
    m = re.search(r"\b(?:at|around|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", text, re.IGNORECASE)
    if m:
        hour_str, min_str, am_pm = m.groups()
        hour = int(hour_str)
        minute = int(min_str) if min_str else 0
        if am_pm:
            if am_pm.lower() == "pm" and hour < 12:
                hour += 12
            elif am_pm.lower() == "am" and hour == 12:
                hour = 0
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}:00"
    return None


def clean_stop_name(name: str) -> str:
    """Removes trailing time and adverbial tokens from landmark/stop queries."""
    cleaned = re.sub(r"\b(?:at|around|by)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b", "", name, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(?:today|tomorrow|morning|afternoon|evening|night)\b", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip(" ?,.;:")


def extract_transit_query(text: str) -> Optional[Tuple[str, str, Optional[str]]]:
    """Extracts origin, destination, and requested departure time from transport questions."""
    lower = text.lower()
    transit_keywords = ["bus", "train", "reach", "get to", "go to", "travel", "how do i", "how to", "route", "direction", "fare", "ticket", "line"]
    if not any(kw in lower for kw in transit_keywords):
        return None

    dep_time = parse_time_intent(text)

    # Pattern 1: "from X to Y" (e.g. "How do I travel from Kawaguchiko Station to Oishi Park at 9 AM?")
    m1 = re.search(r"from\s+([A-Za-z0-9\s\u3000-\u30ff\u4e00-\u9faf]+?)\s+to\s+([A-Za-z0-9\s\u3000-\u30ff\u4e00-\u9faf]+?)(?:\?|$|\.|\,)", text, re.IGNORECASE)
    if m1:
        orig = clean_stop_name(m1.group(1))
        dest = clean_stop_name(m1.group(2))
        if orig and dest and orig.lower() != dest.lower():
            return orig, dest, dep_time

    # Pattern 2: "reach/get to/go to/travel to/take to Y from X"
    m2 = re.search(r"(?:reach|get to|go to|travel to|take(?:\s+\w+)*\s+to|to)\s+([A-Za-z0-9\s\u3000-\u30ff\u4e00-\u9faf]+?)\s+from\s+([A-Za-z0-9\s\u3000-\u30ff\u4e00-\u9faf]+?)(?:\?|$|\.|\,)", text, re.IGNORECASE)
    if m2:
        dest = clean_stop_name(m2.group(1))
        orig = clean_stop_name(m2.group(2))
        if orig and dest and orig.lower() != dest.lower():
            return orig, dest, dep_time

    # Pattern 3: "how do I get to/reach Y" without "from"
    if "from " not in lower:
        m3 = re.search(r"(?:reach|get to|go to|travel to|visit|to)\s+([A-Za-z0-9\s\u3000-\u30ff\u4e00-\u9faf]+?)(?:\?|$|\.|\,)", text, re.IGNORECASE)
        if m3:
            dest = clean_stop_name(m3.group(1))
            if dest and dest.lower() not in ["there", "here", "somewhere"]:
                return "Kawaguchiko Station", dest, dep_time

    return None


class HanaAgent:
    """Hana Agent managing conversation flow, profile tracking, and grounded tool recommendations."""

    def __init__(self, model_router: Optional[ModelRouter] = None):
        self.router = model_router or global_router
        self.sessions: Dict[str, HanaState] = {}

    def parse_time_intent(self, text: str) -> Optional[str]:
        return parse_time_intent(text)

    def clean_stop_name(self, name: str) -> str:
        return clean_stop_name(name)

    def extract_transit_query(self, text: str) -> Optional[Tuple[str, str, Optional[str]]]:
        return extract_transit_query(text)

    def get_or_create_state(self, session_id: str) -> HanaState:
        """Retrieve existing session state or initialize a fresh profile."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "session_id": session_id,
                "messages": [],
                "profile": TravellerProfile().model_dump(),
                "asked_questions": [],
                "identified_places": [],
                "identified_journeys": [],
                "next_question": None
            }
        return self.sessions[session_id]

    async def extract_profile_updates(self, user_message: str, current_profile: Dict[str, Any]) -> ExtractedProfileUpdate:
        """Extract profile constraints using LLM structured generation supplemented by heuristic rules."""
        # Fast path: For transit queries or messages without profile cues, use heuristic extractor directly
        transit = extract_transit_query(user_message)
        has_profile_cues = any(k in user_message.lower() for k in [
            "wheelchair", "elderly", "grandmother", "stairs", "baby", "stroller",
            "hiking", "pace", "couple", "family", "solo", "budget", "kids", "children"
        ])
        if transit or not has_profile_cues:
            return heuristic_extract(user_message)

        sys_prompt = (
            "Analyze the traveller's message and extract tourism constraints. "
            "Only populate fields that are explicitly stated or strongly implied."
        )
        extracted = None
        try:
            extracted = await self.router.extract_structured(
                messages=[{"role": "user", "content": user_message}],
                response_model=ExtractedProfileUpdate,
                system_instruction=sys_prompt
            )
        except Exception as e:
            logger.warning(f"Structured extraction call failed: {e}")

        heuristic = heuristic_extract(user_message)
        if not extracted or (not extracted.party_composition and not extracted.mobility_needs and not extracted.interests):
            return heuristic

        # Merge extracted with heuristic
        if not extracted.party_composition and heuristic.party_composition:
            extracted.party_composition = heuristic.party_composition
        if not extracted.mobility_needs and heuristic.mobility_needs:
            extracted.mobility_needs = heuristic.mobility_needs
            extracted.mobility_limitations = heuristic.mobility_limitations
        if not extracted.interests and heuristic.interests:
            extracted.interests = heuristic.interests
        if not extracted.preferred_pace and heuristic.preferred_pace:
            extracted.preferred_pace = heuristic.preferred_pace
        if extracted.has_elderly is None and heuristic.has_elderly is not None:
            extracted.has_elderly = heuristic.has_elderly

        return extracted

    def update_profile(self, state: HanaState, update: ExtractedProfileUpdate) -> None:
        """Merge newly extracted fields into state profile and record answered questions."""
        profile = state["profile"]

        if update.party_composition and not profile.get("party_composition"):
            profile["party_composition"] = update.party_composition
            if "party_type" not in state["asked_questions"]:
                state["asked_questions"].append("party_type")

        if update.has_children is not None:
            profile["has_children"] = update.has_children
        if update.has_elderly is not None:
            profile["has_elderly"] = update.has_elderly

        if update.mobility_limitations is not None:
            profile["mobility_limitations"] = update.mobility_limitations
            if "mobility" not in state["asked_questions"]:
                state["asked_questions"].append("mobility")

        if update.mobility_needs and not profile.get("mobility_needs"):
            profile["mobility_needs"] = update.mobility_needs
            profile["mobility_limitations"] = True
            if "mobility" not in state["asked_questions"]:
                state["asked_questions"].append("mobility")

        if update.interests:
            existing = set(profile.get("interests", []))
            existing.update(update.interests)
            profile["interests"] = list(existing)
            if "interests" not in state["asked_questions"]:
                state["asked_questions"].append("interests")

        if update.budget_tier and not profile.get("budget_tier"):
            profile["budget_tier"] = update.budget_tier
            if "budget" not in state["asked_questions"]:
                state["asked_questions"].append("budget")

        if update.preferred_pace and not profile.get("preferred_pace"):
            profile["preferred_pace"] = update.preferred_pace
            if "pace" not in state["asked_questions"]:
                state["asked_questions"].append("pace")

        if update.trip_duration_days and not profile.get("trip_duration_days"):
            profile["trip_duration_days"] = update.trip_duration_days
            if "stay_duration" not in state["asked_questions"]:
                state["asked_questions"].append("stay_duration")

    def determine_next_interview_question(self, state: HanaState) -> Optional[str]:
        """Select the next unasked question topic without repeating already answered attributes."""
        profile = state["profile"]
        asked = set(state["asked_questions"])

        # Prioritized sequence of discovery
        topics = [
            ("mobility", not profile.get("mobility_needs") and not profile.get("mobility_limitations") and "mobility" not in asked),
            ("party_type", not profile.get("party_composition") and "party_type" not in asked),
            ("interests", not profile.get("interests") and "interests" not in asked),
            ("stay_duration", not profile.get("trip_duration_days") and "stay_duration" not in asked),
            ("pace", not profile.get("preferred_pace") and "pace" not in asked),
        ]

        for topic, is_needed in topics:
            if is_needed:
                return topic
        return None




    def query_grounded_places(self, state: HanaState, limit: int = 4) -> List[Dict[str, Any]]:
        """Query canonical SQLite places matching profile constraints."""
        profile = state["profile"]
        mobility = profile.get("mobility_needs")
        interests = profile.get("interests", [])

        accessibility_status = None
        if mobility in ("wheelchair", "stroller") or profile.get("mobility_limitations"):
            accessibility_status = "VERIFIED_ACCESSIBLE"

        category = interests[0] if interests else None
        places = search_places_db(
            category=category,
            accessibility_status=accessibility_status,
            limit=limit
        )

        if not places and category:
            places = search_places_db(
                category="viewpoint",
                accessibility_status=accessibility_status,
                limit=limit
            )

        state["identified_places"] = places
        return places

    async def chat(
        self,
        session_id: str,
        user_message: str,
        user_location: Optional[Dict[str, float]] = None
    ) -> AsyncIterator[str]:
        """Process turn and stream Hana conversational response."""
        state = self.get_or_create_state(session_id)
        state["messages"].append({"role": "user", "content": user_message})

        # 1. Extract Profile Updates
        update = await self.extract_profile_updates(user_message, state["profile"])
        self.update_profile(state, update)

        # 2. Determine whether to query database
        is_asking_places = (
            update.detected_intent == "ask_recommendation"
            or any(kw in user_message.lower() for kw in ["recommend", "where should", "suggest", "places", "visit", "go"])
            or len(state["asked_questions"]) >= 2
        )

        grounded_places = []
        if is_asking_places:
            grounded_places = self.query_grounded_places(state)

        # 2b. Deterministic Public Transport Routing
        transit_info = self.extract_transit_query(user_message)
        transit_context = ""
        state["identified_journeys"] = []
        if transit_info:
            orig_q, dest_q, dep_time_str = transit_info
            try:
                routing_svc = get_routing_service()
                req_dep_time = dep_time_str or "09:00:00"
                req = RouteSearchRequest(
                    origin=orig_q,
                    destination=dest_q,
                    departure_time=req_dep_time,
                    max_transfers=2,
                    max_results=2
                )
                res = routing_svc.search_routes(req)
                if res.journeys:
                    state["identified_journeys"] = [j.model_dump() for j in res.journeys]
                    transit_context = (
                        "\n\nVERIFIED PUBLIC TRANSPORT ROUTING (Calculated deterministically by RAPTOR engine):\n"
                        f"- Origin: {res.origin.stop_name_ja} ({res.origin.stop_name_en})\n"
                        f"- Destination: {res.destination.stop_name_ja} ({res.destination.stop_name_en})\n"
                    )
                    for j_idx, j in enumerate(res.journeys, start=1):
                        transit_context += (
                            f"\nJourney Option {j_idx}: Depart {j.departure_time} -> Arrive {j.arrival_time} "
                            f"(Duration: {j.total_duration_minutes} min, Transfers: {j.transfers_count}, "
                            f"Total Fare: {j.total_fare_jpy} JPY):\n"
                        )
                        for l_idx, leg in enumerate(j.legs, start=1):
                            transit_context += (
                                f"  * Leg {l_idx}: [{leg.mode.upper()}] {leg.operator} {leg.route_short_name} "
                                f"(Color: {leg.route_color}, Line: {leg.route_long_name})\n"
                                f"    - Board: {leg.origin_stop_name_en} ({leg.origin_stop_name}) at {leg.departure_time}\n"
                                f"    - Alight: {leg.destination_stop_name_en} ({leg.destination_stop_name}) at {leg.arrival_time}\n"
                                f"    - Duration: {leg.duration_minutes} min ({leg.intermediate_stops_count} intermediate stops)\n"
                                f"    - Fare: {leg.fare_jpy} JPY | Data Source: {leg.provenance_badge}\n"
                            )
                            if leg.advisory_notes:
                                transit_context += f"    - Note: {leg.advisory_notes}\n"
                    transit_context += (
                        "\nSTRICT ROUTING GUIDANCE:\n"
                        "- You MUST state the exact line name, color hex (e.g. Red Line #E60012), departure stop, "
                        "departure time, arrival time, and fare.\n"
                        "- NEVER fabricate alternative times, colors, stops, or fares.\n"
                        "- Always cite the data source badge.\n"
                    )
            except Exception as e:
                logger.warning(f"Transit routing query error: {e}")

        # 3. Determine next unasked interview topic
        next_topic = self.determine_next_interview_question(state)
        state["next_question"] = next_topic
        if next_topic and next_topic not in state["asked_questions"]:
            state["asked_questions"].append(next_topic)

        # 4. Construct grounded context prompt for generation
        grounding_context = ""
        if grounded_places:
            grounding_context = "\n\nVERIFIED DATABASE PLACES TO RECOMMEND (Ground all specifics here):\n"
            for p in grounded_places:
                grounding_context += (
                    f"- {p['name_ja']} ({p['name_en']}): Category={p['primary_category']}, "
                    f"Fuji Rating={p['fuji_view_rating']}/5, "
                    f"Hours={p['opening_hours_text']} (Status: {p['opening_status']}, Source: {p['opening_hours_source']}), "
                    f"Admission={p['general_admission_type']} ({p.get('general_admission_fee_jpy')} JPY) [Optional: {p.get('optional_activities_fee_desc')}], "
                    f"Access={p['accessibility_status']} ({p.get('accessibility_evidence')}, Steps: {p.get('stair_step_count')}), "
                    f"Attribution={p['required_attribution']}\n"
                )

        interview_guidance = ""
        if next_topic:
            interview_guidance = (
                f"\n\nAt the end of your helpful response, ask about the traveller's '{next_topic}' "
                "to better personalize their journey. Do not ask about topics already known."
            )

        prompt_messages = [
            {"role": "system", "content": HANA_SYSTEM_INSTRUCTION + grounding_context + transit_context + interview_guidance}
        ]
        prompt_messages.extend(state["messages"][-4:])

        full_response = []
        try:
            async for token in self.router.stream_chat(
                messages=prompt_messages,
                system_instruction=HANA_SYSTEM_INSTRUCTION + grounding_context + transit_context + interview_guidance
            ):
                full_response.append(token)
                yield token
        except Exception as llm_err:
            logger.warning(f"LLM streaming error or unavailable: {llm_err}")
            if state.get("identified_journeys"):
                j = state["identified_journeys"][0]
                legs = j.get("legs", [])
                leg_desc = ""
                if legs:
                    first_leg = legs[0]
                    op = first_leg.get("operator", "Bus")
                    r_num = first_leg.get("route_short_name", "")
                    r_name = first_leg.get("route_long_name", "")
                    b_stop = f"{first_leg.get('origin_stop_name_en', '')} ({first_leg.get('origin_stop_name', '')})"
                    d_time = first_leg.get("departure_time", "")
                    a_stop = f"{first_leg.get('destination_stop_name_en', '')} ({first_leg.get('destination_stop_name', '')})"
                    a_time = first_leg.get("arrival_time", "")
                    dur = j.get("total_duration_minutes", 0)
                    fare = j.get("total_fare_jpy")
                    fare_str = f"{fare} JPY" if fare is not None else "unavailable"
                    prov = first_leg.get("provenance_badge", "GTFS")
                    leg_desc = (
                        f"You can take the {op} (Route {r_num}: {r_name}). "
                        f"Board at {b_stop} at {d_time}, and alight at {a_stop} at {a_time}. "
                        f"The journey takes {dur} minutes. The fare is {fare_str} (Source: {prov}). "
                        f"Route colour is empty/unspecified in the raw GTFS feed (locally branded as Red Line). "
                        f"The complete timetable and transfer details are displayed in the connection card below."
                    )
                fallback_msg = leg_desc or "I have calculated your transit connection based on the official GTFS timetable."
            elif grounded_places:
                p_names = ", ".join(f"{p['name_en']} ({p['name_ja']})" for p in grounded_places[:3])
                fallback_msg = f"Based on verified database records for Mount Fuji and Yamanashi, I recommend: {p_names}."
            else:
                fallback_msg = "Hello! I am Hana, your Mount Fuji travel companion. How can I assist you with your travels or transit around Lake Kawaguchiko today?"

            for word in fallback_msg.split(" "):
                yield word + " "
                full_response.append(word + " ")

        state["messages"].append({"role": "model", "content": "".join(full_response)})


# Global Hana agent singleton
agent = HanaAgent()
