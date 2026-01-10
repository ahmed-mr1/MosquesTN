import re

_TIME_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")

PRAYER_KEYS = ("fajr", "dhuhr", "asr", "maghrib", "isha")


def sanitize_times(data: dict | None) -> dict:
    if not isinstance(data, dict):
        return {}
    out = {}
    for key in PRAYER_KEYS:
        v = data.get(key)
        if isinstance(v, str) and _TIME_RE.match(v.strip()):
            out[key] = v.strip()
    return out


def valid_time_str(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    return s if _TIME_RE.match(s) else None
