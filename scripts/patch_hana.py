import re

with open("backend/app/agent/hana.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
import_addition = """from backend.app.services.routing.transit_models import RouteSearchRequest, JourneySchema
from backend.app.services.routing.routing_service import get_routing_service
"""
if "get_routing_service" not in content:
    content = content.replace("from backend.app.core.config import settings\n", "from backend.app.core.config import settings\n" + import_addition)

# 2. Update HanaState
if "identified_journeys: List[Dict[str, Any]]" not in content:
    content = content.replace(
        "    identified_places: List[Dict[str, Any]]\n",
        "    identified_places: List[Dict[str, Any]]\n    identified_journeys: List[Dict[str, Any]]\n"
    )

# 3. Update HANA_SYSTEM_INSTRUCTION
transit_instruction = """
4. DETERMINISTIC PUBLIC TRANSPORT ROUTING (ZERO-FABRICATION):
   - When asked for travel directions, bus lines, train timetables, colors, stops, or fares, you MUST rely ONLY on the verified RAPTOR transit calculation provided in your prompt.
   - Quote exact route colors (e.g. Kawaguchiko Sightseeing Red Line #E60012, Saiko Green Line #009944, Motosuko Blue Line #0068B7, Fuji Kyuko Line #007AC9), departure times, arrival times, transfer stops, and verified fares.
   - Never invent or modify public transport timetables or fares.
"""
if "DETERMINISTIC PUBLIC TRANSPORT ROUTING" not in content:
    content = content.replace(
        "    - Ask at most ONE or TWO focused questions at a time. Keep responses concise, helpful, and welcoming.\n\"\"\"",
        "    - Ask at most ONE or TWO focused questions at a time. Keep responses concise, helpful, and welcoming.\n" + transit_instruction + "\"\"\""
    )

# 4. Update get_or_create_state
if '"identified_journeys": []' not in content:
    content = content.replace(
        '                "identified_places": [],\n',
        '                "identified_places": [],\n                "identified_journeys": [],\n'
    )

# 5. Add extract_transit_query method to HanaAgent
extract_method = '''
    def extract_transit_query(self, text: str) -> Optional[Tuple[str, str]]:
        """Extracts origin and destination from transport/directions questions."""
        lower = text.lower()
        transit_keywords = ["bus", "train", "reach", "get to", "go to", "how do i", "how to", "route", "direction", "fare", "ticket", "line"]
        if not any(kw in lower for kw in transit_keywords):
            return None

        # Pattern 1: "from X to Y"
        m1 = re.search(r"from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+to\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m1:
            orig, dest = m1.group(1).strip(), m1.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest

        # Pattern 2: "reach/get to/go to Y from X"
        m2 = re.search(r"(?:reach|get to|go to|travel to)\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m2:
            dest, orig = m2.group(1).strip(), m2.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest

        # Pattern 3: "how do I get to/reach Y" (default origin Kawaguchiko Station)
        m3 = re.search(r"(?:reach|get to|go to|visit)\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m3:
            dest = m3.group(1).strip()
            if dest and dest.lower() not in ["there", "here", "somewhere"]:
                return "Kawaguchiko Station", dest

        return None
'''
if "def extract_transit_query" not in content:
    # insert before query_grounded_places
    content = content.replace("    def query_grounded_places", extract_method + "\n    def query_grounded_places")

# 6. Update chat method to execute transit search
transit_chat_block = '''        # 2b. Deterministic Public Transport Routing
        transit_pair = self.extract_transit_query(user_message)
        transit_context = ""
        state["identified_journeys"] = []
        if transit_pair:
            orig_q, dest_q = transit_pair
            try:
                routing_svc = get_routing_service()
                req = RouteSearchRequest(
                    origin=orig_q,
                    destination=dest_q,
                    max_transfers=2,
                    max_results=2
                )
                res = routing_svc.search_routes(req)
                if res.journeys:
                    state["identified_journeys"] = [j.model_dump() for j in res.journeys]
                    transit_context = (
                        "\\n\\nVERIFIED PUBLIC TRANSPORT ROUTING (Calculated deterministically by RAPTOR engine):\\n"
                        f"- Origin: {res.origin.stop_name_ja} ({res.origin.stop_name_en})\\n"
                        f"- Destination: {res.destination.stop_name_ja} ({res.destination.stop_name_en})\\n"
                    )
                    for j_idx, j in enumerate(res.journeys, start=1):
                        transit_context += (
                            f"\\nJourney Option {j_idx}: Depart {j.departure_time} -> Arrive {j.arrival_time} "
                            f"(Duration: {j.total_duration_minutes} min, Transfers: {j.transfers_count}, "
                            f"Total Fare: {j.total_fare_jpy} JPY):\\n"
                        )
                        for l_idx, leg in enumerate(j.legs, start=1):
                            transit_context += (
                                f"  * Leg {l_idx}: [{leg.mode.upper()}] {leg.operator} {leg.route_short_name} "
                                f"(Color: {leg.route_color}, Line: {leg.route_long_name})\\n"
                                f"    - Board: {leg.origin_stop_name_en} ({leg.origin_stop_name}) at {leg.departure_time}\\n"
                                f"    - Alight: {leg.destination_stop_name_en} ({leg.destination_stop_name}) at {leg.arrival_time}\\n"
                                f"    - Duration: {leg.duration_minutes} min ({leg.intermediate_stops_count} intermediate stops)\\n"
                                f"    - Fare: {leg.fare_jpy} JPY | Data Source: {leg.provenance_badge}\\n"
                            )
                            if leg.advisory_notes:
                                transit_context += f"    - Note: {leg.advisory_notes}\\n"
                    transit_context += (
                        "\\nSTRICT ROUTING GUIDANCE:\\n"
                        "- You MUST state the exact line name, color hex (e.g. Red Line #E60012), departure stop, "
                        "departure time, arrival time, and fare.\\n"
                        "- NEVER fabricate alternative times, colors, stops, or fares.\\n"
                        "- Always cite the data source badge.\\n"
                    )
            except Exception as e:
                logger.warning(f"Transit routing query error: {e}")
'''

if "# 2b. Deterministic Public Transport Routing" not in content:
    content = content.replace(
        "        # 3. Determine next unasked interview topic",
        transit_chat_block + "\n        # 3. Determine next unasked interview topic"
    )
    content = content.replace(
        "HANA_SYSTEM_INSTRUCTION + grounding_context + interview_guidance",
        "HANA_SYSTEM_INSTRUCTION + grounding_context + transit_context + interview_guidance"
    )

with open("backend/app/agent/hana.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Hana agent patched successfully.")
