from marshmallow import Schema, fields


class MosqueSuggestionCreateSchema(Schema):
    arabic_name = fields.Str(load_default=None)
    type = fields.Str(load_default=None)
    governorate = fields.Str(required=True)
    delegation = fields.Str(load_default=None)
    city = fields.Str(load_default=None)
    neighborhood = fields.Str(load_default=None)
    address = fields.Str(load_default=None)
    latitude = fields.Float(load_default=None)
    longitude = fields.Float(load_default=None)
    facilities = fields.Dict(keys=fields.Str(), values=fields.Boolean(), load_default=dict)
    facilities_details = fields.Str(load_default=None)
    jumuah_time = fields.Str(load_default=None)
    eid_info = fields.Str(load_default=None)


class MosqueSuggestionSchema(Schema):
    id = fields.Int(dump_only=True)
    arabic_name = fields.Str(allow_none=True)
    type = fields.Str(allow_none=True)
    governorate = fields.Str()
    delegation = fields.Str(allow_none=True)
    city = fields.Str(allow_none=True)
    neighborhood = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    facilities = fields.Dict(keys=fields.Str(), values=fields.Boolean(), attribute="facilities_json")
    facilities_details = fields.Str(allow_none=True)
    jumuah_time = fields.Str(allow_none=True)
    eid_info = fields.Str(allow_none=True)
    status = fields.Str()
    confirmations_count = fields.Int()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
