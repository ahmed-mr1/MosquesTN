# Tunisian Mosques API — Developer Guide

This guide explains the structure and responsibilities of each part of the codebase for the MVP.

## Backend (Flask)
- `backend/app/__init__.py`: App factory `create_app()` wires config and extensions, registers blueprints, and creates tables for quick dev.
- `backend/app/config.py`: Configuration classes with environment overrides. Set `DATABASE_URL`, `SECRET_KEY`, and `JWT_SECRET_KEY` in your environment.
- `backend/app/extensions.py`: Flask extensions — `db` (SQLAlchemy), `migrate` (Flask-Migrate), `jwt` (Flask-JWT-Extended).
- `backend/app/models/mosque.py`: `Mosque` SQLAlchemy model representing approved mosques with location and facilities.
- `backend/app/models/__init__.py`: Exposes `Mosque` for package imports.
- `backend/app/routes/mosques.py`: Blueprint with read endpoints:
  - `GET /mosques` — filters by `governorate`, `city`, `type`, supports `limit` and `offset`.
  - `GET /mosques/{id}` — fetch a single approved mosque.
  - `GET /mosques/nearby?lat=...&lng=...&radius=...` — approximate nearby search with Haversine refinement.
- `backend/app/routes/meta.py`: Metadata endpoints:
  - `GET /meta/facilities` — canonical list of facilities with keys and labels for rendering checkboxes.
- `backend/app/routes/suggestions.py`: Suggestion endpoints:
  - `POST /suggestions/mosques` — create a mosque suggestion. Facilities are sanitized to allowed boolean keys; optional `facilities_details` captured.
- `backend/app/routes/__init__.py`: Registers blueprints onto the app.
- `backend/run.py`: Local dev runner. Start the API with `python run.py` from `backend/`.

### Data & Migrations
- Default DB is SQLite via `DATABASE_URL` fallback; override for PostgreSQL (and PostGIS later) using env vars.
- Use Flask-Migrate (Alembic) to manage schema versions once DB is finalized.

### Facilities
- Source of truth is in `backend/app/utils/facilities.py`:
  - Keys and labels:
    - women_section: Women section
    - wudu: Ablution (Wudu)
    - toilets: Toilets
    - parking: Parking
    - accessibility: Wheelchair accessible
    - heating_cooling: AC/Heating
    - library: Library
    - education_rooms: Education rooms
    - funeral_service: Funeral service
    - ramadan_iftaar: Ramadan Iftaar
- API: `GET /meta/facilities` returns `{ facilities: [{ key, label }] }`.
- Storage: boolean flags in `Mosque.facilities_json` and optional free text in `Mosque.facilities_details`. For suggestions, the same fields exist on `MosqueSuggestion`.

### Next Backend Steps
- Add models for `MosqueSuggestion`, `Review`, `Confirmation`, `IqamaHistory`, `ModerationLog`, `MediaAsset`.
- Implement auth (JWT) and phone OTP (Firebase token exchange or server-side OTP).
- Build moderation queue endpoints and AI moderation stub.
- Switch nearby search to PostGIS/GeoAlchemy2 for accuracy and performance.

## Mobile (Expo)
- Directory `mobile/` contains the Expo app.
- Suggested folders:
  - `mobile/src/screens`: UI screens (list, detail, map, suggest, reviews).
  - `mobile/src/components`: Shared components.
  - `mobile/src/services`: API client (Axios).
  - `mobile/src/navigation`: React Navigation setup.

## Admin Panel (React Web)
- Directory `admin/` contains the Vite React app.
- Suggested folders:
  - `admin/src/pages`: Moderator views (queue, suggestion detail, reviews).
  - `admin/src/components`: Tables, forms.
  - `admin/src/services`: API client (Axios).
  - `admin/src/routes`: React Router setup.

## Running Locally
1. Backend
   ```powershell
   Set-Location "c:\Users\USER\MosquesTN\backend"
   $env:FLASK_ENV = "development"
   # Optional: set a Postgres URL
   # $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mosques"
   python run.py
   ```
2. Mobile (Expo)
   ```powershell
   Set-Location "c:\Users\USER\MosquesTN\mobile"
   npx expo start
   ```
3. Admin (Vite)
   ```powershell
   Set-Location "c:\Users\USER\MosquesTN\admin"
   npm run dev
   ```

## API Design Principles
- Separate approved data (`Mosque`) from suggested data (`MosqueSuggestion`).
- Only approved data is exposed publicly.
- Community confirmations (≥ 3) and moderation govern approval.
- Keep endpoints minimal and explicit for exam readiness.
