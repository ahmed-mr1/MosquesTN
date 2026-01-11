from datetime import datetime
from ..extensions import db


class Mosque(db.Model):
    __tablename__ = "mosques"

    id = db.Column(db.Integer, primary_key=True)
    arabic_name = db.Column(db.String(255))
    type = db.Column(db.String(50))  # مسجد / جامع / مصلى

    governorate = db.Column(db.String(120), nullable=False)
    delegation = db.Column(db.String(120))
    city = db.Column(db.String(120))
    neighborhood = db.Column(db.String(120))
    address = db.Column(db.String(255))

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    facilities_json = db.Column(db.JSON, default=dict)
    facilities_details = db.Column(db.String(500))

    iqama_times_json = db.Column(db.JSON, default=dict)  # {fajr,dhuhr,asr,maghrib,isha}
    jumuah_time = db.Column(db.String(20))
    eid_info = db.Column(db.String(255))

    approved = db.Column(db.Boolean, default=True)  # Only approved exposed publicly
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
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
            "iqama_times": self.iqama_times_json or {},
            "jumuah_time": self.jumuah_time,
            "eid_info": self.eid_info,
            "approved": self.approved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
