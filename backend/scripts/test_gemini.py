import os
import json
import logging
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure backend root is on sys.path so `app` imports work
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Stable SDK
import google.generativeai as genai


def _first_text_from_response(resp) -> str:
    try:
        if getattr(resp, "text", None):
            return (resp.text or "").strip()
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


def main():
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    load_dotenv()
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    print(f"GEMINI_API_KEY set: {bool(api_key)} length: {len(api_key)}")
    if not api_key:
        print("No GEMINI_API_KEY set. Exiting.")
        return

    # Configure SDK
    genai.configure(api_key=api_key)

    print("\n== List models ==")
    try:
        models = list(genai.list_models())
        supported = [m for m in models if 'generateContent' in getattr(m, 'supported_generation_methods', [])]
        names = [m.name for m in supported]
        print("Models supporting generateContent (first 10):", names[:10])
    except Exception as e:
        print("List models failed:", type(e).__name__, e)

    # Prefer common flash model if available
    preferred_order = (
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-pro-exp",
    )
    selected = None
    try:
        for p in preferred_order:
            if any(m for m in genai.list_models() if getattr(m, 'name', '') == p):
                selected = p
                break
        if not selected:
            # Fallback to first generateContent-capable model
            for m in genai.list_models():
                if 'generateContent' in getattr(m, 'supported_generation_methods', []):
                    selected = m.name
                    break
        print("Selected model:", selected)
    except Exception as e:
        print("Model selection failed:", type(e).__name__, e)

    print("\n== Simple text test ==")
    try:
        model_text = genai.GenerativeModel(selected or "gemini-1.5-flash")
        resp_text = model_text.generate_content("Say hello politely.")
        print("Response:", _first_text_from_response(resp_text))
    except Exception as e:
        print("Simple text test failed:", type(e).__name__, e)

    print("\n== JSON classification test (direct) ==")
    try:
        model_json = genai.GenerativeModel(
            selected or "gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )
        prompt = (
            "You are a strict content moderation tool for community submissions about mosques in Tunisia.\n"
            "Classify the INPUT as either 'rejected' or 'valid'.\n"
            "Respond ONLY with a single minified JSON object with keys: decision, labels.\n"
            "Example: {\"decision\":\"valid\",\"labels\":[\"gemini\"]}\n\n"
            "INPUT:\nClean and respectful review text"
        )
        resp_json = model_json.generate_content(prompt)
        raw = _first_text_from_response(resp_json)
        print("Raw JSON text head:", raw[:200])
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", raw)
            if not m:
                raise
            data = json.loads(m.group(0))
        print("Parsed:", data)
    except Exception as e:
        print("JSON classification failed:", type(e).__name__, e)

    print("\n== Service moderate_text() comparison ==")
    try:
        from app.services.ai_moderation import moderate_text
        print("Service (clean):", moderate_text("Clean and respectful review text"))
        print("Service (spam):", moderate_text("click here http://spam"))
    except Exception as e:
        print("Service moderate_text() failed:", type(e).__name__, e)


if __name__ == "__main__":
    main()
