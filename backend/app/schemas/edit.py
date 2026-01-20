from marshmallow import Schema, fields, validate


class MosqueEditPatchSchema(Schema):
    # All optional; only provided keys are applied
    arabic_name = fields.Str()
    type = fields.Str()
    governorate = fields.Str()
    delegation = fields.Str()
    city = fields.Str()
    latitude = fields.Float()
    longitude = fields.Float()
    
    address = fields.Str()
    facilities = fields.Dict(keys=fields.Str(), values=fields.Boolean())
    iqama_times = fields.Dict(keys=fields.Str(), values=fields.Str())
    jumuah_time = fields.Str()
    eid_info = fields.Str()
    image_url = fields.Str()
    muazzin_name = fields.Str()
    imam_5_prayers_name = fields.Str()
    imam_jumua_name = fields.Str()


class MosqueEditSuggestionCreateSchema(Schema):
    patch = fields.Nested(MosqueEditPatchSchema, required=True)


class MosqueEditSuggestionSchema(Schema):
    id = fields.Int()
    mosque_id = fields.Int()
    patch = fields.Nested(MosqueEditPatchSchema, attribute="patch_json")
    status = fields.Str()
    confirmations_count = fields.Int()
    created_by_user_id = fields.Int(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
