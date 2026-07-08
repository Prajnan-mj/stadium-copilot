from __future__ import annotations

import pytest

from models import ZoneState
from ops import OpsManager


def make_zone(zone_id: str, status: str, occupancy: float = 50.0, eta_min: float | None = None) -> ZoneState:
    return ZoneState(id=zone_id, label=zone_id, occupancy=occupancy, status=status, eta_min=eta_min)


@pytest.fixture
def manager(nyj_venue):
    return OpsManager(nyj_venue)


def test_record_incident_stores_and_returns_entry(manager):
    entry = manager.record_incident("gate_c", "Long queue building")
    assert entry["zone_id"] == "gate_c"
    assert entry["text"] == "Long queue building"
    assert entry in manager.get_incidents()


def test_incident_log_caps_at_twenty(manager):
    for i in range(25):
        manager.record_incident("gate_a", f"incident {i}")
    assert len(manager.get_incidents()) == 20
    # oldest entries should have been evicted, newest retained
    assert manager.get_incidents()[-1]["text"] == "incident 24"


@pytest.mark.asyncio
async def test_no_recs_generated_when_all_zones_ok(manager):
    zones = [make_zone("gate_a", "ok"), make_zone("gate_b", "ok")]
    recs = await manager.maybe_generate_recs(zones, clock_min=0.0)
    assert recs == []


@pytest.mark.asyncio
async def test_rec_generated_on_status_change_to_critical(manager, monkeypatch):
    async def fake_dispatch(*args, **kwargs):
        return [{"priority": "P0", "zone_id": "gate_c", "action": "Hold entry", "reason": "over capacity"}]

    monkeypatch.setattr("ops.g.get_dispatch_recommendations", fake_dispatch)

    zones = [make_zone("gate_c", "critical", occupancy=92.0)]
    recs = await manager.maybe_generate_recs(zones, clock_min=10.0)

    assert len(recs) == 1
    assert recs[0].zone_id == "gate_c"
    assert recs[0].priority == "P0"


@pytest.mark.asyncio
async def test_falls_back_to_template_when_llm_returns_nothing(manager, monkeypatch):
    async def fake_dispatch(*args, **kwargs):
        return None

    monkeypatch.setattr("ops.g.get_dispatch_recommendations", fake_dispatch)

    zones = [make_zone("gate_d", "critical", occupancy=95.0)]
    recs = await manager.maybe_generate_recs(zones, clock_min=10.0)

    assert len(recs) == 1
    assert recs[0].zone_id == "gate_d"
    assert recs[0].priority == "P0"
    assert "gate_d" in recs[0].action  # template action references the zone label/id


@pytest.mark.asyncio
async def test_cooldown_suppresses_repeat_recs_for_same_zone(manager, monkeypatch):
    async def fake_dispatch(*args, **kwargs):
        return [{"priority": "P0", "zone_id": "gate_c", "action": "Hold", "reason": "full"}]

    monkeypatch.setattr("ops.g.get_dispatch_recommendations", fake_dispatch)

    zones = [make_zone("gate_c", "critical", occupancy=92.0)]
    first = await manager.maybe_generate_recs(zones, clock_min=10.0)
    assert len(first) == 1

    # status unchanged and still within cooldown window -> no new rec
    second = await manager.maybe_generate_recs(zones, clock_min=11.0)
    assert second == []


@pytest.mark.asyncio
async def test_global_rate_limit_caps_dispatches_per_minute(manager, monkeypatch):
    async def fake_dispatch(*args, **kwargs):
        return [{"priority": "P1", "zone_id": "gate_a", "action": "x", "reason": "y"}]

    monkeypatch.setattr("ops.g.get_dispatch_recommendations", fake_dispatch)

    # Three distinct zones newly turning critical, spaced past the per-zone
    # cooldown but within the same 60s wall-clock window used by the global limiter.
    z1 = [make_zone("gate_a", "critical", eta_min=2)]
    z2 = [make_zone("gate_a", "critical", eta_min=2), make_zone("gate_b", "critical", eta_min=2)]
    z3 = [make_zone("gate_a", "critical", eta_min=2), make_zone("gate_b", "critical", eta_min=2), make_zone("gate_c", "critical", eta_min=2)]

    r1 = await manager.maybe_generate_recs(z1, clock_min=10.0)
    r2 = await manager.maybe_generate_recs(z2, clock_min=20.0)
    r3 = await manager.maybe_generate_recs(z3, clock_min=30.0)

    dispatch_calls = [r for r in (r1, r2, r3) if r]
    assert len(dispatch_calls) <= 2  # global limiter allows at most 2 dispatches per 60s


def test_approve_rec_marks_approved_and_returns_it(manager):
    manager._recs["abc123"] = __import__("models").Recommendation(
        id="abc123", priority="P1", zone_id="gate_a", action="a", reason="b"
    )
    approved = manager.approve_rec("abc123")
    assert approved is not None
    assert approved.approved is True
    assert "abc123" not in [r.id for r in manager.get_active_recs()]


def test_approve_rec_unknown_id_returns_none(manager):
    assert manager.approve_rec("does-not-exist") is None


def test_get_active_recs_excludes_approved(manager):
    from models import Recommendation
    manager._recs["r1"] = Recommendation(id="r1", priority="P1", zone_id="gate_a", action="a", reason="b", approved=False)
    manager._recs["r2"] = Recommendation(id="r2", priority="P1", zone_id="gate_b", action="a", reason="b", approved=True)

    active = manager.get_active_recs()
    assert [r.id for r in active] == ["r1"]
