import csv
import json

with open("data/gtfs/fujikyu_bus/fare_attributes.txt", encoding="utf-8") as f:
    attrs = list(csv.DictReader(f))

with open("data/gtfs/fujikyu_bus/fare_rules.txt", encoding="utf-8") as f:
    rules = list(csv.DictReader(f))

print(f"Fare attributes: {len(attrs)}, sample:")
sample_attrs = attrs[:5]

print(f"Fare rules: {len(rules)}, sample:")
sample_rules = rules[:5]

with open("fare_sample.json", "w", encoding="utf-8") as f:
    json.dump({"attrs": sample_attrs, "rules": sample_rules, "attr_count": len(attrs), "rule_count": len(rules)}, f, indent=2, ensure_ascii=False)

print("Fare sample written.")
