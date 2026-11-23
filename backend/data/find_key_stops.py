import csv
import json

translations = {}
try:
    with open("data/gtfs/fujikyu_bus/translations.txt", "r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if row.get("table_name") == "stops" and row.get("field_name") == "stop_name":
                translations[row["field_value"]] = row["translation"]
except Exception:
    pass

stops = []
with open("data/gtfs/fujikyu_bus/stops.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        name = row.get("stop_name", "")
        if any(kw in name for kw in ["河口湖駅", "富士山駅", "生活館", "大石", "新倉", "下吉田", "忍野", "山中湖", "本栖湖"]):
            stops.append({
                "stop_id": row["stop_id"],
                "stop_name": row["stop_name"],
                "stop_name_en": translations.get(name, ""),
                "stop_lat": float(row["stop_lat"]),
                "stop_lon": float(row["stop_lon"])
            })

with open("data/gtfs/fujikyu_bus/key_stops.json", "w", encoding="utf-8") as out:
    json.dump(stops, out, ensure_ascii=False, indent=2)

print(f"Saved {len(stops)} stops to data/gtfs/fujikyu_bus/key_stops.json")
