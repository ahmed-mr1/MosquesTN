from flask_smorest import Blueprint, abort
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import IqamaSuggestion, IqamaConfirmation
from ..schemas.iqama import IqamaSuggestionSchema
from ..services.moderation import APPROVAL_CONFIRMATION_THRESHOLD, approve_iqama_suggestion


iqama_conf_bp = Blueprint("iqama_conf", __name__, url_prefix="/iqama", description="Iqama confirmations")


@iqama_conf_bp.route("/<int:iqama_id>/confirmations", methods=["POST"])
@iqama_conf_bp.response(201, IqamaSuggestionSchema)
@jwt_required()
def add_iqama_confirmation(iqama_id: int):
    s = IqamaSuggestion.query.get(iqama_id)
    if not s:
        abort(404, message="Iqama suggestion not found")
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        abort(401, message="Invalid token identity")

    c = IqamaConfirmation(iqama_id=s.id, user_id=user_id)
    try:
        db.session.add(c)
        s.confirmations_count = (s.confirmations_count or 0) + 1
        if s.confirmations_count >= APPROVAL_CONFIRMATION_THRESHOLD and s.status not in ("approved", "rejected"):
            approve_iqama_suggestion(s)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(400, message="Duplicate confirmation for this user")
    return s
