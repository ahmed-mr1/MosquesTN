from datetime import timedelta
from flask_smorest import Blueprint
from flask import request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity


auth_bp = Blueprint("auth", __name__, url_prefix="/auth", description="Authentication endpoints")


@auth_bp.route("/login", methods=["POST"])
def login():
    # Dev Stub: Simple login for development/testing
    data = request.get_json(silent=True) or {}
    # Accept 'username' or 'role' to determine permissions
    username = data.get("username") or data.get("role") or "user"
    
    role = "authenticated"
    if isinstance(username, str):
        lowered = username.strip().lower()
        if lowered in ("admin", "moderator"):
            role = lowered

    # Fixed ID for dev; in production this would verify password and get real ID
    user_id = "1" 
    
    token = create_access_token(
        identity=user_id,
        expires_delta=timedelta(days=7), # Longer session for dev
        additional_claims={"role": role},
    )
    return {"access_token": token}, 200


@auth_bp.route("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    return {"user_id": int(identity)}
