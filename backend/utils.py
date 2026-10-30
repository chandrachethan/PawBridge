import re
from datetime import date


def parse_age_months(text):
    m = re.search(r"(\d+(?:\.\d+)?)\s*([a-z]*)", (text or "").lower())
    if not m:
        return None
    n, unit = float(m.group(1)), m.group(2)
    if unit == "" or unit.startswith("y"):
        return int(n * 12)
    if unit.startswith("m"):
        return int(n)
    return 0


def is_indie(breed):
    b = (breed or "").lower()
    return "indie" in b or "street" in b


def today_iso():
    return date.today().isoformat()
