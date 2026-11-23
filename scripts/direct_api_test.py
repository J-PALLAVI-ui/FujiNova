import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from backend.app.main import app

print("Creating TestClient...")
client = TestClient(app)
print("Sending POST /api/v1/routes/search with invalid stop...")
try:
    res = client.post(
        "/api/v1/routes/search",
        json={
            "origin": "CompletelyFakeNonExistentStopXYZ",
            "destination": "Oishi Park",
            "departure_time": "09:00:00"
        }
    )
    print("Status code:", res.status_code)
    print("Response body:", res.json())
except Exception as e:
    import traceback
    traceback.print_exc()

print("Sending POST /api/v1/routes/search with valid Kawaguchiko -> Oishi...")
try:
    res = client.post(
        "/api/v1/routes/search",
        json={
            "origin": "Kawaguchiko Station",
            "destination": "Oishi Park",
            "departure_time": "2026-11-08 09:00:00",
            "max_transfers": 1,
            "max_results": 2
        }
    )
    print("Status code:", res.status_code)
    data = res.json()
    print("Journeys found:", data.get("total_journeys_found"))
    for j in data.get("journeys", []):
        print(f"Journey: {j['departure_time']} -> {j['arrival_time']} | Fare: {j['total_fare_jpy']} JPY | Transfers: {j['transfers_count']}")
        for leg in j["legs"]:
            print(f"  Leg: [{leg['mode']}] {leg['operator']} {leg['route_short_name']} ({leg['route_color']}) | {leg['origin_stop_name_en']} ({leg['departure_time']}) -> {leg['destination_stop_name_en']} ({leg['arrival_time']}) | {leg['fare_jpy']} JPY")
except Exception as e:
    import traceback
    traceback.print_exc()
