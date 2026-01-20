from ..extensions import db
from ..models import MosqueSuggestion, Mosque, MosqueEditSuggestion

APPROVAL_CONFIRMATION_THRESHOLD = 3


def approve_suggestion(s: MosqueSuggestion) -> Mosque:
    # Helper to truncate strings if they exceed DB limits (generic safety)
    def clean_str(val, limit=255, default=None):
        if val is None:
            return default
        try:
            val_str = str(val).strip()
            # If string is literally "null" or empty, return default
            if not val_str or val_str.lower() == 'null':
                return default
            return val_str[:limit]
        except:
            return default
    
    def safe_float(val):
        try:
            if val is None: return None
            f = float(val)
            # Check for NaN or Infinity
            import math
            if math.isnan(f) or math.isinf(f): return None
            return f
        except:
            return None

    def safe_json(val):
        if isinstance(val, dict): return val
        return {}

    # Strict fallback for governorate
    gov = clean_str(s.governorate, 100, "Unknown")
    
    # Force coordinates to valid floats or 0.0 if not available (to satisfy potential NOT NULL)
    lat = safe_float(s.latitude) 
    if lat is None: lat = 0.0
    
    lng = safe_float(s.longitude)
    if lng is None: lng = 0.0
    
    from ..utils.facilities import sanitize_facilities
    sanitized_facilities = sanitize_facilities(safe_json(s.facilities_json))
    m = Mosque(
        arabic_name=clean_str(s.arabic_name, 200, "New Mosque"),
        type=clean_str(s.type, 40, "Masjid"),
        governorate=gov,
        delegation=clean_str(s.delegation, 100),
        city=clean_str(s.city, 100),
        address=clean_str(s.address, 200),
        latitude=lat,
        longitude=lng,
        image_url=clean_str(s.image_url, 450),
        facilities_json=sanitized_facilities,
        iqama_times_json=safe_json(s.iqama_times_json),
        jumuah_time=clean_str(s.jumuah_time, 20),
        eid_prayer_time=clean_str(s.eid_info, 200),  
        muazzin_name=clean_str(s.muazzin_name, 100),
        imam_5_prayers_name=clean_str(s.imam_5_prayers_name, 100),
        imam_jumua_name=clean_str(s.imam_jumua_name, 100),
        approved=True
    )
    
    db.session.add(m)
    # Update Status
    s.status = "approved"
    
    # We leave the commit/flush to the caller to handle transaction bounds
    return m


def approve_edit_suggestion(e: MosqueEditSuggestion) -> Mosque:
    """
    Applies the patch from the MosqueEditSuggestion to the target Mosque.
    Also updates the status of the suggestion.
    """
    mosque = Mosque.query.get(e.mosque_id)
    if not mosque:
        raise ValueError(f"Mosque {e.mosque_id} not found")

    patch = e.patch_json or {}

    # Map patch fields to Mosque model fields
    mapping = {
        'facilities': 'facilities_json',
        'iqama_times': 'iqama_times_json',
        'eid_info': 'eid_prayer_time'
    }

    allowed_fields = [
        'arabic_name', 'type', 'governorate', 'delegation', 'city', 'address',
        'latitude', 'longitude', 'image_url', 'jumuah_time',
        'muazzin_name', 'imam_5_prayers_name', 'imam_jumua_name'
    ]
    
    # Generic safety truncation helper
    def clean_val(k, v):
        if v is None: return None
        # truncate strings
        if k in ['arabic_name', 'address', 'eid_info', 'eid_prayer_time']: return str(v)[:255]
        if k == 'image_url': return str(v)[:500]
        if k in ['muazzin_name', 'imam_5_prayers_name', 'imam_jumua_name', 'type', 'city', 'delegation', 'governorate']: return str(v)[:120]
        if k == 'jumuah_time': return str(v)[:20]
        return v

    for key, value in patch.items():
        if key in mapping:
            target_key = mapping[key]
            # Ensure JSON fields are dicts
            if target_key.endswith('_json') and not isinstance(value, dict):
                 value = {} 
            setattr(mosque, target_key, value)
        elif key in allowed_fields:
            safe_val = clean_val(key, value)
            setattr(mosque, key, safe_val)
        # Ignore unknown keys

    e.status = "approved"
    db.session.add(e)
    db.session.add(mosque)
    return mosque
