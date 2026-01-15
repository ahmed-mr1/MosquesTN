from flask_smorest import Blueprint, abort
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Mosque, MosqueEditSuggestion, EditConfirmation
from ..schemas.edit import MosqueEditSuggestionCreateSchema, MosqueEditSuggestionSchema
from ..utils.facilities import sanitize_facilities
from ..utils.iqama import sanitize_times, valid_time_str
from ..services.moderation import APPROVAL_CONFIRMATION_THRESHOLD
from ..services.ai_moderation import moderate_text
from sqlalchemy.exc import IntegrityError


edits_bp = Blueprint("edits", __name__, url_prefix="/suggestions", description="Mosque edit suggestions")


@edits_bp.route("/mosques/<int:mosque_id>/edits")
class MosqueEditsResource(MethodView):
    @edits_bp.arguments(MosqueEditSuggestionCreateSchema)
    @edits_bp.response(201, MosqueEditSuggestionSchema)
    @jwt_required()
    def post(self, data, mosque_id: int):
        m = Mosque.query.filter_by(id=mosque_id, approved=True).first()
        if not m:
            abort(404, message="Mosque not found")
        identity = get_jwt_identity()
        try:
            user_id = int(identity)
        except (TypeError, ValueError):
            abort(401, message="Invalid token identity")
        patch_in = data.get("patch") or {}
        patch = {}
        if "address" in patch_in:
            patch["address"] = (patch_in.get("address") or "").strip()
        # Removed neighborhood
        if "facilities" in patch_in:
            patch["facilities"] = sanitize_facilities(patch_in.get("facilities") or {})
        # Removed facilities_details
        if "iqama_times" in patch_in:
            patch["iqama_times"] = sanitize_times(patch_in.get("iqama_times") or {})
        if "jumuah_time" in patch_in:
            jt = valid_time_str(patch_in.get("jumuah_time"))
            if jt:
                patch["jumuah_time"] = jt
        if "eid_info" in patch_in:
            patch["eid_info"] = patch_in.get("eid_info")
        if "image_url" in patch_in:
            patch["image_url"] = patch_in.get("image_url")
        
        # Staff
        if "muazzin_name" in patch_in:
            patch["muazzin_name"] = patch_in.get("muazzin_name")
        if "imam_5_prayers_name" in patch_in:
            patch["imam_5_prayers_name"] = patch_in.get("imam_5_prayers_name")
        if "imam_jumua_name" in patch_in:
            patch["imam_jumua_name"] = patch_in.get("imam_jumua_name")

        if not patch:
            abort(400, message="Empty patch")
        mod_input = " ".join([
            patch.get("address") or "",
            patch.get("jumuah_time") or "",
            str(patch.get("eid_info") or ""),
            " ".join(sorted(patch.keys())),
        ])
        decision = moderate_text(mod_input)
        status = "pending_approval" if decision.get("decision") == "valid" else "rejected"

        s = MosqueEditSuggestion(mosque_id=mosque_id, patch_json=patch, created_by_user_id=user_id)
        s.status = status
        db.session.add(s)
        db.session.commit()
        return s


@edits_bp.route("/edits/<int:edit_id>/confirmations", methods=["POST"])
@edits_bp.response(201, MosqueEditSuggestionSchema)
@jwt_required()
def confirm_edit(edit_id: int):
    s = MosqueEditSuggestion.query.get(edit_id)
    if not s:
        abort(404, message="Edit suggestion not found")
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        abort(401, message="Invalid token identity")
    c = EditConfirmation(edit_id=s.id, user_id=user_id)
    try:
        db.session.add(c)
        s.confirmations_count = (s.confirmations_count or 0) + 1
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(400, message="Duplicate confirmation for this user")
    return s
