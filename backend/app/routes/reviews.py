from flask_smorest import Blueprint, abort
from flask.views import MethodView
from ..extensions import db
from ..models import Review, Mosque
from ..schemas.review import ReviewCreateSchema, ReviewSchema, ReviewListQuerySchema
from ..utils.reviews import sanitize_criteria
from flask_jwt_extended import get_jwt_identity, jwt_required


reviews_bp = Blueprint("reviews", __name__, url_prefix="/mosques", description="Mosque reviews")


@reviews_bp.route("/<int:mosque_id>/reviews")
class MosqueReviewsResource(MethodView):
    @reviews_bp.response(200, ReviewSchema(many=True))
    @reviews_bp.arguments(ReviewListQuerySchema, location="query")
    def get(self, args, mosque_id: int):
        m = Mosque.query.filter_by(id=mosque_id, approved=True).first()
        if not m:
            abort(404, message="Mosque not found")
        q = Review.query.filter_by(mosque_id=mosque_id, status="approved").order_by(Review.created_at.desc())
        limit = args.get("limit", 20)
        offset = args.get("offset", 0)
        items = q.offset(offset).limit(limit).all()
        return items

    @reviews_bp.arguments(ReviewCreateSchema)
    @reviews_bp.response(201, ReviewSchema)
    @jwt_required(optional=True)
    def post(self, data, mosque_id: int):
        m = Mosque.query.filter_by(id=mosque_id, approved=True).first()
        if not m:
            abort(404, message="Mosque not found")
        identity = get_jwt_identity()
        created_by_user_id = None
        if identity is not None:
            try:
                created_by_user_id = int(identity)
            except (TypeError, ValueError):
                abort(401, message="Invalid token identity")
        r = Review(
            mosque_id=mosque_id,
            rating=data["rating"],
            criteria=sanitize_criteria(data.get("criteria")),
            comment=data.get("comment"),
            created_by_user_id=created_by_user_id,
            status="pending",
        )
        db.session.add(r)
        db.session.commit()
        return r
