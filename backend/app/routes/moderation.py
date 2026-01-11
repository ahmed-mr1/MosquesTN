from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt
from ..extensions import db
from ..models import MosqueSuggestion, Mosque, MosqueEditSuggestion
from ..models import EditConfirmation
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


# Delete endpoints (admin/moderator only)

@moderation_bp.route("/suggestions/<int:suggestion_id>", methods=["DELETE"])
@jwt_required()
def delete_suggestion(suggestion_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueSuggestion.query.get(suggestion_id)
    if not s:
        abort(404, message="Suggestion not found")
    db.session.delete(s)
    db.session.commit()
    return {"message": "suggestion deleted", "id": suggestion_id}


@moderation_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    r = Review.query.get(review_id)
    if not r:
        abort(404, message="Review not found")
    db.session.delete(r)
    db.session.commit()
    return {"message": "review deleted", "id": review_id}


@moderation_bp.route("/edits/<int:edit_id>", methods=["DELETE"])
@jwt_required()
def delete_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    s = MosqueEditSuggestion.query.get(edit_id)
    if not s:
        abort(404, message="Edit suggestion not found")
    db.session.delete(s)
    db.session.commit()
    return {"message": "edit deleted", "id": edit_id}


@moderation_bp.route("/mosques/<int:mosque_id>", methods=["DELETE"])
@jwt_required()
def delete_mosque(mosque_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    m = Mosque.query.get(mosque_id)
    if not m:
        abort(404, message="Mosque not found")
    # Delete dependent rows to satisfy FKs
    edits = MosqueEditSuggestion.query.filter_by(mosque_id=mosque_id).all()
    if edits:
        edit_ids = [e.id for e in edits]
        EditConfirmation.query.filter(EditConfirmation.edit_id.in_(edit_ids)).delete(synchronize_session=False)
        MosqueEditSuggestion.query.filter(MosqueEditSuggestion.id.in_(edit_ids)).delete(synchronize_session=False)
    from ..models import Review as _Review
    _Review.query.filter_by(mosque_id=mosque_id).delete(synchronize_session=False)
    db.session.delete(m)
    db.session.commit()
    return {"message": "mosque deleted", "id": mosque_id}
