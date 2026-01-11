import os
import sys
import logging
import argparse
import sqlite3
from typing import Any, Dict
import json
from datetime import datetime

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from app.extensions import db
from app.models import Mosque


def row_to_mosque_kwargs(row: Dict[str, Any]) -> Dict[str, Any]:
    def _to_json(val: Any) -> Any:
        if val is None:
            return {}
        if isinstance(val, (dict, list)):
            return val
        if isinstance(val, str):
            val = val.strip()
            if not val:
                return {}
            try:
                return json.loads(val)
            except Exception:
                return {}
        return {}

    def _to_dt(val: Any):
        if not val:
            return None
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            try:
                return datetime.fromisoformat(val)
            except Exception:
                return None
        return None

    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "arabic_name": row.get("arabic_name"),
        "type": row.get("type"),
        "governorate": row.get("governorate"),
        "delegation": row.get("delegation"),
        "city": row.get("city"),
        "neighborhood": row.get("neighborhood"),
        "address": row.get("address"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "facilities_json": _to_json(row.get("facilities_json")),
        "facilities_details": row.get("facilities_details"),
        "iqama_times_json": _to_json(row.get("iqama_times_json")),
        "jumuah_time": row.get("jumuah_time"),
        "eid_info": row.get("eid_info"),
        "approved": bool(row.get("approved")) if row.get("approved") is not None else True,
        "created_at": _to_dt(row.get("created_at")),
        "updated_at": _to_dt(row.get("updated_at")),
    }


def copy_sqlite_to_postgres(sqlite_path: str) -> None:
    logging.info("Connecting to SQLite: %s", sqlite_path)
    if not os.path.exists(sqlite_path):
        logging.error("SQLite file not found: %s", sqlite_path)
        sys.exit(1)

    con = sqlite3.connect(sqlite_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    try:
        cur.execute("SELECT * FROM mosques")
    except sqlite3.Error as e:
        logging.error("Failed to read mosques from SQLite: %s", e)
        sys.exit(1)

    rows = cur.fetchall()
    logging.info("Found %s mosques in SQLite", len(rows))

    app = create_app("production")
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            pass

        inserted = 0
        updated = 0
        for row in rows:
            data = {k: row[k] for k in row.keys()}
            kwargs = row_to_mosque_kwargs(data)

            existing = Mosque.query.filter_by(id=kwargs.get("id")).first()
            if existing:
                for k, v in kwargs.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                m = Mosque(**kwargs)
                db.session.add(m)
                inserted += 1

        db.session.commit()
        logging.info("Inserted %s, updated %s mosques into Postgres", inserted, updated)

        try:
            db.session.execute(
                "SELECT setval(pg_get_serial_sequence('mosques','id'), (SELECT COALESCE(MAX(id),1) FROM mosques))"
            )
            db.session.commit()
            logging.info("Postgres sequence for mosques.id adjusted")
        except Exception as e:
            logging.warning("Could not adjust Postgres sequence: %s", e)

    con.close()


def main():
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    load_dotenv()

    parser = argparse.ArgumentParser(description="Copy mosques from SQLite into Postgres using app models")
    parser.add_argument("--sqlite", default="./instance/mosques.db", help="Path to source SQLite mosques.db")
    args = parser.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url or not db_url.startswith("postgresql://"):
        logging.error("Please set DATABASE_URL to a PostgreSQL connection string")
        sys.exit(1)

    copy_sqlite_to_postgres(args.sqlite)


if __name__ == "__main__":
    main()
