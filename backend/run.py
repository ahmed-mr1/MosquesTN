import os
from app import create_app
from dotenv import load_dotenv


load_dotenv()


def main():
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))


if __name__ == "__main__":
    main()
