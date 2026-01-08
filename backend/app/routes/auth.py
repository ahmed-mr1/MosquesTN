from datetime import timedelta
from flask_smorest import Blueprint
from flask import request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity


auth_bp = Blueprint("auth", __name__, url_prefix="/auth", description="Authentication endpoints")


@auth_bp.route("/firebase/verify", methods=["POST"])
def firebase_verify():
    # Dev stub: accept id_token and issue JWT with string identity (sub)
    data = request.get_json(silent=True) or {}
    id_token = request.args.get("id_token") or data.get("id_token")
    if not id_token:
        return {"message": "id_token is required"}, 400
    # Simple role mapping for dev/testing: pass id_token 'admin' or 'moderator' to set role
    role = "authenticated"
    if isinstance(id_token, str):
        lowered = id_token.strip().lower()
        if lowered in ("admin", "moderator"):
            role = lowered
    user_id = "1"  # use a fixed dev user id as string
    token = create_access_token(
        identity=user_id,
        expires_delta=timedelta(hours=12),
        additional_claims={"provider": "firebase", "role": role},
    )
    return {"access_token": token}, 200


@auth_bp.route("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    return {"user_id": int(identity)}
