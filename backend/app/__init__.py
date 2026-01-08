from flask import Flask, jsonify
from .config import config_by_name
from .extensions import db, migrate, jwt, api, cors


def create_app(config_name: str = "development") -> Flask:
	app = Flask(__name__)
	app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

	# OpenAPI / Swagger UI settings
	app.config.update(
		API_TITLE="Tunisian Mosques API",
		API_VERSION="v1",
		OPENAPI_VERSION="3.0.3",
		OPENAPI_URL_PREFIX="/",
		OPENAPI_SWAGGER_UI_PATH="/swagger-ui",
		OPENAPI_SWAGGER_UI_URL="https://cdn.jsdelivr.net/npm/swagger-ui-dist/",
	)

	# Init extensions
	db.init_app(app)
	migrate.init_app(app, db)
	jwt.init_app(app)
	api.init_app(app)
	cors.init_app(app)

	# Register blueprints
	from .routes import register_blueprints
	register_blueprints(app)

	# JSON error handling for 404
	@app.errorhandler(404)
	def handle_404(_e):
		return jsonify({"message": "Not found"}), 404

	# Quick dev: create tables if using SQLite and not migrated yet
	with app.app_context():
		try:
			db.create_all()
		except Exception:
			pass

	return app

