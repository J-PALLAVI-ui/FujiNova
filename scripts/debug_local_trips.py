import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")

from backend.app.services.routing.routing_service import get_routing_service

svc = get_routing_service()
# Inspect trips on rail_fujikyu_local
local_trips = [tid for tid, tr in svc.trips.items() if tr.route_id == "rail_fujikyu_local"]
print(f"Total local trips: {len(local_trips)}")
for tid in local_trips:
    st_map = svc.trip_stop_times[tid]
    otsuki_st = [st for st in st_map if st.stop_id == "rail_otsuki"]
    kawa_st = [st for st in st_map if st.stop_id == "rail_kawaguchiko"]
    if otsuki_st and kawa_st:
        print(f"  {tid}: dir={svc.trips[tid].direction_id} Otsuki={otsuki_st[0].departure_time_sec} Kawa={kawa_st[0].arrival_time_sec}")
