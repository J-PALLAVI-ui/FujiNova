import csv

with open("data/gtfs/fujikyu_bus/routes.txt", encoding="utf-8") as f:
    routes = list(csv.DictReader(f))

colors = {r["route_id"]: (r["route_short_name"], r["route_long_name"], r["route_color"]) for r in routes if r.get("route_color")}
print(f"Routes with route_color defined: {len(colors)}")

# Check route 44511 (Kawaguchiko to Oishi Park) and sightseeing routes
for r in routes:
    if "445" in r["route_id"] or "周遊" in r.get("route_long_name", ""):
        print(f"Route {r.get('route_id')}: short='{r.get('route_short_name')}', long='{r.get('route_long_name')}', color='{r.get('route_color')}'")
