from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt
from ..extensions import db
from ..models import MosqueSuggestion, Mosque, MosqueEditSuggestion
from ..services.moderation import approve_suggestion
from ..schemas.suggestion import MosqueSuggestionSchema
from ..models import Review
from ..schemas.review import ReviewSchema
from ..schemas.edit import MosqueEditSuggestionSchema


moderation_bp = Blueprint(
    "moderation", __name__, url_prefix="/moderation", description="Moderator actions"
)


@moderation_bp.route("/suggestions/<int:suggestion_id>/approve", methods=["POST"])
@moderation_bp.response(200, MosqueSuggestionSchema)
@jwt_required()
def approve_suggestion_route(suggestion_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueSuggestion.query.get(suggestion_id)
    if not s:
        abort(404, message="Suggestion not found")
    if s.status != "approved":
        approve_suggestion(s)
        db.session.commit()
    return s


@moderation_bp.route("/suggestions/<int:suggestion_id>/reject", methods=["POST"])
@moderation_bp.response(200, MosqueSuggestionSchema)
@jwt_required()
def reject_suggestion_route(suggestion_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueSuggestion.query.get(suggestion_id)
    if not s:
        abort(404, message="Suggestion not found")
    s.status = "rejected"
    db.session.commit()
    return s


@moderation_bp.route("/reviews/<int:review_id>/approve", methods=["POST"])
@moderation_bp.response(200, ReviewSchema)
@jwt_required()
def approve_review(review_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    r = Review.query.get(review_id)
    if not r:
        abort(404, message="Review not found")
    r.status = "approved"
    db.session.commit()
    return r


@moderation_bp.route("/reviews/<int:review_id>/reject", methods=["POST"])
@moderation_bp.response(200, ReviewSchema)
@jwt_required()
def reject_review(review_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    r = Review.query.get(review_id)
    if not r:
        abort(404, message="Review not found")
    r.status = "rejected"
    db.session.commit()
    return r


@moderation_bp.route("/reviews", methods=["GET"])
@moderation_bp.response(200, ReviewSchema(many=True))
@jwt_required()
def list_reviews():
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    # Simple moderation list; filter by status via query param, default 'pending'
    from flask import request
    status = request.args.get("status", "pending")
    mosque_id = request.args.get("mosque_id")
    q = Review.query
    if status:
        q = q.filter_by(status=status)
    if mosque_id:
        try:
            mid = int(mosque_id)
            q = q.filter_by(mosque_id=mid)
        except ValueError:
            abort(400, message="mosque_id must be an integer")
    items = q.order_by(Review.created_at.desc()).all()
    return items


@moderation_bp.route("/edits/<int:edit_id>/approve", methods=["POST"])
@moderation_bp.response(200, MosqueEditSuggestionSchema)
@jwt_required()
def approve_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueEditSuggestion.query.get(edit_id)
    if not s:
        abort(404, message="Edit suggestion not found")
    m = Mosque.query.get(s.mosque_id)
    if not m:
        abort(404, message="Mosque not found")
    patch = s.patch_json or {}
    if "address" in patch:
        m.address = patch.get("address")
    if "neighborhood" in patch:
        m.neighborhood = patch.get("neighborhood")
    if "facilities" in patch:
        m.facilities_json = patch.get("facilities") or {}
    if "facilities_details" in patch:
        m.facilities_details = patch.get("facilities_details")
    if "iqama_times" in patch:
        m.iqama_times_json = {**(m.iqama_times_json or {}), **(patch.get("iqama_times") or {})}
    if "jumuah_time" in patch:
        m.jumuah_time = patch.get("jumuah_time")
    if "eid_info" in patch:
        m.eid_info = patch.get("eid_info")
    s.status = "approved"
    db.session.commit()
    return s


@moderation_bp.route("/edits/<int:edit_id>/reject", methods=["POST"])
@moderation_bp.response(200, MosqueEditSuggestionSchema)
@jwt_required()
def reject_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueEditSuggestion.query.get(edit_id)
    if not s:
        abort(404, message="Edit suggestion not found")
    s.status = "rejected"
    db.session.commit()
    return s


## Iqama moderation removed; iqama updates now go through mosque edit suggestions.
