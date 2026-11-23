import json

with open("routes_all.json", encoding="utf-8") as f:
    routes = json.load(f)

keywords = ["周遊", "河口湖", "西湖", "本栖湖", "山中湖", "富士吉田", "富士山駅", "大月"]
matches = []
for r in routes:
    name = r["route_long_name"] or r["route_short_name"]
    for kw in keywords:
        if kw in name:
            matches.append(r)
            break

with open("routes_fuji_filtered.json", "w", encoding="utf-8") as f:
    json.dump(matches, f, ensure_ascii=False, indent=2)

print(f"Matched {len(matches)} relevant routes.")
