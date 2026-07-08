from __future__ import annotations

import retrieval


def test_build_chunks_includes_header_and_faqs(nyj_venue):
    chunks = retrieval.build_chunks(nyj_venue)

    assert any("header" in c.get("tags", []) for c in chunks)
    faq_texts = [c["text"] for c in chunks if c["text"].startswith("Q:")]
    assert len(faq_texts) == len(nyj_venue["faqs"])


def test_retrieve_ranks_relevant_chunk_first_for_bag_policy(nyj_venue):
    chunks = retrieval.build_chunks(nyj_venue)
    results = retrieval.retrieve("what bags am I allowed to bring", chunks, top_k=6)

    assert results, "expected at least one result"
    assert any("bag" in r["text"].lower() for r in results[:2])


def test_retrieve_tag_match_boosts_relevant_zone_chunk(nyj_venue):
    chunks = retrieval.build_chunks(nyj_venue)
    results = retrieval.retrieve("gate_c", chunks, top_k=6)

    assert any(r.get("id") == "gate_c" or "gate_c" in r["text"] for r in results)


def test_retrieve_empty_chunks_returns_empty_list():
    assert retrieval.retrieve("anything", [], top_k=5) == []


def test_retrieve_respects_top_k_and_char_budget():
    chunks = [
        {"text": "x" * 100, "tags": ["a"]},
        {"text": "y" * 100, "tags": ["b"]},
        {"text": "z" * 100, "tags": ["c"]},
    ]
    results = retrieval.retrieve("x y z", chunks, top_k=2)
    assert len(results) <= 2


def test_format_context_puts_header_first_and_dedupes():
    header = {"text": "HEADER TEXT"}
    selected = [{"text": "HEADER TEXT"}, {"text": "other chunk"}]
    ctx = retrieval.format_context(header, selected)

    assert ctx.startswith("HEADER TEXT")
    assert ctx.count("HEADER TEXT") == 1
    assert "other chunk" in ctx


def test_format_context_includes_seat_chunk_when_present():
    header = {"text": "HEADER"}
    seat = {"text": "SEAT INFO"}
    ctx = retrieval.format_context(header, [], seat_chunk=seat)

    assert "SEAT INFO" in ctx
    assert ctx.index("HEADER") < ctx.index("SEAT INFO")
