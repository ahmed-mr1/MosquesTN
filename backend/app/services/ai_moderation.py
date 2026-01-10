import os
import json
import re
import logging
from typing import Dict, Any
from google import genai

_SPAM_PATTERNS = [
    r"(?i)free money|click here|subscribe|http[s]?://",
]
_HATE_PATTERNS = [
    r"(?i)kill|hate|racist|sexist|violent|terror|bomb",
]
_NONSENSE_PATTERNS = [
    r"^[^A-Za-z0-9\s]{10,}$",
]


def _heuristic_moderate(text: str) -> Dict[str, Any]:
    t = text or ""
    if any(re.search(p, t) for p in _SPAM_PATTERNS + _HATE_PATTERNS + _NONSENSE_PATTERNS):
        return {"decision": "rejected", "labels": ["heuristic"]}
    if len(t.strip()) < 5:
        return {"decision": "rejected", "labels": ["empty"]}
    return {"decision": "valid", "labels": ["heuristic"]}


def _first_text_from_response(resp) -> str:
    try:
        if getattr(resp, "text", None):
            return (resp.text or "").strip()
        # Fallback: try candidates/parts
        cands = getattr(resp, "candidates", []) or []
        if cands:
            parts = getattr(cands[0].content, "parts", []) or []
            texts = [getattr(p, "text", "") for p in parts]
            joined = "".join([t for t in texts if t])
            if joined:
                return joined.strip()
    except Exception:
        pass
    return ""


def moderate_text(text: str) -> Dict[str, Any]:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        result = _heuristic_moderate(text)
        logging.getLogger(__name__).info(
            "AI moderation: heuristic used (missing GEMINI_API_KEY); decision=%s labels=%s",
            result.get("decision"), result.get("labels")
        )
        return result

    try:
        # Use maintained google.genai client
        client = genai.Client(api_key=api_key)
        prompt = (
            "You are a strict content moderation tool for community submissions about mosques in Tunisia.\n"
            "Classify the INPUT as either 'rejected' or 'valid'.\n"
            "Respond ONLY with a single minified JSON object with keys: decision, labels.\n"
            "Example: {\"decision\":\"valid\",\"labels\":[\"gemini\"]}\n\n"
            "INPUT:\n" + (text or "")
        )
        resp = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
        )
        raw = _first_text_from_response(resp)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", raw)
            if not m:
                logging.getLogger(__name__).warning(
                    "AI moderation: Gemini returned non-JSON (len=%s, head=%s)...",
                    len(raw), raw[:200]
                )
                raise
            data = json.loads(m.group(0))

        decision = data.get("decision")
        if decision in ("valid", "rejected"):
            result = {"decision": decision, "labels": data.get("labels") or ["gemini"]}
            logging.getLogger(__name__).info(
                "AI moderation: Gemini used; decision=%s labels=%s",
                result.get("decision"), result.get("labels")
            )
            return result

        raise ValueError("Invalid Gemini response format: missing decision/labels")

    except Exception as e:
        result = _heuristic_moderate(text)
        logging.getLogger(__name__).warning(
            "AI moderation: Gemini error (%s); heuristic fallback; decision=%s labels=%s",
            type(e).__name__, result.get("decision"), result.get("labels")
        )
        return result
