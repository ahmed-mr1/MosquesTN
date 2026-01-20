from typing import Any, Dict, List



# Expanded to match all keys used by the mobile app
FACILITY_OPTIONS: List[Dict[str, str]] = [
    {"key": "women_section", "label": "Women's Section"},
    {"key": "wudu", "label": "Wudu Area"},
    {"key": "men_bathrooms", "label": "Men's Bathrooms"},
    {"key": "women_bathrooms", "label": "Women's Bathrooms"},
    {"key": "parking", "label": "Parking"},
    {"key": "accessibility", "label": "Accessible"},
    {"key": "ac", "label": "A/C"},
    {"key": "library", "label": "Library"},
    {"key": "quran_school", "label": "Quran School"},
    {"key": "daily_prayers", "label": "Daily Prayers"},
    {"key": "jumua_prayer", "label": "Jumuah Prayer"},
    {"key": "morgue", "label": "Funeral Prayer"},
]

FACILITY_KEYS = {item["key"] for item in FACILITY_OPTIONS}


def sanitize_facilities(payload: Dict[str, Any] | None) -> Dict[str, bool]:
    """Whitelist and coerce facility flags to booleans. Unknown keys are dropped."""
    result: Dict[str, bool] = {}
    if not payload or not isinstance(payload, dict):
        return result
    for key in FACILITY_KEYS:
        value = payload.get(key, False)
        result[key] = bool(value)
    return result
