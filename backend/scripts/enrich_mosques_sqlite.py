import os
import sys
import time
import math
import logging
import argparse
from typing import Optional, Tuple, Dict

import reverse_geocoder as rg
import requests
from dotenv import load_dotenv


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# Use SQLAlchemy with the Flask app (PostgreSQL)
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))
from app import create_app
from app.extensions import db
from app.models.mosque import Mosque


def reverse_geocode(lat: float, lon: float) -> Tuple[Optional[str], Optional[str]]:
    try:
        res = rg.search([(lat, lon)], mode=1)
        if res and isinstance(res, list):
            city = res[0].get("name")
            state = res[0].get("admin1")
            return city, state
    except Exception as e:
        logging.warning("reverse_geocoder failed: %s", e)
    return None, None


def google_places_name(lat: float, lon: float, api_key: Optional[str]) -> Optional[str]:
    if not api_key:
        return None
    try:
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        # radius is passed by caller via query params if needed
        params = {
            "location": f"{lat},{lon}",
            "radius": 200,
            "type": "mosque",
            "key": api_key,
        }
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            logging.warning("Places API HTTP %s: %s", resp.status_code, resp.text[:200])
            return None
        data = resp.json()
        results = data.get("results") or []
        if not results:
            return None
        # Pick closest if multiple
        best = results[0]
        best_name = best.get("name")
        # Try to refine by distance using geometry if available
        try:
            distances = []
            for r in results[:5]:
                g = r.get("geometry", {}).get("location", {})
                plat, plon = g.get("lat"), g.get("lng")
                if plat is not None and plon is not None:
                    d = haversine(lat, lon, float(plat), float(plon))
                    distances.append((d, r))
            if distances:
                distances.sort(key=lambda x: x[0])
                best = distances[0][1]
                best_name = best.get("name")
        except Exception:
            pass
        return best_name
    except Exception as e:
        logging.warning("Places API error: %s", e)
        return None


OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def osm_nearest_mosque_name(lat: float, lon: float, radius: int = 250) -> Optional[str]:
    """Find nearest OSM mosque name around (lat, lon) using Overpass (free)."""
    query = f"""
    [out:json][timeout:25];
    (
      nwr(around:{radius},{lat},{lon})["amenity"="place_of_worship"]["religion"="muslim"];
    );
    out center qt;
    """
    try:
        resp = requests.post(OVERPASS_URL, data=query, timeout=30)
        if resp.status_code != 200:
            logging.warning("Overpass HTTP %s: %s", resp.status_code, resp.text[:200])
            return None
        data = resp.json()
        elems = data.get("elements", [])
        if not elems:
            return None
        best_name = None
        best_dist = None
        for e in elems:
            tags = e.get("tags", {}) or {}
            name = tags.get("name") or tags.get("name:ar") or tags.get("name:en")
            if not name:
                continue
            if "lat" in e and "lon" in e:
                elat, elon = e["lat"], e["lon"]
            else:
                c = e.get("center") or {}
                elat, elon = c.get("lat"), c.get("lon")
                if elat is None or elon is None:
                    continue
            dist = haversine(float(lat), float(lon), float(elat), float(elon))
            if best_dist is None or dist < best_dist:
                best_dist = dist
                best_name = name
        return best_name
    except Exception as e:
        logging.warning("Overpass error: %s", e)
        return None

def main():
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description="Enrich Postgres mosques rows with city/governorate and corrected arabic_name")
    parser.add_argument("--sleep", type=float, default=0.2, help="Sleep seconds between external requests to avoid rate limits")
    parser.add_argument("--radius", type=int, default=250, help="Search radius in meters for name correction")
    parser.add_argument("--only-missing", action="store_true", help="Only rows missing city/governorate or generic name")
    parser.add_argument("--limit", type=int, default=0, help="Process at most N rows (0 = all)")
    args = parser.parse_args()

    load_dotenv()
    places_key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("PLACES_API_KEY")
    use_places = bool(places_key)

    # simple cache to avoid repeated lookups for nearby duplicates (grid ~0.001 deg)
    name_cache: Dict[Tuple[int, int], Optional[str]] = {}

    app = create_app(os.getenv("FLASK_ENV") or "production")
    updated = 0
    total = 0
    with app.app_context():
        q = db.session.query(Mosque)
        if args.only_missing:
            q = q.filter(
                (Mosque.city.is_(None)) | (Mosque.governorate.is_(None)) | (Mosque.arabic_name.is_(None))
            )
        if args.limit and args.limit > 0:
            q = q.limit(args.limit)

        for m in q.all():
            total += 1
            lat = m.latitude
            lon = m.longitude
            name = (m.arabic_name or "")
            if lat is None or lon is None:
                continue

            city, governorate = reverse_geocode(float(lat), float(lon))

            corrected_name = None
            if not name.strip():
                cell = (round(float(lat), 3), round(float(lon), 3))
                if cell in name_cache:
                    corrected_name = name_cache[cell]
                else:
                    corrected_name = (
                        google_places_name(float(lat), float(lon), places_key)
                        if use_places else osm_nearest_mosque_name(float(lat), float(lon), radius=args.radius)
                    )
                    name_cache[cell] = corrected_name
                    time.sleep(args.sleep)

            new_city = city
            new_governorate = governorate
            new_name = corrected_name or (name if name else None)

            if new_city:
                m.city = new_city
            if new_governorate:
                m.governorate = new_governorate
            if corrected_name:
                m.arabic_name = new_name
            if new_city or new_governorate or corrected_name:
                db.session.add(m)
                updated += 1

        db.session.commit()
    logging.info("Processed %s rows; updated %s rows.", total, updated)


if __name__ == "__main__":
    main()
