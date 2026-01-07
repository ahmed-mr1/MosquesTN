from flask_smorest import Blueprint
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import MosqueSuggestion, SuggestionConfirmation
from ..services.moderation import approve_suggestion, APPROVAL_CONFIRMATION_THRESHOLD
from ..schemas.suggestion import MosqueSuggestionSchema


confirmations_bp = Blueprint(
    "confirmations", __name__, url_prefix="/suggestions", description="Suggestion confirmations"
)


@confirmations_bp.route("/<int:suggestion_id>/confirmations", methods=["POST"])
@confirmations_bp.response(201, MosqueSuggestionSchema)
def add_confirmation(suggestion_id: int):
    s = MosqueSuggestion.query.get_or_404(suggestion_id)
    c = SuggestionConfirmation(suggestion_id=s.id, user_id=None)
    mosque = None
    try:
        db.session.add(c)
        s.confirmations_count = (s.confirmations_count or 0) + 1
        if s.confirmations_count >= APPROVAL_CONFIRMATION_THRESHOLD and s.status not in ("approved", "rejected"):
            mosque = approve_suggestion(s)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        confirmations_bp.abort(400, message="Duplicate confirmation for this user")
    return s
