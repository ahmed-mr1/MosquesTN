from flask_smorest import Blueprint, abort
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Mosque, IqamaSuggestion
from ..schemas.iqama import IqamaSuggestionCreateSchema, IqamaSuggestionSchema
from ..utils.iqama import sanitize_times, valid_time_str


iqama_bp = Blueprint("iqama", __name__, url_prefix="/mosques", description="Iqama time suggestions")


@iqama_bp.route("/<int:mosque_id>/iqama-suggestions")
class IqamaSuggestionResource(MethodView):
    @iqama_bp.arguments(IqamaSuggestionCreateSchema)
    @iqama_bp.response(201, IqamaSuggestionSchema)
    @jwt_required()
    def post(self, data, mosque_id: int):
        m = Mosque.query.filter_by(id=mosque_id, approved=True).first()
        if not m:
            abort(404, message="Mosque not found")
        identity = get_jwt_identity()
        try:
            created_by_user_id = int(identity)
        except (TypeError, ValueError):
            abort(401, message="Invalid token identity")
        times = sanitize_times(data.get("times"))
        if not times:
            abort(400, message="At least one valid iqama time is required")
        jumuah = valid_time_str(data.get("jumuah_time"))
        s = IqamaSuggestion(
            mosque_id=mosque_id,
            times_json=times,
            jumuah_time=jumuah,
            status="pending",
            created_by_user_id=created_by_user_id,
        )
        db.session.add(s)
        db.session.commit()
        return s
