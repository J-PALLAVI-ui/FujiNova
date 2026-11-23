import csv
import json

def read_csv(path):
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)

feed_info = read_csv("data/gtfs/fujikyu_bus/feed_info.txt")
agency = read_csv("data/gtfs/fujikyu_bus/agency.txt")
routes = read_csv("data/gtfs/fujikyu_bus/routes.txt")
stops = read_csv("data/gtfs/fujikyu_bus/stops.txt")
calendar = read_csv("data/gtfs/fujikyu_bus/calendar.txt")

summary = {
    "feed_info": feed_info[0] if feed_info else {},
    "agency": agency[0] if agency else {},
    "routes_count": len(routes),
    "stops_count": len(stops),
    "calendar_count": len(calendar),
    "sample_routes": [
        {
            "route_id": r.get("route_id"),
            "route_short_name": r.get("route_short_name"),
            "route_long_name": r.get("route_long_name"),
            "route_color": r.get("route_color"),
            "route_text_color": r.get("route_text_color")
        }
        for r in routes[:15]
    ]
}

with open("data/gtfs/fujikyu_bus/summary.json", "w", encoding="utf-8") as out:
    json.dump(summary, out, ensure_ascii=False, indent=2)

print("Summary written to data/gtfs/fujikyu_bus/summary.json")
print("Routes:", len(routes), "Stops:", len(stops))
