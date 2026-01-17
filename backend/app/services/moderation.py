from ..extensions import db
from ..models import MosqueSuggestion, Mosque, MosqueEditSuggestion

APPROVAL_CONFIRMATION_THRESHOLD = 3


def approve_suggestion(s: MosqueSuggestion) -> Mosque:
    m = Mosque(
        arabic_name=s.arabic_name,
        type=s.type,
        governorate=s.governorate,
        delegation=s.delegation,
        city=s.city,
        address=s.address,
        latitude=s.latitude,
        longitude=s.longitude,
        image_url=s.image_url,
        facilities_json=s.facilities_json or {},
        iqama_times_json=s.iqama_times_json or {},
        jumuah_time=s.jumuah_time,
        eid_prayer_time=s.eid_info,  # Mapped from eid_info to eid_prayer_time
        muazzin_name=s.muazzin_name,
        imam_5_prayers_name=s.imam_5_prayers_name,
        imam_jumua_name=s.imam_jumua_name,
        approved=True,
    )
    db.session.add(m)
    s.status = "approved"
    db.session.flush()
    return m


def approve_edit_suggestion(e: MosqueEditSuggestion) -> Mosque:
    """
    Applies the patch from the MosqueEditSuggestion to the target Mosque.
    Also updates the status of the suggestion.
    """
    mosque = Mosque.query.get(e.mosque_id)
    if not mosque:
        # Should we raise/abort? The route handles 404 but if called internally...
        # We'll assume valid mosque_id or fail loudly.
        raise ValueError(f"Mosque {e.mosque_id} not found")

    patch = e.patch_json or {}

    # Map patch fields to Mosque model fields
    # Keys in patch (from schema) -> Keys in Model
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

    for key, value in patch.items():
        if key in mapping:
            setattr(mosque, mapping[key], value)
        elif key in allowed_fields:
            setattr(mosque, key, value)
        # Ignore unknown keys

    e.status = "approved"
    db.session.add(e)
    db.session.add(mosque)
    # No flush needed here if commit is called by caller, but good practice if ID needed
    return mosque
