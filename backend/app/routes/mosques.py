from math import cos, radians
from flask_smorest import Blueprint
from ..models import Mosque
from ..schemas.mosque import MosqueSchema, MosqueListQuerySchema, NearbyQuerySchema

mosques_bp = Blueprint(
    "mosques", __name__, url_prefix="/mosques", description="Approved mosques read endpoints"
)


@mosques_bp.route("")
@mosques_bp.arguments(MosqueListQuerySchema, location="query")
@mosques_bp.response(200, MosqueSchema(many=True))
def list_mosques(args):
    query = Mosque.query.filter_by(approved=True)
    governorate = args.get("governorate")
    city = args.get("city")
    mtype = args.get("type")

    if governorate:
        query = query.filter(Mosque.governorate.ilike(f"%{governorate}%"))
    if city:
        query = query.filter(Mosque.city.ilike(f"%{city}%"))
    if mtype:
        query = query.filter(Mosque.type == mtype)

    limit = min(int(args.get("limit", 20)), 100)
    offset = int(args.get("offset", 0))
    items = query.offset(offset).limit(limit).all()
    return items


@mosques_bp.route("/<int:mosque_id>")
@mosques_bp.response(200, MosqueSchema)
def get_mosque(mosque_id: int):
    m = Mosque.query.filter_by(id=mosque_id, approved=True).first()
    if not m:
        mosques_bp.abort(404, message="Mosque not found")
    return m


@mosques_bp.route("/nearby")
@mosques_bp.arguments(NearbyQuerySchema, location="query")
@mosques_bp.response(200, MosqueSchema(many=True))
def nearby_mosques(args):
    lat = args["lat"]
    lng = args["lng"]
    radius_km = args.get("radius", 5)

    dlat = radius_km / 111.0
    dlng = radius_km / (111.0 * max(cos(radians(lat)), 0.0001))

    min_lat = lat - dlat
    max_lat = lat + dlat
    min_lng = lng - dlng
    max_lng = lng + dlng

    candidates = (
        Mosque.query.filter_by(approved=True)
        .filter(Mosque.latitude.between(min_lat, max_lat))
        .filter(Mosque.longitude.between(min_lng, max_lng))
        .all()
    )

    def haversine_km(lat1, lon1, lat2, lon2):
        from math import radians, sin, cos, sqrt, atan2

        R = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c

    inside = []
    for m in candidates:
        if m.latitude is None or m.longitude is None:
            continue
        dist = haversine_km(lat, lng, m.latitude, m.longitude)
        if dist <= radius_km:
            inside.append(m)
    return inside
