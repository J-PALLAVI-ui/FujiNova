import csv
import json

with open("data/gtfs/fujikyu_bus/routes.txt", encoding="utf-8") as f:
    routes = list(csv.DictReader(f))

results = []
for r in routes:
    results.append({
        "route_id": r.get("route_id"),
        "route_short_name": r.get("route_short_name"),
        "route_long_name": r.get("route_long_name"),
        "route_color": r.get("route_color"),
        "route_text_color": r.get("route_text_color")
    })

with open("routes_all.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Total routes exported: {len(results)}")
