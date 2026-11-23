import csv
import json

oishi_stops = []
with open("data/gtfs/fujikyu_bus/stops.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        name = row.get("stop_name", "")
        if "生活館" in name or "大石" in name:
            oishi_stops.append(row)

with open("data/gtfs/fujikyu_bus/oishi_stops.json", "w", encoding="utf-8") as out:
    json.dump(oishi_stops, out, ensure_ascii=False, indent=2)

print(f"Found {len(oishi_stops)} stops matching 生活館 or 大石")
