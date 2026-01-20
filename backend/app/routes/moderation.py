from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt
from ..extensions import db
from ..models import MosqueSuggestion, Mosque, MosqueEditSuggestion
from ..models import EditConfirmation
from ..services.moderation import approve_suggestion, approve_edit_suggestion
from ..schemas.suggestion import MosqueSuggestionSchema
from ..models import Review
from ..schemas.review import ReviewSchema
from ..schemas.edit import MosqueEditSuggestionSchema


moderation_bp = Blueprint(
    "moderation", __name__, url_prefix="/moderation", description="Moderator actions"
)

# --- SUGGESTIONS ---

@moderation_bp.route("/suggestions", methods=["GET"])
@moderation_bp.response(200, MosqueSuggestionSchema(many=True))
@jwt_required()
def list_suggestions():
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    
    from flask import request
    status = request.args.get("status", "pending_approval")
    
    q = MosqueSuggestion.query
    if status and status != 'all':
        # Show both legacy and new pending statuses
        if status in ("pending", "pending_approval"):
            q = q.filter(MosqueSuggestion.status.in_(["pending", "pending_approval"]))
        else:
            q = q.filter_by(status=status)
        
    return q.order_by(MosqueSuggestion.created_at.desc()).all()


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
        
    if s.status == "approved":
        return s
        
    try:
        approve_suggestion(s)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        # Return the actual error message to the client
        return {"message": f"Approval failed: {str(e)}", "error_type": type(e).__name__}, 500
        
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

@moderation_bp.route("/suggestions/<int:suggestion_id>", methods=["DELETE"])
@jwt_required()
def delete_suggestion(suggestion_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role != "admin": # Only ADMIN can delete
         abort(403, message="Admin role required for deletion")
         
    s = MosqueSuggestion.query.get(suggestion_id)
    if not s:
        abort(404, message="Suggestion not found")
        
    db.session.delete(s)
    db.session.commit()
    return {"message": "Suggestion deleted"}, 200

# --- REVIEWS ---

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
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        abort(500, message=f"Review approval failed: {str(e)}")
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

@moderation_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role != "admin": 
         abort(403, message="Admin role required for deletion")
         
    r = Review.query.get(review_id)
    if not r:
        abort(404, message="Review not found")
        
    db.session.delete(r)
    db.session.commit()
    return {"message": "Review deleted"}, 200


@moderation_bp.route("/reviews", methods=["GET"])
@moderation_bp.response(200, ReviewSchema(many=True))
@jwt_required()
def list_reviews():
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    
    from flask import request
    status = request.args.get("status", "pending")
    mosque_id = request.args.get("mosque_id")
    q = Review.query
    if status and status != 'all':
        # Show both legacy and new status values for compatibility
        if status in ("pending", "pending_approval"):
            q = q.filter(Review.status.in_(["pending", "pending_approval"]))
        elif status in ("approved", "accepted"):  # handle both
            q = q.filter(Review.status.in_(["approved", "accepted"]))
        elif status in ("rejected", "denied"):
            q = q.filter(Review.status.in_(["rejected", "denied"]))
        else:
            q = q.filter_by(status=status)
    if mosque_id:
        try:
            mid = int(mosque_id)
            q = q.filter_by(mosque_id=mid)
        except: pass
    return q.order_by(Review.created_at.desc()).all()


# --- EDITS ---

@moderation_bp.route("/edits", methods=["GET"])
@moderation_bp.response(200, MosqueEditSuggestionSchema(many=True))
@jwt_required()
def list_edits():
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    
    from flask import request
    status = request.args.get("status", "pending")
    q = MosqueEditSuggestion.query
    if status and status != 'all':
        q = q.filter_by(status=status)
        
    return q.order_by(MosqueEditSuggestion.created_at.desc()).all()


@moderation_bp.route("/edits/<int:edit_id>/approve", methods=["POST"])
@moderation_bp.response(200, MosqueEditSuggestionSchema)
@jwt_required()
def approve_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    
    e = MosqueEditSuggestion.query.get(edit_id)
    if not e:
        abort(404, message="Edit not found")
        
    if e.status != "approved":
        try:
            approve_edit_suggestion(e)
            db.session.commit()
        except Exception as err:
            db.session.rollback()
            abort(500, message=f"Edit approval failed: {str(err)}")
            
    return e


@moderation_bp.route("/edits/<int:edit_id>/reject", methods=["POST"])
@moderation_bp.response(200, MosqueEditSuggestionSchema)
@jwt_required()
def reject_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role not in ("admin", "moderator"):
        abort(403, message="Moderator/Admin role required")
    
    e = MosqueEditSuggestion.query.get(edit_id)
    if not e:
        abort(404, message="Edit not found")
    
    e.status = "rejected"
    db.session.commit()
    return e


@moderation_bp.route("/edits/<int:edit_id>", methods=["DELETE"])
@jwt_required()
def delete_edit(edit_id: int):
    claims = get_jwt() or {}
    role = claims.get("role")
    if role != "admin": 
         abort(403, message="Admin role required for deletion")
         
    e = MosqueEditSuggestion.query.get(edit_id)
    if not e:
        abort(404, message="Edit not found")
        
    db.session.delete(e)
    db.session.commit()
    return {"message": "Edit deleted"}, 200
