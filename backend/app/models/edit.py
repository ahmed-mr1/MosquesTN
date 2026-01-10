from datetime import datetime
from ..extensions import db


class MosqueEditSuggestion(db.Model):
    __tablename__ = "mosque_edit_suggestions"

    id = db.Column(db.Integer, primary_key=True)
    mosque_id = db.Column(db.Integer, db.ForeignKey("mosques.id"), nullable=False, index=True)
    patch_json = db.Column(db.JSON, default=dict)  # Partial update; allowed fields only
    status = db.Column(db.String(20), default="pending")  # pending/approved/rejected
    confirmations_count = db.Column(db.Integer, nullable=False, default=0)
    created_by_user_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
