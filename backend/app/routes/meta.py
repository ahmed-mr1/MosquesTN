from flask_smorest import Blueprint
from ..utils.facilities import FACILITY_OPTIONS
from ..schemas.meta import FacilitiesListSchema


meta_bp = Blueprint("meta", __name__, url_prefix="/meta", description="Metadata endpoints")


@meta_bp.route("/facilities")
@meta_bp.response(200, FacilitiesListSchema)
def list_facilities():
    return {"facilities": FACILITY_OPTIONS}
