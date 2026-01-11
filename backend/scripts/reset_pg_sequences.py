import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load .env to get DATABASE_URL
load_dotenv(override=True)
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL not set. Save it in backend/.env or environment.")

engine = create_engine(DB_URL, future=True)

# Whitelist of tables with integer primary keys to fix
TABLES = [
    ("mosques", "id"),
    ("mosque_suggestions", "id"),
    ("mosque_edit_suggestions", "id"),
    ("reviews", "id"),
]

def reset_sequence(conn, table: str, column: str):
    seq_row = conn.execute(text("SELECT pg_get_serial_sequence(:t, :c) AS seq"), {"t": table, "c": column}).scalar()
    if not seq_row:
        print(f"[skip] No serial sequence for {table}.{column}")
        return
    max_id = conn.execute(text(f"SELECT MAX({column}) FROM {table}"))
    raw_max = max_id.scalar()
    try:
        max_val = int(raw_max) if raw_max is not None else 0
    except Exception:
        max_val = 0
    if max_val < 1:
        # Empty table: set sequence to 1 with is_called=false so nextval returns 1
        conn.execute(text("SELECT setval(:seq, :val, false)").bindparams(seq=seq_row, val=1))
        print(f"[ok] Reset {seq_row} to 1 (next will be 1) for {table}.{column} (empty table)")
    else:
        # Non-empty: set to max_val with is_called=true so nextval becomes max_val + 1
        conn.execute(text("SELECT setval(:seq, :val, true)").bindparams(seq=seq_row, val=max_val))
        print(f"[ok] Reset {seq_row} to {max_val} (next will be {max_val + 1}) for {table}.{column}")

if __name__ == "__main__":
    with engine.begin() as conn:
        for t, c in TABLES:
            reset_sequence(conn, t, c)
    print("All done. If there were skips, they had no serial sequence.")
