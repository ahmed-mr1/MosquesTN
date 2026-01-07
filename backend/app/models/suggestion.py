from datetime import datetime
from ..extensions import db

class MosqueSuggestion(db.Model):
    __tablename__ = "mosque_suggestions"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(255), nullable=False)
    arabic_name = db.Column(db.String(255))
    type = db.Column(db.String(50))

    governorate = db.Column(db.String(120), nullable=False)
    delegation = db.Column(db.String(120))
    city = db.Column(db.String(120))
    neighborhood = db.Column(db.String(120))
    address = db.Column(db.String(255))

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    facilities_json = db.Column(db.JSON, default=dict)
    facilities_details = db.Column(db.String(500))

    status = db.Column(db.String(32), nullable=False, default="pending_ai_review")
    confirmations_count = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_user_id = db.Column(db.Integer)  # TODO: wire with JWT later

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "arabic_name": self.arabic_name,
            "type": self.type,
            "governorate": self.governorate,
            "delegation": self.delegation,
            "city": self.city,
            "neighborhood": self.neighborhood,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "facilities": self.facilities_json or {},
            "facilities_details": self.facilities_details,
            "status": self.status,
            "confirmations_count": self.confirmations_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }