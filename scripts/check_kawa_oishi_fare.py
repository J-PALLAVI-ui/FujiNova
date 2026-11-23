import csv
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("data/gtfs/fujikyu_bus/stops.txt", encoding="utf-8") as f:
    stops = {s["stop_id"]: s for s in csv.DictReader(f)}

kawa = stops.get("0025_01")
oishi = stops.get("1857_01")
print(f"Kawaguchiko stop: {kawa['stop_name']}, zone_id: {kawa.get('zone_id')}")
print(f"Oishi stop: {oishi['stop_name']}, zone_id: {oishi.get('zone_id')}")

origin_zone = kawa.get("zone_id")
dest_zone = oishi.get("zone_id")

with open("data/gtfs/fujikyu_bus/fare_attributes.txt", encoding="utf-8") as f:
    fares = {row["fare_id"]: row["price"] for row in csv.DictReader(f)}

matched_rules = []
with open("data/gtfs/fujikyu_bus/fare_rules.txt", encoding="utf-8") as f:
    for rule in csv.DictReader(f):
        if rule["origin_id"] == origin_zone and rule["destination_id"] == dest_zone:
            matched_rules.append(rule)

print(f"Matched fare rules: {len(matched_rules)}")
for m in matched_rules[:10]:
    fare_val = fares.get(m["fare_id"])
    print(f"Route: {m.get('route_id')}, Fare ID: {m.get('fare_id')}, Price: {fare_val} JPY")
