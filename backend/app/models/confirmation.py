from datetime import datetime
from ..extensions import db


class SuggestionConfirmation(db.Model):
    __tablename__ = "suggestion_confirmations"

    id = db.Column(db.Integer, primary_key=True)
    suggestion_id = db.Column(db.Integer, db.ForeignKey("mosque_suggestions.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("suggestion_id", "user_id", name="uq_suggestion_user"),
    )
