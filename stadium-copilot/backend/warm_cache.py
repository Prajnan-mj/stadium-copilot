"""Pre-warm the response cache by POSTing canned queries to the running server."""
from __future__ import annotations
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
CANNED = os.path.join(os.path.dirname(__file__), "..", "data", "canned_queries.json")
DELAY = float(os.getenv("WARM_DELAY", "4"))


def post_chat(venue_id: str, query: str, lang: str = "en") -> dict:
    payload = json.dumps({
        "venue_id": venue_id,
        "message": query,
        "session_id": f"warm_{venue_id}_{hash(query) & 0xFFFF:04x}",
        "accessibility_mode": False,
        "image_base64": None,
        "user_context": {"section": None, "seat": None, "row": None},
    }).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}
    except Exception as e:
        return {"error": str(e)}


def main() -> None:
    queries = json.loads(open(CANNED, encoding="utf-8").read())
    print(f"Warming {len(queries)} queries against {BASE_URL} …", flush=True)

    for i, q in enumerate(queries, 1):
        resp = post_chat(q["venue_id"], q["query"], q.get("lang", "en"))
        source = resp.get("source", "?")
        snippet = (resp.get("reply_text") or "")[:60].replace("\n", " ")
        print(f"  [{i:02d}/{len(queries)}] {q['venue_id']} | {source} | {snippet}")
        if i < len(queries):
            time.sleep(DELAY)

    print("Done.", flush=True)


if __name__ == "__main__":
    main()
