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
        neighborhood=s.neighborhood,
        address=s.address,
        latitude=s.latitude,
        longitude=s.longitude,
        facilities_json=s.facilities_json or {},
        facilities_details=s.facilities_details,
        jumuah_time=s.jumuah_time,
        eid_info=s.eid_info,
        approved=True,
    )
    db.session.add(m)
    s.status = "approved"
    db.session.flush()
    return m


# Iqama approval removed; handled via generic mosque edit approvals.
