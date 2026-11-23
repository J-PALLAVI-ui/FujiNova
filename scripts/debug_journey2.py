import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")

from backend.app.services.routing.routing_service import get_routing_service, RouteSearchRequest

svc = get_routing_service()
req2 = RouteSearchRequest(
    origin="Otsuki Station",
    destination="Kawaguchiko Station",
    departure_time="2026-11-08 08:00:00",
    max_transfers=0,
    max_results=2
)
res2 = svc.search_routes(req2)
for j in res2.journeys:
    for leg in j.legs:
        print(f"Leg: {leg.origin_stop_id} ({leg.departure_timestamp_sec} -> {leg.departure_time}) to {leg.destination_stop_id} ({leg.arrival_timestamp_sec} -> {leg.arrival_time}) trip={leg.route_id}")
