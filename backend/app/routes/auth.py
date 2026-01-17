from datetime import timedelta
from flask_smorest import Blueprint
from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..models import User
from ..extensions import db

auth_bp = Blueprint("auth", __name__, url_prefix="/auth", description="Authentication endpoints")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    role_req = data.get("role")

    # 1. Mobile App Guest/User Login (No credentials, just role="guest")
    if not username and role_req == "user":
        # Security: Allow anonymous/guest login but map to a restrictive role
        # We find or create a 'guest' user in the DB so that user_id is valid
        guest = User.query.filter_by(username="guest").first()
        if not guest:
            guest = User(username="guest", role="guest")
            guest.set_password("guest_access_key_123") # Internal implementation detail
            db.session.add(guest)
            db.session.commit()
        
        token = create_access_token(
            identity=str(guest.id),
            expires_delta=timedelta(days=365), # Long lived for app
            additional_claims={"role": "guest"}
        )
        return {"access_token": token, "role": "guest", "user_id": guest.id}, 200

    # 2. Admin/Moderator Login (Requires Username + Password)
    if not username:
         return {"message": "Username required"}, 400

    user = User.query.filter_by(username=username).first()

    if not user or not password or not user.check_password(password):
        return {"message": "Invalid credentials"}, 401

    token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7),
        additional_claims={"role": user.role}
    )
    
    return {"access_token": token, "role": user.role, "user_id": user.id}, 200

@auth_bp.route("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    return {
        "user_id": int(identity),
        "username": user.username if user else "Deleted",
        "role": user.role if user else "unknown"
    }
