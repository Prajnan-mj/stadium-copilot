from __future__ import annotations
import re
from rank_bm25 import BM25Okapi

MAX_CONTEXT_TOKENS = 1800
APPROX_CHARS_PER_TOKEN = 4


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def build_chunks(venue: dict) -> list[dict]:
    chunks: list[dict] = []

    header = (
        f"{venue['fifa_name']} ({venue['real_name']}), {venue['city']}. "
        f"Capacity: {venue['capacity']:,}. "
        f"Marquee match: {venue['marquee_match']['label']} on {venue['marquee_match']['date']} "
        f"at {venue['marquee_match']['kickoff_local']}. "
        f"Climate: {venue['climate']['advisory']} "
        f"Policies: bags — {venue['policies']['bags']}. Re-entry: {venue['policies']['reentry']}. "
        f"Smoking: {venue['policies']['smoking']}. "
        f"Emergency: {venue['emergency']['instruction']}"
    )
    chunks.append({"text": header, "tags": ["venue", "header", "capacity", "climate", "bags", "policy"], "weight": 3})

    for poi in venue.get("pois", []):
        text = f"{poi['label']} (node: {poi['node']}, type: {poi['type']})"
        chunks.append({"text": text, "tags": poi.get("tags", []) + [poi["type"]], "id": poi["id"]})

    for transit in venue.get("transit", []):
        rec = " [RECOMMENDED]" if transit.get("recommended") else ""
        text = f"Transit option{rec}: {transit['name']} ({transit['mode']}). {transit['notes']}"
        chunks.append({"text": text, "tags": ["transit", "transport", "arrival", "departure", transit["mode"]]})

    for faq in venue.get("faqs", []):
        text = f"Q: {faq['q']}\nA: {faq['a']}"
        chunks.append({"text": text, "tags": faq.get("tags", [])})

    for zone in venue.get("zones", []):
        text = f"Zone {zone['label']} (id: {zone['id']}, type: {zone['type']}, capacity/min: {zone.get('capacity_per_min', 'N/A')})"
        chunks.append({"text": text, "tags": ["zone", zone["type"], zone["id"]]})

    pol_text = (
        f"Prohibited items: {', '.join(venue['policies'].get('prohibited', []))}. "
        f"Bag policy: {venue['policies']['bags']}."
    )
    chunks.append({"text": pol_text, "tags": ["prohibited", "bags", "policy", "rules"]})

    return chunks


def retrieve(query: str, chunks: list[dict], top_k: int = 6) -> list[dict]:
    if not chunks:
        return []

    corpus = [_tokenize(c["text"]) for c in chunks]
    bm25 = BM25Okapi(corpus)
    q_tokens = _tokenize(query)
    scores = bm25.get_scores(q_tokens)

    for i, chunk in enumerate(chunks):
        for tag in chunk.get("tags", []):
            if tag.lower() in query.lower():
                scores[i] += 2.0
        scores[i] *= chunk.get("weight", 1)

    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)

    selected: list[dict] = []
    total_chars = 0
    limit = MAX_CONTEXT_TOKENS * APPROX_CHARS_PER_TOKEN

    for i in ranked[:top_k]:
        text = chunks[i]["text"]
        if total_chars + len(text) > limit:
            break
        selected.append(chunks[i])
        total_chars += len(text)

    return selected


def format_context(header_chunk: dict, selected: list[dict], seat_chunk: dict | None = None) -> str:
    parts = [header_chunk["text"]]
    if seat_chunk:
        parts.append(seat_chunk["text"])
    for c in selected:
        if c["text"] != header_chunk["text"]:
            parts.append(c["text"])
    return "\n\n".join(parts)
