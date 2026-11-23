import csv
import json

trip_id = "0114_04_01_01_0900"
route_id = None
with open("data/gtfs/fujikyu_bus/trips.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["trip_id"] == trip_id:
            route_id = row["route_id"]
            break

route_info = None
with open("data/gtfs/fujikyu_bus/routes.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["route_id"] == route_id:
            route_info = row
            break

with open("data/gtfs/fujikyu_bus/trip_0114.json", "w", encoding="utf-8") as out:
    json.dump({"trip_id": trip_id, "route": route_info}, out, ensure_ascii=False, indent=2)

print("Saved to data/gtfs/fujikyu_bus/trip_0114.json")
