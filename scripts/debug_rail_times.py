import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding="utf-8")
from backend.app.services.routing.railway_timetable import get_railway_data
from backend.app.services.routing.gtfs_loader import format_sec_to_time

stops, routes, trips, trip_stop_times = get_railway_data()
for tid, st_list in list(trip_stop_times.items())[:3]:
    print(f"\nTrip: {tid} ({trips[tid].trip_headsign})")
    for st in [st_list[0], st_list[1], st_list[-1]]:
        print(f"  {st.stop_id}: arr={format_sec_to_time(st.arrival_time_sec)} dep={format_sec_to_time(st.departure_time_sec)}")
