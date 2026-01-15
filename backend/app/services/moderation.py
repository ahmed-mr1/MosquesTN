from ..extensions import db
from ..models import MosqueSuggestion, Mosque

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
        eid_info=s.eid_info,
        muazzin_name=s.muazzin_name,
        imam_5_prayers_name=s.imam_5_prayers_name,
        imam_jumua_name=s.imam_jumua_name,
        approved=True,
    )
    db.session.add(m)
    s.status = "approved"
    db.session.flush()
    return m


# Iqama approval removed; handled via generic mosque edit approvals.
