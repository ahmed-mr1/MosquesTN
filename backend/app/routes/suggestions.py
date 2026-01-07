from flask_smorest import Blueprint
from flask.views import MethodView
from ..extensions import db
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
    def post(self, data):
        name = (data.get("name") or "").strip()
        governorate = (data.get("governorate") or "").strip()
        if not name or not governorate:
            suggestions_bp.abort(400, message="'name' and 'governorate' are required")

        facilities = sanitize_facilities(data.get("facilities"))

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
        )

        db.session.add(s)
        db.session.commit()
        return s
