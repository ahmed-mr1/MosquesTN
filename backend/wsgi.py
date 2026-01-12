import os
from dotenv import load_dotenv

# Ensure env is loaded for production too
load_dotenv(override=True)

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "production"))


