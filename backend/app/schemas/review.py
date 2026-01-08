from marshmallow import Schema, fields, validate


class ReviewCreateSchema(Schema):
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    criteria = fields.Dict(keys=fields.Str(), values=fields.Int(validate=validate.Range(min=0, max=5)), load_default=dict)
    comment = fields.Str(load_default=None)


class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    mosque_id = fields.Int()
    rating = fields.Int()
    criteria = fields.Dict(keys=fields.Str(), values=fields.Int())
    comment = fields.Str(allow_none=True)
    status = fields.Str()
    created_by_user_id = fields.Int(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class ReviewListQuerySchema(Schema):
    limit = fields.Int(load_default=20, validate=validate.Range(min=1, max=100))
    offset = fields.Int(load_default=0, validate=validate.Range(min=0))
