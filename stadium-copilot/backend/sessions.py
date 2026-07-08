from __future__ import annotations
import asyncio
import json
from dataclasses import dataclass, field
from fastapi import WebSocket


@dataclass
class FanSession:
    session_id: str
    venue_id: str
    lang: str = "en"
    section: str | None = None
    seat: str | None = None
    row: str | None = None
    accessibility: bool = False
    destination_zone: str | None = None
    ws: WebSocket | None = None


@dataclass
class OpsConnection:
    venue_id: str
    ws: WebSocket


class SessionManager:
    def __init__(self) -> None:
        self._fan_sessions: dict[str, FanSession] = {}
        self._ops_connections: dict[str, list[OpsConnection]] = {}

    def get_or_create_fan(self, session_id: str, venue_id: str) -> FanSession:
        if session_id not in self._fan_sessions:
            self._fan_sessions[session_id] = FanSession(session_id=session_id, venue_id=venue_id)
        return self._fan_sessions[session_id]

    def update_fan(self, session_id: str, **kwargs) -> None:
        if session_id in self._fan_sessions:
            for k, v in kwargs.items():
                setattr(self._fan_sessions[session_id], k, v)

    def connect_fan_ws(self, session_id: str, venue_id: str, ws: WebSocket) -> FanSession:
        sess = self.get_or_create_fan(session_id, venue_id)
        sess.ws = ws
        return sess

    def disconnect_fan_ws(self, session_id: str) -> None:
        if session_id in self._fan_sessions:
            self._fan_sessions[session_id].ws = None

    def connect_ops_ws(self, venue_id: str, ws: WebSocket) -> None:
        self._ops_connections.setdefault(venue_id, []).append(OpsConnection(venue_id=venue_id, ws=ws))

    def disconnect_ops_ws(self, venue_id: str, ws: WebSocket) -> None:
        conns = self._ops_connections.get(venue_id, [])
        self._ops_connections[venue_id] = [c for c in conns if c.ws is not ws]

    def active_fan_langs(self, venue_id: str) -> set[str]:
        return {s.lang for s in self._fan_sessions.values() if s.venue_id == venue_id and s.ws is not None}

    def fan_sessions_for_venue(self, venue_id: str) -> list[FanSession]:
        return [s for s in self._fan_sessions.values() if s.venue_id == venue_id]

    async def broadcast_fan(self, venue_id: str, payload: dict) -> int:
        sessions = [s for s in self._fan_sessions.values() if s.venue_id == venue_id and s.ws is not None]
        count = 0
        for sess in sessions:
            try:
                await sess.ws.send_text(json.dumps(payload))
                count += 1
            except Exception:
                sess.ws = None
        return count

    async def broadcast_fan_translated(self, venue_id: str, translations: dict[str, str], base_payload: dict) -> int:
        sessions = [s for s in self._fan_sessions.values() if s.venue_id == venue_id and s.ws is not None]
        count = 0
        for sess in sessions:
            lang = sess.lang
            text = translations.get(lang) or translations.get("en") or next(iter(translations.values()), "")
            payload = {**base_payload, "text": text, "lang": lang}
            try:
                await sess.ws.send_text(json.dumps(payload))
                count += 1
            except Exception:
                sess.ws = None
        return count

    async def broadcast_ops(self, venue_id: str, payload: dict) -> None:
        conns = list(self._ops_connections.get(venue_id, []))
        dead = []
        for conn in conns:
            try:
                await conn.ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(conn)
        for d in dead:
            self._ops_connections[venue_id] = [c for c in self._ops_connections.get(venue_id, []) if c is not d]

    async def send_to_fan(self, session_id: str, payload: dict) -> bool:
        sess = self._fan_sessions.get(session_id)
        if sess and sess.ws:
            try:
                await sess.ws.send_text(json.dumps(payload))
                return True
            except Exception:
                sess.ws = None
        return False


session_manager = SessionManager()
