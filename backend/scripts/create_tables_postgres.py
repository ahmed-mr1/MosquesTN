import os
import sys
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from app.extensions import db
import app.models  # ensure all models are imported so metadata is populated


def main():
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    app = create_app("production")
    with app.app_context():
        db.create_all()
        logging.info("Created all tables on the configured database.")


if __name__ == "__main__":
    main()
