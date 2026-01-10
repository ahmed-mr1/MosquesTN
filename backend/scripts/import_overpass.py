import os
import json
import math
import time
import logging
from typing import Dict, Any, List

import requests
from dotenv import load_dotenv

# Ensure we can import the Flask app and models
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.extensions import db
from app.models.mosque import Mosque

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
]

AREA_FILTERS = [
    'area["ISO3166-1"="TN"]["boundary"="administrative"]',
    'area["wikidata"="Q948"]["boundary"="administrative"]',
    'area["name:en"="Tunisia"]["boundary"="administrative"]',
    'area["name"="Tunisie"]["boundary"="administrative"]',
    'area["name"="Tunisia"]["boundary"="administrative"]',
]

def build_area_query(area_filter: str) -> str:
    return (
        "[out:json][timeout:180];\n"
        f"{area_filter}->.a;\n"
        "(\n"
        "  node[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"](area.a);\n"
        "  way[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"](area.a);\n"
        "  relation[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"](area.a);\n"
        ");\n"
        "out center tags;\n"
    )

def build_bbox_query(south: float, west: float, north: float, east: float) -> str:
    return (
        "[out:json][timeout:180];\n"
        "(\n"
        f"  node[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"]({south},{west},{north},{east});\n"
        f"  way[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"]({south},{west},{north},{east});\n"
        f"  relation[\"amenity\"=\"place_of_worship\"][\"religion\"=\"muslim\"]({south},{west},{north},{east});\n"
        ");\n"
        "out center tags;\n"
    )


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def fetch_overpass(query: str) -> Dict[str, Any]:
    last_err = None
    for url in OVERPASS_ENDPOINTS:
        try:
            resp = requests.post(url, data={"data": query}, timeout=180)
            if resp.status_code == 200:
                data = resp.json()
                if "remark" in data:
                    logging.warning("Overpass remark: %s", data.get("remark"))
                return data
            last_err = f"HTTP {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            last_err = str(e)
        time.sleep(1)
    raise RuntimeError(f"Overpass request failed: {last_err}")


def normalize_item(el: Dict[str, Any]) -> Dict[str, Any]:
    tags = el.get("tags", {})
    name = tags.get("name") or tags.get("name:en") or tags.get("name:ar") or ""
    arabic_name = tags.get("name:ar")
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    address_parts = [
        tags.get("addr:street"),
        tags.get("addr:housenumber"),
        tags.get("addr:place"),
    ]
    address = ", ".join([p for p in address_parts if p]) or tags.get("addr:full") or tags.get("address")
    governorate = tags.get("addr:state") or tags.get("is_in:state") or "Unknown"
    city = tags.get("addr:city") or tags.get("is_in:city")
    neighborhood = tags.get("addr:suburb") or tags.get("addr:neighbourhood")

    return {
        "name": (name or "").strip() or "Unnamed Mosque",
        "arabic_name": arabic_name,
        "type": "مسجد",
        "governorate": governorate,
        "delegation": None,
        "city": city,
        "neighborhood": neighborhood,
        "address": address,
        "latitude": lat,
        "longitude": lon,
    }


def find_existing(lat: float, lon: float, name: str) -> Mosque | None:
    if lat is None or lon is None:
        return None
    # Quick bounding box ±0.002 ~ 220m
    q = Mosque.query.filter(
        Mosque.latitude.between(lat - 0.002, lat + 0.002),
        Mosque.longitude.between(lon - 0.002, lon + 0.002),
    ).all()
    for m in q:
        try:
            d = haversine(lat, lon, m.latitude or 0.0, m.longitude or 0.0)
        except Exception:
            d = 999999
        if d < 150:  # within 150m
            if (name and m.name and name.lower() == m.name.lower()) or not name:
                return m
    return None


def import_mosques(items: List[Dict[str, Any]]) -> Dict[str, int]:
    created = 0
    skipped = 0
    updated = 0
    for el in items:
        data = normalize_item(el)
        lat = data.get("latitude")
        lon = data.get("longitude")
        name = data.get("name")
        if lat is None or lon is None:
            skipped += 1
            continue
        existing = find_existing(lat, lon, name)
        if existing:
            # Optionally update missing fields
            changed = False
            for k in ("arabic_name", "address", "city", "neighborhood"):
                val = data.get(k)
                if val and not getattr(existing, k):
                    setattr(existing, k, val)
                    changed = True
            if changed:
                db.session.add(existing)
                updated += 1
            else:
                skipped += 1
            continue
        m = Mosque(
            name=data["name"],
            arabic_name=data.get("arabic_name"),
            type=data.get("type"),
            governorate=data.get("governorate") or "Unknown",
            delegation=None,
            city=data.get("city"),
            neighborhood=data.get("neighborhood"),
            address=data.get("address"),
            latitude=lat,
            longitude=lon,
            approved=True,
        )
        db.session.add(m)
        created += 1
    db.session.commit()
    return {"created": created, "updated": updated, "skipped": skipped}


def main():
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    load_dotenv()
    app = create_app(os.getenv("FLASK_ENV") or "development")
    with app.app_context():
        logging.info("Fetching mosques from Overpass (area queries)...")
        elements: List[Dict[str, Any]] = []
        for af in AREA_FILTERS:
            try:
                q = build_area_query(af)
                data = fetch_overpass(q)
                elements = data.get("elements", [])
                logging.info("Area filter '%s' -> %s elements", af, len(elements))
                if elements:
                    break
            except Exception as e:
                logging.warning("Area filter '%s' failed: %s", af, e)
        if not elements:
            logging.info("No elements via area; trying bbox fallback...")
            # Tunisia approx bbox (S,W,N,E)
            bbox_query = build_bbox_query(30.0, 7.0, 37.5, 12.0)
            data = fetch_overpass(bbox_query)
            elements = data.get("elements", [])
            logging.info("BBox fallback fetched %s elements", len(elements))
        stats = import_mosques(elements)
        logging.info("Import complete: %s", stats)


if __name__ == "__main__":
    main()
