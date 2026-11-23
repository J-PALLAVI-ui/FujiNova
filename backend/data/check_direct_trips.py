import csv
import json

trips_with_both = {}
trip_stops = {}

with open("data/gtfs/fujikyu_bus/stop_times.txt", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        tid = row["trip_id"]
        sid = row["stop_id"]
        if tid not in trip_stops:
            trip_stops[tid] = []
        trip_stops[tid].append((sid, row["departure_time"], int(row["stop_sequence"])))

found = []
for tid, stops_list in trip_stops.items():
    stops_dict = {s[0]: (s[1], s[2]) for s in stops_list}
    # Check if trip visits any Kawaguchiko station stop and Oishi/Natural Living Center stop
    kawa_stops = [s for s in stops_dict if "0025_" in s]
    oishi_stops = [s for s in stops_dict if "1857_" in s]
    if kawa_stops and oishi_stops:
        k_time, k_seq = stops_dict[kawa_stops[0]]
        o_time, o_seq = stops_dict[oishi_stops[0]]
        if k_seq < o_seq:
            found.append({
                "trip_id": tid,
                "depart_kawaguchiko": k_time,
                "arrive_oishi": o_time,
                "stop_count": o_seq - k_seq + 1
            })

found.sort(key=lambda x: x["depart_kawaguchiko"])
print(f"Total trips from Kawaguchiko to Oishi: {len(found)}")
with open("data/gtfs/fujikyu_bus/kawa_to_oishi_trips.json", "w", encoding="utf-8") as out:
    json.dump(found[:20], out, indent=2)
print("Saved to data/gtfs/fujikyu_bus/kawa_to_oishi_trips.json")
