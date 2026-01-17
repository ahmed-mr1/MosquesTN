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
    address = db.Column(db.String(255))

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    facilities_json = db.Column(db.JSON, default=dict)

    iqama_times_json = db.Column(db.JSON, default=dict)  # {fajr,dhuhr,asr,maghrib,isha}
    jumuah_time = db.Column(db.String(20))
    eid_prayer_time = db.Column(db.String(255))

    # Staff
    muazzin_name = db.Column(db.String(120))
    imam_5_prayers_name = db.Column(db.String(120))
    imam_jumua_name = db.Column(db.String(120))

    approved = db.Column(db.Boolean, default=True)  # Only approved exposed publicly
    image_url = db.Column(db.String(500))
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
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "image_url": self.image_url,
            "facilities": self.facilities_json or {},
            "iqama_times": self.iqama_times_json or {},
            "jumuah_time": self.jumuah_time,
            "eid_info": self.eid_prayer_time,
            "muazzin_name": self.muazzin_name,
            "imam_5_prayers_name": self.imam_5_prayers_name,
            "imam_jumua_name": self.imam_jumua_name,
            "approved": self.approved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
