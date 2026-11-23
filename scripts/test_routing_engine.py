import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")

from backend.app.services.routing.routing_service import get_routing_service, RouteSearchRequest

print("Initializing routing service...")
svc = get_routing_service()
print(f"Loaded {len(svc.stops)} stops, {len(svc.routes)} routes, {len(svc.trips)} trips.")

print("\n--- TEST JOURNEY 1: Kawaguchiko Station -> Oishi Park (09:00 departure) ---")
req1 = RouteSearchRequest(
    origin="Kawaguchiko Station",
    destination="Oishi Park",
    departure_time="2026-11-08 09:00:00",
    max_transfers=1,
    max_results=2
)
res1 = svc.search_routes(req1)
print(f"Found {res1.total_journeys_found} journeys.")
for j in res1.journeys:
    print(f"Journey: {j.departure_time} -> {j.arrival_time} ({j.total_duration_minutes} min), Transfers: {j.transfers_count}, Fare: {j.total_fare_jpy} JPY")
    for leg in j.legs:
        print(f"  Leg: [{leg.mode}] {leg.operator} {leg.route_short_name} ({leg.route_color}) | {leg.origin_stop_name_en} ({leg.departure_time}) -> {leg.destination_stop_name_en} ({leg.arrival_time}) | {leg.fare_jpy} JPY | {leg.provenance_badge}")

print("\n--- TEST JOURNEY 2: Otsuki Station -> Kawaguchiko Station (08:00 departure) ---")
req2 = RouteSearchRequest(
    origin="Otsuki Station",
    destination="Kawaguchiko Station",
    departure_time="2026-11-08 08:00:00",
    max_transfers=0,
    max_results=2
)
res2 = svc.search_routes(req2)
print(f"Found {res2.total_journeys_found} journeys.")
for j in res2.journeys:
    print(f"Journey: {j.departure_time} -> {j.arrival_time} ({j.total_duration_minutes} min), Transfers: {j.transfers_count}, Fare: {j.total_fare_jpy} JPY")
    for leg in j.legs:
        print(f"  Leg: [{leg.mode}] {leg.operator} {leg.route_short_name} ({leg.route_color}) | {leg.origin_stop_name_en} ({leg.departure_time}) -> {leg.destination_stop_name_en} ({leg.arrival_time}) | {leg.fare_jpy} JPY | {leg.provenance_badge}")

print("\n--- TEST JOURNEY 3: Otsuki Station -> Oishi Park (08:00 departure, 1 transfer) ---")
req3 = RouteSearchRequest(
    origin="Otsuki Station",
    destination="Oishi Park",
    departure_time="2026-11-08 08:00:00",
    max_transfers=2,
    max_results=2
)
res3 = svc.search_routes(req3)
print(f"Found {res3.total_journeys_found} journeys.")
for j in res3.journeys:
    print(f"Journey: {j.departure_time} -> {j.arrival_time} ({j.total_duration_minutes} min), Transfers: {j.transfers_count}, Fare: {j.total_fare_jpy} JPY")
    for leg in j.legs:
        print(f"  Leg: [{leg.mode}] {leg.operator} {leg.route_short_name} ({leg.route_color}) | {leg.origin_stop_name_en} ({leg.departure_time}) -> {leg.destination_stop_name_en} ({leg.arrival_time}) | {leg.fare_jpy} JPY | {leg.provenance_badge}")

print("\nAll 3 test journeys executed successfully.")
