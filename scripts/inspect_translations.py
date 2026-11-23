import csv
import json

with open("data/gtfs/fujikyu_bus/translations.txt", encoding="utf-8") as f:
    r = list(csv.DictReader(f))

field_names = set(row.get("field_name") for row in r)
table_names = set(row.get("table_name") for row in r)

sample = r[:20]
with open("translations_sample.json", "w", encoding="utf-8") as f:
    json.dump({"field_names": list(field_names), "table_names": list(table_names), "sample": sample}, f, indent=2, ensure_ascii=False)

print("Translations inspected.")
