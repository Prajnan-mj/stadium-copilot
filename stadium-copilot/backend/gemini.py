from __future__ import annotations
import asyncio
import json
import os
import time
from pathlib import Path

from openai import OpenAI, RateLimitError

CHAT_MODEL = os.getenv("NVIDIA_CHAT_MODEL", "meta/llama-3.1-70b-instruct")
LITE_MODEL = os.getenv("NVIDIA_LITE_MODEL", "meta/llama-3.1-8b-instruct")
VISION_MODEL = os.getenv("NVIDIA_VISION_MODEL", "meta/llama-3.2-11b-vision-instruct")
DEMO_MODE = os.getenv("DEMO_MODE", "0") == "1"
_NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
CACHE_FILE = Path(__file__).parent.parent / "data" / "response_cache.json"

_client: OpenAI | None = None
_cache: dict[str, dict] = {}
_api_ok = True

# Token bucket — NVIDIA free tier: ~20 req/min
_bucket_tokens = 20.0
_bucket_last = time.monotonic()
_BUCKET_RATE = 20.0 / 60.0
_BUCKET_MAX = 20.0


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("NVIDIA_API_KEY", "")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY is not set")
        _client = OpenAI(base_url=_NVIDIA_BASE, api_key=api_key)
    return _client


def load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8")


def load_cache() -> None:
    global _cache
    if CACHE_FILE.exists():
        try:
            _cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            _cache = {}


def save_cache() -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        CACHE_FILE.write_text(json.dumps(_cache, ensure_ascii=False, indent=2), encoding="utf-8")
    except (TypeError, ValueError):
        pass  # non-serializable value in cache entry, skip to avoid crashing


def cache_key(venue_id: str, query: str, lang: str = "en", accessibility: bool = False) -> str:
    q = query.strip().lower()[:120]
    return f"{venue_id}|{q}|{lang}|{accessibility}"


def get_cached(key: str) -> dict | None:
    return _cache.get(key)


def set_cached(key: str, value: dict) -> None:
    _cache[key] = value
    save_cache()


def _consume_token() -> bool:
    global _bucket_tokens, _bucket_last
    now = time.monotonic()
    elapsed = now - _bucket_last
    _bucket_last = now
    _bucket_tokens = min(_BUCKET_MAX, _bucket_tokens + elapsed * _BUCKET_RATE)
    if _bucket_tokens >= 1.0:
        _bucket_tokens -= 1.0
        return True
    return False


def is_gemini_ok() -> bool:
    return _api_ok


async def chat_with_tools(
    system_prompt: str,
    history: list[dict],
    user_message: str,
    tools: list | None = None,
    image_base64: str | None = None,
) -> tuple[str, str]:
    """Returns (reply_text, detected_lang)."""
    global _api_ok

    if not _consume_token():
        return _template_reply(), "en"

    try:
        client = get_client()
    except ValueError:
        return _template_reply(), "en"

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for turn in history[-16:]:
        role = "user" if turn["role"] == "user" else "assistant"
        messages.append({"role": role, "content": turn["content"]})

    if image_base64:
        user_content = [
            {"type": "text", "text": user_message},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
        ]
    else:
        user_content = user_message  # type: ignore[assignment]

    messages.append({"role": "user", "content": user_content})

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=CHAT_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        _api_ok = True
        text = response.choices[0].message.content or ""
        lang = _detect_lang_heuristic(text)
        return text, lang
    except RateLimitError:
        await asyncio.sleep(3)
        return _template_reply(), "en"
    except Exception:
        _api_ok = False
        return _template_reply(), "en"


async def extract_ticket(image_base64: str) -> dict:
    global _api_ok
    if not _consume_token():
        return {"section": None, "row": None, "seat": None, "confidence": 0.0}

    try:
        client = get_client()
    except ValueError:
        return {"section": None, "row": None, "seat": None, "confidence": 0.0}

    prompt = load_prompt("ticket_vision.md")
    prompt += "\n\nRespond with valid JSON only: {\"section\": ..., \"row\": ..., \"seat\": ..., \"confidence\": 0.0-1.0}"

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                ],
            }],
            max_tokens=256,
            temperature=0.1,
        )
        _api_ok = True
        raw = response.choices[0].message.content or "{}"
        # Extract JSON even if wrapped in markdown
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        return json.loads(raw)
    except Exception:
        _api_ok = False
        return {"section": None, "row": None, "seat": None, "confidence": 0.0}


async def get_dispatch_recommendations(state_json: str, incidents_json: str, venue_name: str) -> list[dict]:
    global _api_ok
    if not _consume_token():
        return []

    try:
        client = get_client()
    except ValueError:
        return []

    prompt_tmpl = load_prompt("dispatch.md")
    prompt = (
        prompt_tmpl
        .replace("{venue_fifa_name}", venue_name)
        .replace("{state_json}", state_json)
        .replace("{incidents_json}", incidents_json)
    )
    prompt += "\n\nRespond with valid JSON only: {\"recommendations\": [{\"priority\": \"P0|P1|P2\", \"zone_id\": \"...\", \"action\": \"...\", \"reason\": \"...\", \"alternate_zone\": null, \"expires_min\": 15}]}"

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        _api_ok = True
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        return data.get("recommendations", [])
    except Exception:
        _api_ok = False
        return []


async def translate_announcement(text: str, lang_codes: list[str]) -> dict[str, str]:
    global _api_ok
    if not _consume_token() or not lang_codes:
        return {"en": text}

    try:
        client = get_client()
    except ValueError:
        return {"en": text}

    prompt_tmpl = load_prompt("announce_translate.md")
    prompt = prompt_tmpl.replace("{lang_codes}", ", ".join(lang_codes)).replace("{text}", text)
    prompt += "\n\nRespond with valid JSON only: {\"translations\": {\"en\": \"...\", \"es\": \"...\", ...}}"

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=LITE_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        _api_ok = True
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        return data.get("translations", {"en": text})
    except Exception:
        _api_ok = False
        return {"en": text}


def _detect_lang_heuristic(text: str) -> str:
    samples = {
        "pt": ["você", "está", "fica", "pode", "não", "para", "com", "uma"],
        "es": ["usted", "está", "puede", "para", "con", "una", "del"],
        "hi": ["आप", "है", "यह", "में", "के", "और"],
        "no": ["det", "er", "og", "til", "for", "ikke", "den"],
        "fr": ["vous", "est", "pour", "avec", "une", "les"],
        "de": ["Sie", "ist", "und", "für", "nicht", "eine"],
    }
    text_lower = text.lower()
    for lang, words in samples.items():
        hits = sum(1 for w in words if w.lower() in text_lower)
        if hits >= 2:
            return lang
    return "en"


def _template_reply() -> str:
    return "I'm having trouble connecting right now. Please visit the Fan Help Desk for assistance."
