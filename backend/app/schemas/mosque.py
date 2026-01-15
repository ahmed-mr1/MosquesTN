from marshmallow import Schema, fields


class FacilitiesMapSchema(Schema):
    # Represent as dict[str,bool]; marshmallow Dict requires keys/values
    # We will use Dict for simplicity; UI knows allowed keys from /meta/facilities
    pass


class MosqueSchema(Schema):
    id = fields.Int(dump_only=True)
    arabic_name = fields.Str(allow_none=True)
    type = fields.Str(allow_none=True)
    governorate = fields.Str(required=True)
    delegation = fields.Str(allow_none=True)
    city = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    image_url = fields.Str(allow_none=True)
    facilities = fields.Dict(keys=fields.Str(), values=fields.Boolean(), attribute="facilities_json")
    iqama_times = fields.Dict(keys=fields.Str(), values=fields.Str(), attribute="iqama_times_json")
    jumuah_time = fields.Str(allow_none=True)
    eid_info = fields.Str(allow_none=True)
    # Staff
    muazzin_name = fields.Str(allow_none=True)
    imam_5_prayers_name = fields.Str(allow_none=True)
    imam_jumua_name = fields.Str(allow_none=True)
    
    approved = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class MosqueListQuerySchema(Schema):
    governorate = fields.Str()
    city = fields.Str()
    type = fields.Str()
    limit = fields.Int(load_default=20)
    offset = fields.Int(load_default=0)


class NearbyQuerySchema(Schema):
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    radius = fields.Float(load_default=5)
