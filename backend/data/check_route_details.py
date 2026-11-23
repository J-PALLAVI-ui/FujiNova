import csv

trip_id = "0114_04_01_01_0900"
route_id = None
service_id = None

with open("data/gtfs/fujikyu_bus/trips.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["trip_id"] == trip_id:
            route_id = row["route_id"]
            service_id = row["service_id"]
            break

route_info = None
with open("data/gtfs/fujikyu_bus/routes.txt", "r", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["route_id"] == route_id:
            route_info = row
            break

print("TRIP:", trip_id)
print("SERVICE_ID:", service_id)
print("ROUTE_INFO:", route_info)
