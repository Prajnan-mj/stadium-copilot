from __future__ import annotations

import routing


def test_find_route_returns_path_between_gate_and_concourse(nyj_venue):
    result = routing.find_route(nyj_venue, "n_gate_a", "n_conc_n")

    assert result is not None
    assert result.steps[0].node_id == "n_gate_a"
    assert result.steps[-1].node_id == "n_conc_n"
    assert result.distance_m > 0
    assert result.eta_min > 0
    assert result.accessible is False


def test_find_route_unknown_node_returns_none(nyj_venue):
    assert routing.find_route(nyj_venue, "n_gate_a", "does_not_exist") is None
    assert routing.find_route(nyj_venue, "does_not_exist", "n_gate_a") is None


def test_find_route_same_node_is_zero_distance(nyj_venue):
    result = routing.find_route(nyj_venue, "n_gate_a", "n_gate_a")

    assert result is not None
    assert result.distance_m == 0
    assert result.steps == [result.steps[0]]


def test_accessible_route_uses_accessible_speed_and_edges(nyj_venue):
    result = routing.find_route(nyj_venue, "n_gate_a", "n_conc_n", accessible_only=True)

    assert result is not None
    assert result.accessible is True
    # accessible walkers are slower, so ETA for the same distance is >= standard
    standard = routing.find_route(nyj_venue, "n_gate_a", "n_conc_n", accessible_only=False)
    if result.distance_m == standard.distance_m:
        assert result.eta_min >= standard.eta_min


def test_accessible_only_excludes_inaccessible_edges(nyj_venue):
    venue = {
        "graph": {
            "nodes": [
                {"id": "a", "label": "A", "x": 0, "y": 0},
                {"id": "b", "label": "B", "x": 1, "y": 0},
            ],
            "edges": [
                {"a": "a", "b": "b", "dist_m": 10, "accessible": False},
            ],
        }
    }
    assert routing.find_route(venue, "a", "b", accessible_only=False) is not None
    assert routing.find_route(venue, "a", "b", accessible_only=True) is None


def test_find_route_picks_shortest_path_over_longer_alternative():
    venue = {
        "graph": {
            "nodes": [
                {"id": "a", "label": "A", "x": 0, "y": 0},
                {"id": "b", "label": "B", "x": 1, "y": 0},
                {"id": "c", "label": "C", "x": 2, "y": 0},
                {"id": "d", "label": "D", "x": 3, "y": 0},
            ],
            "edges": [
                {"a": "a", "b": "d", "dist_m": 100, "accessible": True},
                {"a": "a", "b": "b", "dist_m": 10, "accessible": True},
                {"a": "b", "b": "c", "dist_m": 10, "accessible": True},
                {"a": "c", "b": "d", "dist_m": 10, "accessible": True},
            ],
        }
    }
    result = routing.find_route(venue, "a", "d")
    assert result.distance_m == 30
    assert [s.node_id for s in result.steps] == ["a", "b", "c", "d"]


def test_section_to_node_finds_matching_range(nyj_venue):
    node = routing.section_to_node(nyj_venue, "112")
    section = next(s for s in nyj_venue["sections"] if s["range"][0] <= 112 <= s["range"][1])
    assert node == section["node"]


def test_section_to_node_handles_non_numeric_input(nyj_venue):
    assert routing.section_to_node(nyj_venue, "not-a-section") is None


def test_section_to_node_out_of_any_range_returns_none(nyj_venue):
    assert routing.section_to_node(nyj_venue, "99999") is None


def test_node_for_label_case_insensitive_partial_match(nyj_venue):
    node_id = routing.node_for_label(nyj_venue, "gate a")
    assert node_id == "n_gate_a"


def test_node_for_label_no_match_returns_none(nyj_venue):
    assert routing.node_for_label(nyj_venue, "nonexistent place") is None
