"""Validates that the bundled venue/scenario data matches what the engine
expects. These are cheap to run and catch content-authoring mistakes
(a typo'd zone_id, a route edge pointing at a node that doesn't exist)
before they surface as a runtime KeyError during a live demo.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

import routing
from sim import SimEngine

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _load_venue(name: str) -> dict:
    with open(DATA_DIR / "venues" / f"{name}.json", encoding="utf-8") as f:
        return json.load(f)


def _load_all_scenarios() -> list[dict]:
    return [
        json.loads(p.read_text(encoding="utf-8"))
        for p in sorted((DATA_DIR / "scenarios").glob("*.json"))
    ]


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_venue_has_required_top_level_keys(venue_name):
    venue = _load_venue(venue_name)
    for key in ("venue_id", "fifa_name", "zones", "graph", "sections", "faqs", "policies"):
        assert key in venue, f"{venue_name}.json missing '{key}'"


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_venue_graph_edges_reference_existing_nodes(venue_name):
    venue = _load_venue(venue_name)
    node_ids = {n["id"] for n in venue["graph"]["nodes"]}
    for edge in venue["graph"]["edges"]:
        assert edge["a"] in node_ids, f"{venue_name}: edge references unknown node {edge['a']}"
        assert edge["b"] in node_ids, f"{venue_name}: edge references unknown node {edge['b']}"


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_venue_sections_reference_existing_nodes(venue_name):
    venue = _load_venue(venue_name)
    node_ids = {n["id"] for n in venue["graph"]["nodes"]}
    for section in venue["sections"]:
        assert section["node"] in node_ids, f"{venue_name}: section references unknown node {section['node']}"


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_every_node_is_reachable_from_every_gate(venue_name):
    """A fan at any gate must be able to route to every POI/section node."""
    venue = _load_venue(venue_name)
    gate_nodes = [n["id"] for n in venue["graph"]["nodes"] if n.get("kind") == "gate"]
    other_nodes = [n["id"] for n in venue["graph"]["nodes"] if n.get("kind") != "gate"]

    assert gate_nodes, f"{venue_name}: expected at least one gate node"
    origin = gate_nodes[0]
    for target in other_nodes:
        result = routing.find_route(venue, origin, target)
        assert result is not None, f"{venue_name}: no route from {origin} to {target}"


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_zone_ids_are_unique(venue_name):
    venue = _load_venue(venue_name)
    zone_ids = [z["id"] for z in venue["zones"]]
    assert len(zone_ids) == len(set(zone_ids))


def test_all_scenarios_load_and_have_required_fields():
    scenarios = _load_all_scenarios()
    assert len(scenarios) >= 4
    for s in scenarios:
        assert "id" in s
        assert "timeline" in s
        assert isinstance(s["timeline"], list)


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_every_scenario_zone_reference_exists_in_venue(venue_name):
    venue = _load_venue(venue_name)
    zone_ids = {z["id"] for z in venue["zones"]}
    zone_types = {z["type"] for z in venue["zones"]}

    for scenario in _load_all_scenarios():
        for mod in scenario["timeline"]:
            if "zone_id" in mod:
                assert mod["zone_id"] in zone_ids, (
                    f"{venue_name}: scenario {scenario['id']} references unknown zone_id {mod['zone_id']}"
                )
            if "zone_type" in mod:
                assert mod["zone_type"] in zone_types, (
                    f"{venue_name}: scenario {scenario['id']} references unknown zone_type {mod['zone_type']}"
                )


@pytest.mark.parametrize("venue_name", ["nyj", "mia"])
def test_scenario_applies_cleanly_to_sim_engine(venue_name):
    """Every canned scenario should apply without raising and should leave the
    engine tickable — this is exactly what the 'Simulation' bottom-bar buttons
    trigger in the Ops UI."""
    venue = _load_venue(venue_name)
    for scenario in _load_all_scenarios():
        engine = SimEngine(venue, seed=26)
        engine.apply_scenario(scenario)
        engine._tick()  # should not raise
        for zone in engine.zones.values():
            assert 0.0 <= zone.occupancy <= 110.0
