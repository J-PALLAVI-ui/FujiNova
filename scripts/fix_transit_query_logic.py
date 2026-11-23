with open("backend/app/agent/hana.py", "r", encoding="utf-8") as f:
    code = f.read()

start_marker = "    def extract_transit_query(self, text: str) -> Optional[Tuple[str, str]]:"
end_marker = "    def query_grounded_places(self, state: HanaState, limit: int = 4) -> List[Dict[str, Any]]:"

idx_start = code.find(start_marker)
idx_end = code.find(end_marker)

if idx_start != -1 and idx_end != -1:
    new_func = """    def extract_transit_query(self, text: str) -> Optional[Tuple[str, str]]:
        \"\"\"Extracts origin and destination from transport/directions questions.\"\"\"
        lower = text.lower()
        transit_keywords = ["bus", "train", "reach", "get to", "go to", "how do i", "how to", "route", "direction", "fare", "ticket", "line"]
        if not any(kw in lower for kw in transit_keywords):
            return None

        # Pattern 1: "from X to Y" (e.g. "from Fujiyoshida to Lake Kawaguchiko")
        m1 = re.search(r"from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+to\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m1:
            orig, dest = m1.group(1).strip(), m1.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest

        # Pattern 2: "reach/get to/go to/travel to/to Y from X" (e.g. "How do I reach Lake Kawaguchiko from Fujiyoshida?")
        m2 = re.search(r"(?:reach|get to|go to|travel to|take(?:\\s+\\w+)*\\s+to|to)\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)\\s+from\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
        if m2:
            dest, orig = m2.group(1).strip(), m2.group(2).strip()
            if orig and dest and orig.lower() != dest.lower():
                return orig, dest

        # Pattern 3: "how do I get to/reach Y" without "from" (defaults origin to Kawaguchiko Station)
        if "from " not in lower:
            m3 = re.search(r"(?:reach|get to|go to|travel to|visit|to)\\s+([A-Za-z0-9\\s\\u3000-\\u30ff\\u4e00-\\u9faf]+?)(?:\\?|$|\\.|\\,)", text, re.IGNORECASE)
            if m3:
                dest = m3.group(1).strip()
                if dest and dest.lower() not in ["there", "here", "somewhere"]:
                    return "Kawaguchiko Station", dest

        return None

"""
    code = code[:idx_start] + new_func + code[idx_end:]
    with open("backend/app/agent/hana.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Successfully replaced extract_transit_query.")
else:
    print(f"Markers not found: start={idx_start}, end={idx_end}")
