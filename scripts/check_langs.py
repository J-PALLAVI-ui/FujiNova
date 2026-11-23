import csv

with open("data/gtfs/fujikyu_bus/translations.txt", encoding="utf-8") as f:
    langs = set(row.get("language") for row in csv.DictReader(f))
    print("Languages in translations:", langs)
