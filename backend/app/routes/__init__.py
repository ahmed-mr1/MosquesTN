from flask import Flask
from ..extensions import api
from .mosques import mosques_bp
from .meta import meta_bp
from .suggestions import suggestions_bp
from .confirmations import confirmations_bp
from .moderation import moderation_bp
from .auth import auth_bp
from .reviews import reviews_bp
from .edits import edits_bp
from .upload import upload_bp


def register_blueprints(app: Flask):
	api.register_blueprint(mosques_bp)
	api.register_blueprint(meta_bp)
	api.register_blueprint(suggestions_bp)
	api.register_blueprint(confirmations_bp)
	api.register_blueprint(moderation_bp)
	api.register_blueprint(auth_bp)
	api.register_blueprint(reviews_bp)
	api.register_blueprint(edits_bp)
	api.register_blueprint(upload_bp)


