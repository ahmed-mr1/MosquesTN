import os
from dotenv import load_dotenv

# Load environment from .env BEFORE importing the app so config sees DATABASE_URL
load_dotenv(override=True)
from app import create_app


def main():
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))


if __name__ == "__main__":
    main()
