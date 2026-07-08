from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field


class UserContext(BaseModel):
    section: str | None = None
    seat: str | None = None
    row: str | None = None


class ChatRequest(BaseModel):
    venue_id: str
    session_id: str
    message: str | None = None
    image_base64: str | None = None
    accessibility_mode: bool = False
    user_context: UserContext = Field(default_factory=UserContext)


class RouteStep(BaseModel):
    node_id: str
    label: str
    x: float
    y: float


class RouteResult(BaseModel):
    steps: list[RouteStep]
    distance_m: float
    eta_min: float
    accessible: bool


class ChatResponse(BaseModel):
    reply_text: str
    detected_lang: str
    route: RouteResult | None = None
    source: Literal["gemini", "cache", "template"]
    session_context: UserContext


class AnnounceRequest(BaseModel):
    venue_id: str
    text: str


class AnnounceResponse(BaseModel):
    delivery_count: int
    translations: dict[str, str]


class IncidentRequest(BaseModel):
    venue_id: str
    zone_id: str
    text: str


class ApproveRequest(BaseModel):
    venue_id: str
    rec_id: str


class ScenarioRequest(BaseModel):
    venue_id: str
    scenario_id: str
    speed: float = 1.0


class ZoneState(BaseModel):
    id: str
    label: str
    occupancy: float  # 0-110
    status: Literal["ok", "watch", "critical"]
    eta_min: float | None = None
    inflow: float = 0.0
    history: list[float] = Field(default_factory=list)
    live_source: bool = False


class Recommendation(BaseModel):
    id: str
    priority: Literal["P0", "P1", "P2"]
    zone_id: str
    action: str
    reason: str
    alternate_zone: str | None = None
    expires_min: int = 10
    approved: bool = False
    timestamp: float = 0.0


class SimState(BaseModel):
    venue_id: str
    clock_min: float  # minutes relative to kickoff, starting T-120
    zones: list[ZoneState]
    speed: float = 1.0


class TicketExtraction(BaseModel):
    section: str | None = None
    row: str | None = None
    seat: str | None = None
    confidence: float = 0.0


class HealthResponse(BaseModel):
    status: str
    uptime: float
    gemini: Literal["ok", "degraded"]


class CVCountRequest(BaseModel):
    venue_id: str
    zone_id: str
    delta: int
