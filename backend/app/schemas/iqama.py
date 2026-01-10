from marshmallow import Schema, fields, validate


class IqamaTimesSchema(Schema):
    fajr = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))
    dhuhr = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))
    asr = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))
    maghrib = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))
    isha = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"))


class IqamaSuggestionCreateSchema(Schema):
    times = fields.Nested(IqamaTimesSchema, required=True)
    jumuah_time = fields.Str(validate=validate.Regexp(r"^(?:[01]\d|2[0-3]):[0-5]\d$"), allow_none=True)


class IqamaSuggestionSchema(Schema):
    id = fields.Int()
    mosque_id = fields.Int()
    times = fields.Nested(IqamaTimesSchema, attribute="times_json")
    jumuah_time = fields.Str(allow_none=True)
    status = fields.Str()
    created_by_user_id = fields.Int(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
