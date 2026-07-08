from __future__ import annotations
import json
import time
import uuid
from collections import deque
from models import Recommendation, ZoneState
import gemini as g


class OpsManager:
    def __init__(self, venue: dict) -> None:
        self.venue = venue
        self.venue_id = venue["venue_id"]
        self.venue_name = venue["fifa_name"]
        self._recs: dict[str, Recommendation] = {}
        self._incidents: deque[dict] = deque(maxlen=20)
        self._cooldowns: dict[str, float] = {}  # zone_id -> last rec clock
        self._global_dispatch_times: deque[float] = deque(maxlen=2)  # track 2/min
        self._prev_statuses: dict[str, str] = {}

    def record_incident(self, zone_id: str, text: str) -> dict:
        entry = {
            "id": str(uuid.uuid4())[:8],
            "zone_id": zone_id,
            "text": text,
            "timestamp": time.time(),
        }
        self._incidents.append(entry)
        return entry

    def get_incidents(self) -> list[dict]:
        return list(self._incidents)

    async def maybe_generate_recs(self, zones: list[ZoneState], clock_min: float) -> list[Recommendation]:
        changed_zones = []
        for z in zones:
            prev = self._prev_statuses.get(z.id, "ok")
            if z.status != prev or (z.eta_min is not None and z.eta_min < 15):
                cooldown_until = self._cooldowns.get(z.id, 0)
                if clock_min - cooldown_until >= 8.0:  # 8 sim-min cooldown ≈ 16s real-time at speed 1
                    changed_zones.append(z)
        self._prev_statuses = {z.id: z.status for z in zones}

        if not changed_zones:
            return []

        now = time.time()
        recent = [t for t in self._global_dispatch_times if now - t < 60]
        if len(recent) >= 2:
            return []

        high_priority = [z for z in changed_zones if z.status in ("critical", "watch")]
        if not high_priority:
            return []

        state_json = json.dumps([
            {"id": z.id, "label": z.label, "occupancy": round(z.occupancy, 1),
             "status": z.status, "eta_min": z.eta_min, "inflow": z.inflow}
            for z in zones
        ])
        incidents_json = json.dumps(list(self._incidents)[-5:])

        raw = await g.get_dispatch_recommendations(state_json, incidents_json, self.venue_name)
        if not raw:
            raw = self._template_recs(high_priority[:2])

        new_recs = []
        for r in raw[:3]:
            rec = Recommendation(
                id=str(uuid.uuid4())[:8],
                priority=r.get("priority", "P2"),
                zone_id=r.get("zone_id", high_priority[0].id if high_priority else ""),
                action=r.get("action", "Redirect fans to adjacent gate."),
                reason=r.get("reason", "Zone approaching capacity."),
                alternate_zone=r.get("alternate_zone"),
                expires_min=r.get("expires_min", 10),
                timestamp=time.time(),
            )
            self._recs[rec.id] = rec
            self._cooldowns[rec.zone_id] = clock_min
            new_recs.append(rec)

        self._global_dispatch_times.append(now)

        active = [r for r in self._recs.values() if not r.approved]
        if len(active) > 3:
            oldest = sorted(active, key=lambda r: r.timestamp)[:-3]
            for r in oldest:
                del self._recs[r.id]

        return new_recs

    def get_active_recs(self) -> list[Recommendation]:
        return [r for r in self._recs.values() if not r.approved]

    def approve_rec(self, rec_id: str) -> Recommendation | None:
        rec = self._recs.get(rec_id)
        if rec:
            rec.approved = True
        return rec

    def _template_recs(self, zones: list[ZoneState]) -> list[dict]:
        result = []
        for z in zones:
            occ = round(z.occupancy, 1)
            eta = f"~{z.eta_min:.0f} min" if z.eta_min else "imminent"
            result.append({
                "priority": "P0" if z.status == "critical" else "P1",
                "zone_id": z.id,
                "action": f"Redirect inbound fans from {z.label} to alternate entry.",
                "reason": f"Occupancy {occ}%, capacity {eta}.",
                "alternate_zone": None,
                "expires_min": 10,
            })
        return result
