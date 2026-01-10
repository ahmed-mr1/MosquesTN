from marshmallow import Schema, fields, validate


class MosqueEditPatchSchema(Schema):
    # All optional; only provided keys are applied
    address = fields.Str()
    neighborhood = fields.Str()
    facilities = fields.Dict(keys=fields.Str(), values=fields.Boolean())
    facilities_details = fields.Str()
    iqama_times = fields.Dict(keys=fields.Str(), values=fields.Str())
    jumuah_time = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))
    eid_info = fields.Str()


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
