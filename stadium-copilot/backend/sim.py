from __future__ import annotations
import asyncio
import random
from models import ZoneState, SimState


def _piecewise(t: float, segments: list[tuple[float, float, float]]) -> float:
    """Linear interpolation over (t_start, t_end, value) segments."""
    for i in range(len(segments) - 1):
        t0, _, v0 = segments[i]
        t1, _, v1 = segments[i + 1]
        if t0 <= t <= t1:
            frac = (t - t0) / (t1 - t0) if t1 != t0 else 0.0
            return v0 + frac * (v1 - v0)
    return segments[-1][2]


# Occupancy delta per minute (% pts/min) — stock-and-flow model.
# Integral from -120 → 0 ≈ +92% for gates (peaks just before kickoff).
GATE_OCC_CURVE = [
    (-120, 0, 0.05), (-90, 0, 0.30), (-60, 0, 0.80), (-30, 0, 1.50),
    (-15, 0, 1.80), (-5, 0, 1.80), (0, 0, -4.00), (10, 0, -2.00),
    (44, 0, -1.00), (45, 0, 1.50), (65, 0, 1.50), (66, 0, -2.50),
    (90, 0, -1.00), (93, 0, 1.50), (115, 0, 2.00), (133, 0, -2.50), (160, 0, 0.0),
]

# Concourses: build pre-game, quiet during play, surge at halftime/egress.
CONCOURSE_OCC_CURVE = [
    (-120, 0, 0.02), (-90, 0, 0.15), (-60, 0, 0.40), (-30, 0, 0.60),
    (-5, 0, 0.60), (0, 0, 0.10), (44, 0, 0.10),
    (45, 0, 2.00), (65, 0, 2.00), (66, 0, -2.00), (90, 0, 0.20),
    (93, 0, 1.50), (115, 0, 2.00), (133, 0, -2.50), (160, 0, 0.0),
]

# Keep these for inflow display only
GATE_INFLOW_CURVE = [
    (-120, 0, 5), (-90, 0, 20), (-60, 0, 60), (-30, 0, 85),
    (-15, 0, 90), (0, 0, 30), (45, 0, 8), (90, 0, 12),
    (93, 0, 72), (133, 0, 88), (160, 0, 10),
]

CONCOURSE_INFLOW_CURVE = [
    (-120, 0, 2), (-30, 0, 15), (0, 0, 10), (44, 0, 10),
    (45, 0, 65), (65, 0, 65), (66, 0, 15), (90, 0, 12),
    (93, 0, 82), (133, 0, 82), (160, 0, 5),
]


class SimEngine:
    def __init__(self, venue: dict, seed: int = 26) -> None:
        self.venue = venue
        self.venue_id = venue["venue_id"]
        self.seed = seed
        self.rng = random.Random(seed)
        self.clock: float = -120.0
        self.speed: float = 1.0
        self.running = False
        self._task: asyncio.Task | None = None
        self._modifiers: dict[str, dict] = {}  # zone_id -> {inflow_mult, capacity_mult, until_clock}

        self.zones: dict[str, ZoneState] = {}
        for z in venue["zones"]:
            self.zones[z["id"]] = ZoneState(
                id=z["id"],
                label=z["label"],
                occupancy=0.0,
                status="ok",
                history=[],
            )
        self._cap_per_min: dict[str, float] = {z["id"]: float(z.get("capacity_per_min", 60)) for z in venue["zones"]}
        self._zone_types: dict[str, str] = {z["id"]: z["type"] for z in venue["zones"]}

        self._ewma: dict[str, float] = {z["id"]: 0.0 for z in venue["zones"]}
        self._prev_occ: dict[str, float] = {z["id"]: 0.0 for z in venue["zones"]}

        self._on_tick_callbacks: list = []

    def add_tick_callback(self, cb) -> None:
        self._on_tick_callbacks.append(cb)

    async def start(self) -> None:
        self.running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self.running = False
        if self._task:
            self._task.cancel()

    async def _loop(self) -> None:
        while self.running:
            await asyncio.sleep(2.0 / max(self.speed, 0.1))
            self._tick()
            for cb in self._on_tick_callbacks:
                try:
                    await cb(self.venue_id, self.get_state())
                except Exception:
                    pass

    def _tick(self) -> None:
        dt = 1.0  # 1 sim-minute per tick
        self.clock += dt

        for zone_id, zone in self.zones.items():
            mod = self._modifiers.get(zone_id, {})
            if mod.get("until_clock") and self.clock > mod["until_clock"]:
                del self._modifiers[zone_id]
                mod = {}

            ztype = self._zone_types[zone_id]
            occ_curve = GATE_OCC_CURVE if ztype == "gate" else CONCOURSE_OCC_CURVE
            inflow_curve = GATE_INFLOW_CURVE if ztype == "gate" else CONCOURSE_INFLOW_CURVE

            base_delta = _piecewise(self.clock, occ_curve)
            base_inflow = _piecewise(self.clock, inflow_curve)

            inflow_mult = mod.get("inflow_mult", 1.0)
            cap_mult = mod.get("capacity_mult", 1.0)

            # Surge increases fill rate; gate closure reduces drain (cap_mult=0 → no outflow)
            if inflow_mult > 1.0:
                occ_delta = base_delta * inflow_mult
            elif cap_mult < 1.0:
                # Closure: inflow stays but no outflow → net fill = inflow - 0
                drain = max(0.0, -base_delta)  # extract drain component
                fill = max(0.0, base_delta)
                occ_delta = fill + drain * (1.0 - cap_mult)
            else:
                occ_delta = base_delta

            noise = self.rng.uniform(-1.5, 1.5)
            zone.occupancy = max(0.0, min(110.0, zone.occupancy + occ_delta * dt + noise))
            zone.inflow = round(base_inflow * inflow_mult, 1)

            zone.history.append(round(zone.occupancy, 1))
            if len(zone.history) > 30:
                zone.history = zone.history[-30:]

            prev = self._prev_occ[zone_id]
            slope = zone.occupancy - prev
            alpha = 0.5
            self._ewma[zone_id] = alpha * slope + (1 - alpha) * self._ewma[zone_id]
            self._prev_occ[zone_id] = zone.occupancy

            ewma = self._ewma[zone_id]
            if ewma > 0 and zone.occupancy < 100:
                eta = (90.0 - zone.occupancy) / ewma
                zone.eta_min = round(eta, 1) if eta > 0 else None
            else:
                zone.eta_min = None

            occ = zone.occupancy
            eta = zone.eta_min
            if occ > 85 or (eta is not None and eta < 8):
                zone.status = "critical"
            elif occ > 70 or (eta is not None and eta < 15):
                zone.status = "watch"
            else:
                zone.status = "ok"

    def apply_scenario(self, scenario: dict) -> None:
        if "jump_clock_to" in scenario:
            self.clock = float(scenario["jump_clock_to"])
        for mod in scenario.get("timeline", []):
            t_offset = mod.get("t_offset_min", 0)
            until = self.clock + t_offset + mod.get("duration_min", 30)
            target_id = mod.get("zone_id")
            target_type = mod.get("zone_type")
            for zone_id, zone in self.zones.items():
                match = (target_id and zone_id == target_id) or (target_type and self._zone_types.get(zone_id) == target_type)
                if match:
                    self._modifiers[zone_id] = {
                        "inflow_mult": mod.get("inflow_mult", 1.0),
                        "capacity_mult": mod.get("capacity_mult", 1.0),
                        "until_clock": until,
                    }

    def reset(self) -> None:
        self.clock = -120.0
        self.rng = random.Random(self.seed)
        self._modifiers.clear()
        self._ewma = {z: 0.0 for z in self.zones}
        self._prev_occ = {z: 0.0 for z in self.zones}
        for zone in self.zones.values():
            zone.occupancy = 0.0
            zone.status = "ok"
            zone.eta_min = None
            zone.history = []
            zone.inflow = 0.0

    def set_speed(self, speed: float) -> None:
        self.speed = max(0.1, min(10.0, speed))

    def add_inflow(self, zone_id: str, delta: int) -> None:
        if zone_id in self.zones:
            self.zones[zone_id].occupancy = min(110.0, self.zones[zone_id].occupancy + delta * 0.5)
            self.zones[zone_id].live_source = True

    def get_state(self) -> SimState:
        return SimState(
            venue_id=self.venue_id,
            clock_min=round(self.clock, 1),
            zones=list(self.zones.values()),
            speed=self.speed,
        )
