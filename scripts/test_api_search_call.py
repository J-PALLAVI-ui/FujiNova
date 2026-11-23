import json
import sys
import os

sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")

from backend.app.services.routing.transit_models import RouteSearchRequest
from backend.app.services.routing.routing_service import get_routing_service

svc = get_routing_service()
req = RouteSearchRequest(
    origin="Kawaguchiko Station",
    destination="Oishi Park",
    departure_time="2026-11-09 09:00:00",
    max_transfers=0,
    max_results=1
)
res = svc.search_routes(req)

print("POST /api/v1/routes/search Direct Response:")
print(f"Origin:       {res.origin.stop_name_ja} ({res.origin.stop_name_en}) [ID: {res.origin.stop_id}]")
print(f"Destination:  {res.destination.stop_name_ja} ({res.destination.stop_name_en}) [ID: {res.destination.stop_id}]")
print(f"Query Date:   {res.search_date}")
print(f"Journeys Found: {res.total_journeys_found}")

for j in res.journeys:
    print(f"\nJourney ID:    {j.journey_id}")
    print(f"Departure:     {j.departure_time}")
    print(f"Arrival:       {j.arrival_time}")
    print(f"Duration:      {j.total_duration_minutes} min")
    print(f"Transfers:     {j.transfers_count}")
    print(f"Total Fare:    {j.total_fare_jpy} JPY")
    print(f"Badges:        {j.provenance_badges}")
    for idx, leg in enumerate(j.legs, start=1):
        print(f"\n  Leg {idx}:")
        print(f"    Mode:           {leg.mode}")
        print(f"    Operator:       {leg.operator}")
        print(f"    Route ID:       {leg.route_id}")
        print(f"    Route Name:     {leg.route_long_name}")
        print(f"    Route Color:    {leg.route_color}")
        print(f"    Headsign:       {leg.trip_headsign}")
        print(f"    Boarding Stop:  {leg.origin_stop_name_en} ({leg.origin_stop_name}) at {leg.departure_time}")
        print(f"    Alighting Stop: {leg.destination_stop_name_en} ({leg.destination_stop_name}) at {leg.arrival_time}")
        print(f"    Intermediate:   {leg.intermediate_stops_count} stops")
        print(f"    Fare:           {leg.fare_jpy} JPY")
        print(f"    Provenance:     {leg.provenance_badge}")
