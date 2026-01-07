from flask_smorest import Blueprint
from ..extensions import db
from ..models import MosqueSuggestion
from ..services.moderation import approve_suggestion
from ..schemas.suggestion import MosqueSuggestionSchema


moderation_bp = Blueprint(
    "moderation", __name__, url_prefix="/moderation", description="Moderator actions"
)


@moderation_bp.route("/suggestions/<int:suggestion_id>/approve", methods=["POST"])
@moderation_bp.response(200, MosqueSuggestionSchema)
def approve_suggestion_route(suggestion_id: int):
    s = MosqueSuggestion.query.get_or_404(suggestion_id)
    if s.status != "approved":
        approve_suggestion(s)
        db.session.commit()
    return s


@moderation_bp.route("/suggestions/<int:suggestion_id>/reject", methods=["POST"])
@moderation_bp.response(200, MosqueSuggestionSchema)
def reject_suggestion_route(suggestion_id: int):
    s = MosqueSuggestion.query.get_or_404(suggestion_id)
    s.status = "rejected"
    db.session.commit()
    return s
