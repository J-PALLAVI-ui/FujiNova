import csv
import json

routes = []
with open("data/gtfs/fujikyu_bus/routes.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        name = row.get("route_long_name", "") + " " + row.get("route_short_name", "")
        if any(kw in name for kw in ["河口湖", "西湖", "本栖", "精進", "周遊", "Red", "Green", "Blue", "大石", "富士"]):
            routes.append({
                "route_id": row["route_id"],
                "route_short_name": row["route_short_name"],
                "route_long_name": row["route_long_name"],
                "route_color": row.get("route_color"),
                "route_text_color": row.get("route_text_color")
            })

print(f"Found {len(routes)} sightseeing/fuji routes.")
with open("data/gtfs/fujikyu_bus/sightseeing_routes.json", "w", encoding="utf-8") as out:
    json.dump(routes[:30], out, ensure_ascii=False, indent=2)

print("Saved sample to data/gtfs/fujikyu_bus/sightseeing_routes.json")
