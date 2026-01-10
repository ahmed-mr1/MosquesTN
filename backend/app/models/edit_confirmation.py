from datetime import datetime
from ..extensions import db


class EditConfirmation(db.Model):
    __tablename__ = "mosque_edit_confirmations"

    id = db.Column(db.Integer, primary_key=True)
    edit_id = db.Column(db.Integer, db.ForeignKey("mosque_edit_suggestions.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("edit_id", "user_id", name="uq_edit_user"),
    )
