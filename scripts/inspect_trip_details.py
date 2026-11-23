import csv
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

gtfs_dir = "data/gtfs/fujikyu_bus"

# 1. Load translations
translations = {}
with open(f"{gtfs_dir}/translations.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row.get("language") == "en":
            val = row.get("field_value") or row.get("record_id")
            if val:
                translations[val] = row.get("translation")

# 2. Load stops
stops = {}
with open(f"{gtfs_dir}/stops.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        sid = row["stop_id"]
        stops[sid] = {
            "stop_id": sid,
            "stop_name_ja": row.get("stop_name"),
            "stop_name_en": translations.get(row.get("stop_name"), row.get("stop_name")),
            "stop_lat": row.get("stop_lat"),
            "stop_lon": row.get("stop_lon"),
            "zone_id": row.get("zone_id")
        }

# 3. Load trip 0114_04_01_01_0900
target_trip_id = "0114_04_01_01_0900"
trip_info = None
with open(f"{gtfs_dir}/trips.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["trip_id"] == target_trip_id:
            trip_info = row
            break

# 4. Load stop times for this trip
trip_stop_times = []
with open(f"{gtfs_dir}/stop_times.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["trip_id"] == target_trip_id:
            trip_stop_times.append(row)

trip_stop_times.sort(key=lambda x: int(x["stop_sequence"]))

# 5. Load route
route_info = None
if trip_info:
    with open(f"{gtfs_dir}/routes.txt", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["route_id"] == trip_info["route_id"]:
                route_info = row
                break

# 6. Check calendar validity for November 9, 2026 (a Monday)
target_date = "20261109"
service_id = trip_info.get("service_id") if trip_info else None
cal_valid = False
cal_row = None
with open(f"{gtfs_dir}/calendar.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["service_id"] == service_id:
            cal_row = row
            if row.get("start_date") <= target_date <= row.get("end_date"):
                # 2026-11-09 is Monday
                if row.get("monday") == "1":
                    cal_valid = True
            break

# Check calendar_dates.txt exceptions
cal_exception = None
with open(f"{gtfs_dir}/calendar_dates.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["service_id"] == service_id and row["date"] == target_date:
            cal_exception = row
            if row["exception_type"] == "1":
                cal_valid = True
            elif row["exception_type"] == "2":
                cal_valid = False

# 7. Check fare for boarding stop (0025_01) to alighting stop (1857_01)
boarding_zone = stops["0025_01"]["zone_id"]
alighting_zone = stops["1857_01"]["zone_id"]

fare_prices = {}
with open(f"{gtfs_dir}/fare_attributes.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        fare_prices[row["fare_id"]] = row["price"]

matched_fares = []
with open(f"{gtfs_dir}/fare_rules.txt", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row.get("origin_id") == boarding_zone and row.get("destination_id") == alighting_zone:
            fid = row.get("fare_id")
            matched_fares.append({
                "fare_id": fid,
                "route_id": row.get("route_id"),
                "price_jpy": fare_prices.get(fid)
            })

# Format and output results
print("=================================================================")
print(f"GTFS RECORD INSPECTION: Trip '{target_trip_id}'")
print("=================================================================")
if trip_info:
    print(f"Trip ID:           {trip_info['trip_id']}")
    print(f"Route ID:          {trip_info['route_id']}")
    print(f"Service ID:        {trip_info['service_id']}")
    print(f"Trip Headsign:     '{trip_info.get('trip_headsign', '')}' (Translation: '{translations.get(trip_info.get('trip_headsign', ''), '')}')")
    print(f"Direction ID:      {trip_info.get('direction_id', '0')}")
if route_info:
    print(f"Route Short Name:  '{route_info.get('route_short_name', '')}'")
    print(f"Route Long Name:   '{route_info.get('route_long_name', '')}'")
    print(f"Route Color Hex:   '{route_info.get('route_color', '')}' (Missing in GTFS: {'YES' if not route_info.get('route_color') else 'NO'})")

print("\n--- 1. Boarding Stop ---")
first_st = trip_stop_times[0]
first_stop_obj = stops[first_st["stop_id"]]
print(f"Stop ID:           {first_stop_obj['stop_id']}")
print(f"Japanese Name:     {first_stop_obj['stop_name_ja']}")
print(f"English Name:      {first_stop_obj['stop_name_en']}")
print(f"Departure Time:    {first_st['departure_time']}")

print("\n--- 2. Alighting Stop ---")
last_st = trip_stop_times[-1]
last_stop_obj = stops[last_st["stop_id"]]
print(f"Stop ID:           {last_stop_obj['stop_id']}")
print(f"Japanese Name:     {last_stop_obj['stop_name_ja']}")
print(f"English Name:      {last_stop_obj['stop_name_en']}")
print(f"Arrival Time:      {last_st['arrival_time']}")

print(f"\n--- 3. Intermediate Stops ({len(trip_stop_times) - 2} stops) ---")
for idx, st in enumerate(trip_stop_times[1:-1], start=1):
    s_obj = stops[st["stop_id"]]
    print(f"  {idx:02d}. [{s_obj['stop_id']}] {s_obj['stop_name_en']} ({s_obj['stop_name_ja']}) - Arr: {st['arrival_time']}")

print("\n--- 4. Fare Information in Feed ---")
print(f"Origin Zone:       {boarding_zone} ({first_stop_obj['stop_name_ja']})")
print(f"Destination Zone:  {alighting_zone} ({last_stop_obj['stop_name_ja']})")
print(f"Fare Rules Found:  {len(matched_fares)}")
for mf in matched_fares:
    print(f"  - Fare ID: {mf['fare_id']} | Route ID: {mf['route_id']} | Price: {mf['price_jpy']} JPY")

print("\n--- 5. Calendar Validity for November 9, 2026 ---")
print(f"Service ID:        {service_id}")
if cal_row:
    print(f"Validity Period:   {cal_row.get('start_date')} to {cal_row.get('end_date')}")
    print(f"Monday Active:     {cal_row.get('monday') == '1'}")
print(f"Calendar Dates Exception: {cal_exception}")
print(f"Active on 2026-11-09:     {cal_valid}")
print("=================================================================")
