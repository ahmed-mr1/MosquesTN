CRITERIA_KEYS = {
    "cleanliness",
    "accessibility",
    "women_section",
    "wudu_area",
    "parking",
    "audio_quality",
    "air_conditioning",
}


def sanitize_criteria(criteria: dict | None) -> dict:
    if not isinstance(criteria, dict):
        return {}
    out = {}
    for k, v in criteria.items():
        if not isinstance(k, str):
            continue
        key = k.strip()
        if key not in CRITERIA_KEYS:
            continue
        try:
            iv = int(v)
        except (TypeError, ValueError):
            continue
        if iv < 0:
            iv = 0
        if iv > 5:
            iv = 5
        out[key] = iv
    return out
