from flask_smorest import Blueprint, abort
from flask.views import MethodView
from ..extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import MosqueSuggestion
from ..utils.facilities import sanitize_facilities
from ..schemas.suggestion import MosqueSuggestionCreateSchema, MosqueSuggestionSchema


suggestions_bp = Blueprint(
    "suggestions",
    __name__,
    url_prefix="/suggestions",
    description="Endpoints for mosque suggestions",
)


@suggestions_bp.route("/mosques")
class MosqueSuggestionsResource(MethodView):
    @suggestions_bp.arguments(MosqueSuggestionCreateSchema)
    @suggestions_bp.response(201, MosqueSuggestionSchema)
    @jwt_required()
    def post(self, data):
        name = (data.get("name") or "").strip()
        governorate = (data.get("governorate") or "").strip()
        if not name or not governorate:
            abort(400, message="'name' and 'governorate' are required")

        facilities = sanitize_facilities(data.get("facilities"))

        identity = get_jwt_identity()
        try:
            created_by_user_id = int(identity)
        except (TypeError, ValueError):
            abort(401, message="Invalid token identity")

        s = MosqueSuggestion(
            name=name,
            arabic_name=data.get("arabic_name"),
            type=data.get("type"),
            governorate=governorate,
            delegation=data.get("delegation"),
            city=data.get("city"),
            neighborhood=data.get("neighborhood"),
            address=data.get("address"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            facilities_json=facilities,
            facilities_details=data.get("facilities_details"),
            created_by_user_id=created_by_user_id,
        )

        db.session.add(s)
        db.session.commit()
        return s
