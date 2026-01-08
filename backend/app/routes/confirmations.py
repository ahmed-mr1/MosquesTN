from flask_smorest import Blueprint, abort
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import MosqueSuggestion, SuggestionConfirmation
from ..services.moderation import approve_suggestion, APPROVAL_CONFIRMATION_THRESHOLD
from ..schemas.suggestion import MosqueSuggestionSchema
from flask_jwt_extended import jwt_required, get_jwt_identity


confirmations_bp = Blueprint(
    "confirmations", __name__, url_prefix="/suggestions", description="Suggestion confirmations"
)


@confirmations_bp.route("/<int:suggestion_id>/confirmations", methods=["POST"])
@confirmations_bp.response(201, MosqueSuggestionSchema)
@jwt_required()
def add_confirmation(suggestion_id: int):
    s = MosqueSuggestion.query.get(suggestion_id)
    if not s:
        abort(404, message="Suggestion not found")
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        abort(401, message="Invalid token identity")
    c = SuggestionConfirmation(suggestion_id=s.id, user_id=user_id)
    mosque = None
    try:
        db.session.add(c)
        s.confirmations_count = (s.confirmations_count or 0) + 1
        if s.confirmations_count >= APPROVAL_CONFIRMATION_THRESHOLD and s.status not in ("approved", "rejected"):
            mosque = approve_suggestion(s)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(400, message="Duplicate confirmation for this user")
    return s
