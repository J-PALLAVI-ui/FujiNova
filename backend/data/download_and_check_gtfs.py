import httpx
import zipfile
import io

feeds = {
    'fjb': 'https://gtfs-jp.buskita.com/fjb/gtfs.zip',
    'fxc': 'https://gtfs-jp.buskita.com/fxc/gtfs.zip'
}

for name, url in feeds.items():
    print(f"\n--- Checking feed {name}: {url} ---")
    try:
        r = httpx.get(url, timeout=30.0, follow_redirects=True)
        print(f"Status: {r.status_code}, Length: {len(r.content)} bytes")
        if r.status_code == 200:
            zf = zipfile.ZipFile(io.BytesIO(r.content))
            print("Files in ZIP:")
            for info in zf.infolist():
                print(f"  - {info.filename}: {info.file_size} bytes")
            # Peek agency.txt and feed_info.txt
            if 'agency.txt' in zf.namelist():
                print("agency.txt sample:\n", zf.read('agency.txt').decode('utf-8-sig', errors='replace')[:300])
            if 'feed_info.txt' in zf.namelist():
                print("feed_info.txt sample:\n", zf.read('feed_info.txt').decode('utf-8-sig', errors='replace'))
    except Exception as e:
        print(f"Error checking {name}: {e}")
