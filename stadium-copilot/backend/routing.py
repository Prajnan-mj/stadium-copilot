from __future__ import annotations
import heapq
from typing import Any
from models import RouteResult, RouteStep


WALK_SPEED = 75.0   # m/min standard
ACC_SPEED = 55.0    # m/min accessible


def _build_adj(edges: list[dict], accessible_only: bool) -> dict[str, list[tuple[float, str, dict]]]:
    adj: dict[str, list] = {}
    for e in edges:
        if accessible_only and not e.get("accessible", False):
            continue
        a, b, d = e["a"], e["b"], float(e["dist_m"])
        adj.setdefault(a, []).append((d, b, e))
        adj.setdefault(b, []).append((d, a, e))
    return adj


def find_route(
    venue: dict,
    from_node: str,
    to_node: str,
    accessible_only: bool = False,
) -> RouteResult | None:
    nodes_by_id = {n["id"]: n for n in venue["graph"]["nodes"]}
    adj = _build_adj(venue["graph"]["edges"], accessible_only)

    if from_node not in nodes_by_id or to_node not in nodes_by_id:
        return None

    dist: dict[str, float] = {from_node: 0.0}
    prev: dict[str, str | None] = {from_node: None}
    heap = [(0.0, from_node)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue
        for w, v, _ in adj.get(u, []):
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    if to_node not in dist:
        return None

    path: list[str] = []
    cur: str | None = to_node
    while cur is not None:
        path.append(cur)
        cur = prev.get(cur)
    path.reverse()

    steps = [
        RouteStep(
            node_id=nid,
            label=nodes_by_id[nid]["label"],
            x=nodes_by_id[nid]["x"],
            y=nodes_by_id[nid]["y"],
        )
        for nid in path
        if nid in nodes_by_id
    ]

    distance_m = dist[to_node]
    speed = ACC_SPEED if accessible_only else WALK_SPEED
    eta_min = round(distance_m / speed, 1)

    return RouteResult(
        steps=steps,
        distance_m=round(distance_m, 1),
        eta_min=eta_min,
        accessible=accessible_only,
    )


def section_to_node(venue: dict, section_str: str) -> str | None:
    try:
        sec_num = int("".join(filter(str.isdigit, section_str)))
    except (ValueError, TypeError):
        return None
    for s in venue.get("sections", []):
        lo, hi = s["range"]
        if lo <= sec_num <= hi:
            return s["node"]
    return None


def node_for_label(venue: dict, label: str) -> str | None:
    label_lower = label.lower()
    for n in venue["graph"]["nodes"]:
        if label_lower in n["label"].lower():
            return n["id"]
    return None
