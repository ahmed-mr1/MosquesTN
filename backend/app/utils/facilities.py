from typing import Any, Dict, List


FACILITY_OPTIONS: List[Dict[str, str]] = [
    {"key": "women_section", "label": "Women section"},
    {"key": "wudu", "label": "Ablution (Wudu)"},
    {"key": "toilets", "label": "Toilets"},
    {"key": "parking", "label": "Parking"},
    {"key": "accessibility", "label": "Wheelchair accessible"},
    {"key": "heating_cooling", "label": "AC/Heating"},
    {"key": "library", "label": "Library"},
    {"key": "education_rooms", "label": "Education rooms"},
    {"key": "funeral_service", "label": "Funeral service"},
    {"key": "ramadan_iftaar", "label": "Ramadan Iftaar"},
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
