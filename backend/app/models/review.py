from datetime import datetime
from ..extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    mosque_id = db.Column(db.Integer, db.ForeignKey("mosques.id"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)
    criteria = db.Column(db.JSON, default=dict)  # structured criteria
    comment = db.Column(db.String(1000))
    status = db.Column(db.String(20), default="pending")  # pending/approved/rejected
    created_by_user_id = db.Column(db.Integer)  # optional; anonymous allowed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
