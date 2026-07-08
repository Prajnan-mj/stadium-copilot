from __future__ import annotations

import pytest

from sim import SimEngine, _piecewise


def test_piecewise_interpolates_between_segments():
    segments = [(-10, 0, 0.0), (0, 0, 10.0), (10, 0, 0.0)]
    assert _piecewise(-10, segments) == 0.0
    assert _piecewise(0, segments) == 10.0
    assert _piecewise(-5, segments) == pytest.approx(5.0)


def test_piecewise_out_of_range_clamps_to_last_segment():
    segments = [(-10, 0, 1.0), (0, 0, 2.0)]
    assert _piecewise(100, segments) == 2.0


@pytest.fixture
def engine(nyj_venue):
    return SimEngine(nyj_venue, seed=26)


def test_sim_engine_initializes_all_zones_at_zero(engine, nyj_venue):
    assert set(engine.zones.keys()) == {z["id"] for z in nyj_venue["zones"]}
    for zone in engine.zones.values():
        assert zone.occupancy == 0.0
        assert zone.status == "ok"


def test_tick_advances_clock_by_one_minute(engine):
    start = engine.clock
    engine._tick()
    assert engine.clock == start + 1.0


def test_tick_keeps_occupancy_within_bounds(engine):
    for _ in range(400):
        engine._tick()
    for zone in engine.zones.values():
        assert 0.0 <= zone.occupancy <= 110.0


def test_tick_caps_history_length(engine):
    for _ in range(50):
        engine._tick()
    for zone in engine.zones.values():
        assert len(zone.history) <= 30


def test_status_thresholds_are_consistent_with_occupancy(engine):
    for _ in range(300):
        engine._tick()
    for zone in engine.zones.values():
        if zone.status == "critical":
            assert zone.occupancy > 85 or (zone.eta_min is not None and zone.eta_min < 8)
        elif zone.status == "ok":
            assert zone.occupancy <= 70 or zone.eta_min is None or zone.eta_min >= 15


def test_reset_restores_initial_state(engine):
    for _ in range(50):
        engine._tick()
    assert any(z.occupancy > 0 for z in engine.zones.values())

    engine.reset()

    assert engine.clock == -120.0
    for zone in engine.zones.values():
        assert zone.occupancy == 0.0
        assert zone.status == "ok"
        assert zone.history == []
        assert zone.eta_min is None


def test_reset_is_deterministic_with_same_seed(nyj_venue):
    e1 = SimEngine(nyj_venue, seed=26)
    e2 = SimEngine(nyj_venue, seed=26)

    for _ in range(60):
        e1._tick()
        e2._tick()

    for zone_id in e1.zones:
        assert e1.zones[zone_id].occupancy == e2.zones[zone_id].occupancy


def test_set_speed_clamps_to_valid_range(engine):
    engine.set_speed(100)
    assert engine.speed == 10.0
    engine.set_speed(0)
    assert engine.speed == 0.1
    engine.set_speed(2)
    assert engine.speed == 2.0


def test_add_inflow_increases_occupancy_and_marks_live_source(engine):
    zone_id = "gate_a"
    before = engine.zones[zone_id].occupancy
    engine.add_inflow(zone_id, 10)
    assert engine.zones[zone_id].occupancy > before
    assert engine.zones[zone_id].live_source is True


def test_add_inflow_unknown_zone_is_a_noop(engine):
    engine.add_inflow("not_a_real_zone", 10)  # should not raise


def test_apply_scenario_by_zone_id_sets_modifier_and_affects_next_tick(engine):
    engine.apply_scenario({
        "timeline": [
            {"zone_id": "gate_c", "t_offset_min": 0, "duration_min": 30, "inflow_mult": 3.0},
        ]
    })
    assert "gate_c" in engine._modifiers
    assert engine._modifiers["gate_c"]["inflow_mult"] == 3.0


def test_apply_scenario_by_zone_type_applies_to_all_matching_zones(engine):
    engine.apply_scenario({
        "timeline": [
            {"zone_type": "gate", "t_offset_min": 0, "duration_min": 30, "inflow_mult": 2.0},
        ]
    })
    gate_ids = [zid for zid, z in engine._zone_types.items() if z == "gate"]
    assert gate_ids
    for zid in gate_ids:
        assert zid in engine._modifiers


def test_apply_scenario_jump_clock_to(engine):
    engine.apply_scenario({"jump_clock_to": 45})
    assert engine.clock == 45.0


def test_get_state_reflects_current_clock_and_zones(engine):
    engine._tick()
    state = engine.get_state()
    assert state.venue_id == engine.venue_id
    assert state.clock_min == round(engine.clock, 1)
    assert len(state.zones) == len(engine.zones)
