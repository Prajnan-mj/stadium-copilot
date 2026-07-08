"""HTTP-level smoke tests for main.py's FastAPI routes.

These run the real app (startup event boots the sim engines for nyj/mia),
but never hit the NVIDIA API: with no NVIDIA_API_KEY configured, gemini.py's
translate/dispatch calls degrade gracefully to their fallback paths, so these
tests stay fast and offline.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c


def test_health_endpoint_reports_ok(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["gemini"] in ("ok", "degraded")


def test_list_venues_includes_seeded_venues(client):
    res = client.get("/api/venues")
    assert res.status_code == 200
    ids = {v["venue_id"] for v in res.json()}
    assert "nyj" in ids


def test_get_known_venue_returns_full_payload(client):
    res = client.get("/api/venues/nyj")
    assert res.status_code == 200
    assert res.json()["venue_id"] == "nyj"


def test_get_unknown_venue_returns_404(client):
    res = client.get("/api/venues/does-not-exist")
    assert res.status_code == 404


def test_ops_state_for_known_venue_has_zones_and_recs(client):
    res = client.get("/api/ops/state/nyj")
    assert res.status_code == 200
    body = res.json()
    assert "zones" in body and len(body["zones"]) > 0
    assert "recs" in body
    assert "clock_min" in body


def test_ops_state_for_unknown_venue_returns_404(client):
    res = client.get("/api/ops/state/nowhere")
    assert res.status_code == 404


def test_incident_endpoint_records_and_returns_entry(client):
    res = client.post("/api/ops/incident", json={
        "venue_id": "nyj", "zone_id": "gate_c", "text": "Long queue forming",
    })
    assert res.status_code == 200
    body = res.json()
    assert body["zone_id"] == "gate_c"
    assert body["text"] == "Long queue forming"


def test_incident_unknown_venue_returns_404(client):
    res = client.post("/api/ops/incident", json={
        "venue_id": "nowhere", "zone_id": "gate_c", "text": "x",
    })
    assert res.status_code == 404


def test_approve_unknown_rec_returns_404(client):
    res = client.post("/api/ops/approve", json={"venue_id": "nyj", "rec_id": "no-such-id"})
    assert res.status_code == 404


def test_announce_without_api_key_falls_back_to_english_only(client):
    res = client.post("/api/ops/announce", json={"venue_id": "nyj", "text": "Gate C is closed"})
    assert res.status_code == 200
    body = res.json()
    assert body["translations"].get("en") == "Gate C is closed"


def test_announce_unknown_venue_returns_404(client):
    res = client.post("/api/ops/announce", json={"venue_id": "nowhere", "text": "hi"})
    assert res.status_code == 404


def test_scenario_reset_applies_to_known_venue(client):
    res = client.post("/api/director/scenario", json={
        "venue_id": "nyj", "scenario_id": "reset", "speed": 1.0,
    })
    assert res.status_code == 200
    assert res.json()["applied"] == "reset"


def test_scenario_unknown_id_returns_404(client):
    res = client.post("/api/director/scenario", json={
        "venue_id": "nyj", "scenario_id": "not-a-real-scenario", "speed": 1.0,
    })
    assert res.status_code == 404


def test_scenario_unknown_venue_returns_404(client):
    res = client.post("/api/director/scenario", json={
        "venue_id": "nowhere", "scenario_id": "reset", "speed": 1.0,
    })
    assert res.status_code == 404


def test_cv_count_bumps_zone_occupancy(client):
    before = client.get("/api/ops/state/nyj").json()
    zone_before = next(z for z in before["zones"] if z["id"] == "gate_a")

    res = client.post("/api/cv/count", json={"venue_id": "nyj", "zone_id": "gate_a", "delta": 5})
    assert res.status_code == 200

    after = client.get("/api/ops/state/nyj").json()
    zone_after = next(z for z in after["zones"] if z["id"] == "gate_a")
    assert zone_after["occupancy"] >= zone_before["occupancy"]
