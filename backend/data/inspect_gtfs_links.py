import httpx
import re

r = httpx.get('https://bus.fujikyu.co.jp/rosen/gtfs', timeout=15.0, follow_redirects=True)
all_links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', r.text)
matching = [l for l in all_links if 'gtfs' in l.lower() or 'zip' in l.lower() or '.csv' in l.lower()]
print("MATCHING LINKS ON OFFICIAL PAGE:")
for l in matching:
    print(" -", l)
