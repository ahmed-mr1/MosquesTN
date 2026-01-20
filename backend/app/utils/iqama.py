import re

_TIME_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
_MINUTES_RE = re.compile(r"^\d+$")

PRAYER_KEYS = ("fajr", "dhuhr", "asr", "maghrib", "isha")


def sanitize_times(data: dict | None) -> dict:
    if not isinstance(data, dict):
        return {}
    out = {}
    for key in PRAYER_KEYS:
        v = data.get(key)
        if not v:
            continue
        if isinstance(v, str):
            v_str = v.strip()
            # Accept both HH:MM format and numeric minutes format
            if _TIME_RE.match(v_str) or _MINUTES_RE.match(v_str):
                out[key] = v_str
        elif isinstance(v, int):
            # Accept numeric values (minutes) and convert to string
            out[key] = str(v)
    return out


def valid_time_str(s: str | None) -> str | None:
    if not s:
        return None
    s_str = str(s).strip()
    # Accept both HH:MM format and numeric minutes
    return s_str if (_TIME_RE.match(s_str) or _MINUTES_RE.match(s_str)) else None

