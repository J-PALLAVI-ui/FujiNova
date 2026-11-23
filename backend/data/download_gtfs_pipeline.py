import os
import zipfile
import httpx

output_dir = "data/gtfs/fujikyu_bus"
os.makedirs(output_dir, exist_ok=True)
zip_path = os.path.join(output_dir, "gtfs.zip")

print("Downloading Fujikyu Bus GTFS-JP from https://gtfs-jp.buskita.com/fjb/gtfs.zip ...")
r = httpx.get("https://gtfs-jp.buskita.com/fjb/gtfs.zip", timeout=45.0, follow_redirects=True)
if r.status_code != 200:
    raise RuntimeError(f"Download failed with status {r.status_code}")

with open(zip_path, "wb") as f:
    f.write(r.content)
print(f"Saved {len(r.content)} bytes to {zip_path}")

with zipfile.ZipFile(zip_path, 'r') as zf:
    zf.extractall(output_dir)
print("Extracted all files to", output_dir)

# Inspect feed_info.txt
feed_info_path = os.path.join(output_dir, "feed_info.txt")
if os.path.exists(feed_info_path):
    with open(feed_info_path, "r", encoding="utf-8-sig") as f:
        print("\n--- FEED INFO ---")
        print(f.read())

# Inspect agency.txt
agency_path = os.path.join(output_dir, "agency.txt")
if os.path.exists(agency_path):
    with open(agency_path, "r", encoding="utf-8-sig") as f:
        print("\n--- AGENCY ---")
        for line in f:
            print(line.strip())

# Inspect routes.txt sample
routes_path = os.path.join(output_dir, "routes.txt")
if os.path.exists(routes_path):
    with open(routes_path, "r", encoding="utf-8-sig") as f:
        print("\n--- SAMPLE ROUTES ---")
        for i, line in enumerate(f):
            if i < 15:
                print(line.strip())
