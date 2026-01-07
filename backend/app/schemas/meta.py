from marshmallow import Schema, fields


class FacilityOptionSchema(Schema):
    key = fields.Str(required=True)
    label = fields.Str(required=True)


class FacilitiesListSchema(Schema):
    facilities = fields.List(fields.Nested(FacilityOptionSchema))
