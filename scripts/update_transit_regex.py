with open("backend/app/agent/hana.py", "r", encoding="utf-8") as f:
    code = f.read()

old_pat2 = """        # Pattern 2: "reach/get to/go to Y from X"
        m2 = re.search(r"(?:reach|get to|go to|travel to)\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m2:
            dest, orig = m2.group(1).strip(), m2.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest"""

new_pat2 = """        # Pattern 2: "to Y from X" (e.g. "Which bus to Oishi Park from Kawaguchiko Station")
        m2 = re.search(r"to\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m2:
            dest, orig = m2.group(1).strip(), m2.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest"""

if old_pat2 in code:
    code = code.replace(old_pat2, new_pat2)
else:
    # normalize newlines
    code = code.replace("\r\n", "\n")
    old_pat2_norm = old_pat2.replace("\r\n", "\n")
    new_pat2_norm = new_pat2.replace("\r\n", "\n")
    code = code.replace(old_pat2_norm, new_pat2_norm)

with open("backend/app/agent/hana.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated extract_transit_query in hana.py.")
