from __future__ import annotations
import asyncio
import json
import os
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import gemini as g
from models import (
    ChatRequest, ChatResponse, AnnounceRequest, AnnounceResponse,
    IncidentRequest, ApproveRequest, ScenarioRequest, HealthResponse,
    CVCountRequest, UserContext,
)
from sessions import session_manager
from sim import SimEngine
from ops import OpsManager
from retrieval import build_chunks, retrieve, format_context
from routing import find_route, section_to_node, node_for_label

DATA_DIR = Path(__file__).parent.parent / "data"
STATIC_DIR = Path(__file__).parent / "static"
START_TIME = time.monotonic()

app = FastAPI(title="Stadium Copilot API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_venues: dict[str, dict] = {}
_chunks: dict[str, list] = {}
_sims: dict[str, SimEngine] = {}
_ops: dict[str, OpsManager] = {}
_scenarios: dict[str, dict] = {}
_histories: dict[str, list] = {}  # session_id -> chat history


@app.on_event("startup")
async def startup():
    g.load_cache()

    for vid in ["nyj", "mia"]:
        vfile = DATA_DIR / "venues" / f"{vid}.json"
        if vfile.exists():
            venue = json.loads(vfile.read_text(encoding="utf-8"))
            _venues[vid] = venue
            _chunks[vid] = build_chunks(venue)
            sim = SimEngine(venue, seed=int(os.getenv("SIM_SEED", "26")))
            sim.add_tick_callback(_on_sim_tick)
            _sims[vid] = sim
            _ops[vid] = OpsManager(venue)
            await sim.start()

    for sf in (DATA_DIR / "scenarios").glob("*.json"):
        s = json.loads(sf.read_text(encoding="utf-8"))
        _scenarios[s["id"]] = s

    asyncio.create_task(_warm_cache())


async def _warm_cache():
    await asyncio.sleep(5)
    canned_file = DATA_DIR / "canned_queries.json"
    if not canned_file.exists():
        return
    queries = json.loads(canned_file.read_text(encoding="utf-8"))
    for q in queries:
        key = g.cache_key(q["venue_id"], q["query"], q.get("lang", "en"), False)
        if g.get_cached(key):
            continue
        venue = _venues.get(q["venue_id"])
        if not venue:
            continue
        chunks = _chunks.get(q["venue_id"], [])
        selected = retrieve(q["query"], chunks)
        header = chunks[0] if chunks else {"text": ""}
        context = format_context(header, selected)
        system_prompt = _build_fan_system(venue, context, None, None, False)
        reply, lang = await g.chat_with_tools(system_prompt, [], q["query"])
        g.set_cached(key, {"reply_text": reply, "detected_lang": lang or q.get("lang", "en"), "route": None, "source": "gemini"})
        await asyncio.sleep(4)  # 4s spacing = ~15 req/min, within free-tier limit


async def _on_sim_tick(venue_id: str, state) -> None:
    ops = _ops.get(venue_id)
    sim = _sims.get(venue_id)
    if not ops or not sim:
        return

    new_recs = await ops.maybe_generate_recs(state.zones, state.clock_min)

    payload = {
        "type": "tick",
        "clock_min": state.clock_min,
        "speed": state.speed,
        "zones": [z.model_dump() for z in state.zones],
        "recs": [r.model_dump() for r in ops.get_active_recs()],
    }
    await session_manager.broadcast_ops(venue_id, payload)

    for rec in new_recs:
        await session_manager.broadcast_ops(venue_id, {"type": "recommendation", "rec": rec.model_dump()})


def _build_fan_system(venue: dict, context: str, section: str | None, seat: str | None, accessibility: bool) -> str:
    tmpl = g.load_prompt("fan_system.md")
    return (
        tmpl
        .replace("{venue_fifa_name}", venue["fifa_name"])
        .replace("{venue_real_name}", venue["real_name"])
        .replace("{retrieved_chunks}", context)
        .replace("{user_section}", section or "unknown")
        .replace("{user_seat}", seat or "unknown")
        .replace("{accessibility_mode}", str(accessibility).lower())
    )


@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        uptime=round(time.monotonic() - START_TIME, 1),
        gemini="ok" if g.is_gemini_ok() else "degraded",
    )


@app.get("/api/venues")
async def list_venues():
    return [{"venue_id": v["venue_id"], "fifa_name": v["fifa_name"], "real_name": v["real_name"]} for v in _venues.values()]


@app.get("/api/venues/{venue_id}")
async def get_venue(venue_id: str):
    venue = _venues.get(venue_id)
    if not venue:
        raise HTTPException(404, "Venue not found")
    return venue


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    venue = _venues.get(req.venue_id)
    if not venue:
        raise HTTPException(404, "Venue not found")

    sess = session_manager.get_or_create_fan(req.session_id, req.venue_id)
    sess.accessibility = req.accessibility_mode

    extracted_context = None
    if req.image_base64:
        extracted = await g.extract_ticket(req.image_base64)
        if extracted.get("section"):
            sess.section = extracted["section"]
            sess.row = extracted.get("row")
            sess.seat = extracted.get("seat")
            extracted_context = f"Ticket scanned: Section {extracted['section']}, Row {extracted.get('row', '?')}, Seat {extracted.get('seat', '?')}."

    if req.user_context.section:
        sess.section = req.user_context.section
    if req.user_context.seat:
        sess.seat = req.user_context.seat

    if extracted_context:
        message = req.message or (extracted_context + " How do I get to my seat?")
    else:
        message = req.message or "Hello"

    key = g.cache_key(req.venue_id, message, sess.lang, req.accessibility_mode)
    if os.getenv("DEMO_MODE", "0") == "1":
        cached = g.get_cached(key)
        if cached:
            return ChatResponse(
                reply_text=cached["reply_text"],
                detected_lang=cached.get("detected_lang", "en"),
                route=cached.get("route"),
                source="cache",
                session_context=UserContext(section=sess.section, seat=sess.seat, row=sess.row),
            )

    chunks = _chunks.get(req.venue_id, [])
    selected = retrieve(message, chunks)
    header = chunks[0] if chunks else {"text": ""}

    seat_chunk = None
    if sess.section:
        for c in chunks:
            if sess.section in c.get("text", ""):
                seat_chunk = c
                break

    context = format_context(header, selected, seat_chunk)
    system_prompt = _build_fan_system(venue, context, sess.section, sess.seat, req.accessibility_mode)

    history = _histories.get(req.session_id, [])
    reply, lang = await g.chat_with_tools(system_prompt, history, message)

    if lang and lang != "en":
        sess.lang = lang
        session_manager.update_fan(req.session_id, lang=lang)

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply})
    _histories[req.session_id] = history[-16:]

    route = None
    route_keywords = ["route", "get to", "go to", "how do i", "where is", "how far", "directions", "navigate", "find", "seat", "gate", "restroom", "help desk", "first aid", "elevator"]
    if any(kw in message.lower() for kw in route_keywords):
        route = _try_extract_route(venue, message, sess, req.accessibility_mode)

    source = "gemini" if g.is_gemini_ok() else "template"
    if not g.is_gemini_ok():
        reply = _fallback_reply(venue, message)

    response_data = {
        "reply_text": reply,
        "detected_lang": lang or sess.lang,
        "route": route.model_dump() if route else None,
        "source": source,
    }
    if source == "gemini":
        g.set_cached(key, response_data)

    return ChatResponse(
        reply_text=reply,
        detected_lang=lang or sess.lang,
        route=route,
        source=source,
        session_context=UserContext(section=sess.section, seat=sess.seat, row=sess.row),
    )


def _try_extract_route(venue: dict, message: str, sess, accessibility: bool):
    from routing import RouteResult
    msg = message.lower()

    from_node = None
    to_node = None

    if sess.section:
        from_node = section_to_node(venue, sess.section)

    gate_letters = ["gate a", "gate b", "gate c", "gate d", "gate e", "gate f"]
    for gl in gate_letters:
        if gl in msg:
            n = node_for_label(venue, gl.replace("gate ", "Gate "))
            if n:
                if "from" in msg and msg.index("from") < msg.index(gl.split()[-1]):
                    from_node = from_node or n
                else:
                    to_node = n

    poi_map = {
        "restroom": ["restroom_accessible" if accessibility else "restroom", "restroom"],
        "first aid": ["first_aid"],
        "help desk": ["help_desk"],
        "hydration": ["hydration"],
        "elevator": ["elevator"],
        "transit": ["transit_hub"],
        "seat": None,
    }

    for keyword, types_ in poi_map.items():
        if keyword in msg:
            if keyword == "seat" and sess.section:
                to_node = section_to_node(venue, sess.section)
            elif types_:
                for poi in venue.get("pois", []):
                    if poi["type"] in types_:
                        to_node = poi["node"]
                        break

    if not from_node:
        gates = [n for n in venue["graph"]["nodes"] if n.get("kind") == "gate"]
        if gates:
            from_node = gates[0]["id"]

    if not to_node or not from_node or from_node == to_node:
        return None

    result = find_route(venue, from_node, to_node, accessible_only=accessibility)
    if result:
        sess.destination_zone = to_node
    return result


def _fallback_reply(venue: dict, message: str) -> str:
    msg = message.lower()
    if "bag" in msg or "prohibited" in msg:
        return f"Bags: {venue['policies']['bags']}. For full details, visit the Fan Help Desk."
    if "transit" in msg or "train" in msg or "bus" in msg:
        rec = next((t for t in venue["transit"] if t.get("recommended")), venue["transit"][0] if venue["transit"] else None)
        if rec:
            return f"Recommended: {rec['name']}. {rec['notes']}"
    return "I'm in offline mode. Please visit the nearest Fan Help Desk for assistance."


@app.post("/api/ops/announce", response_model=AnnounceResponse)
async def announce(req: AnnounceRequest):
    venue = _venues.get(req.venue_id)
    if not venue:
        raise HTTPException(404)

    langs = list(session_manager.active_fan_langs(req.venue_id)) or ["en"]
    if "en" not in langs:
        langs.insert(0, "en")

    translations = await g.translate_announcement(req.text, langs)

    payload = {"type": "announcement", "translations": translations}
    count = await session_manager.broadcast_fan_translated(req.venue_id, translations, {"type": "announcement"})

    await session_manager.broadcast_ops(req.venue_id, {"type": "announce_sent", "text": req.text, "count": count})

    return AnnounceResponse(delivery_count=count, translations=translations)


@app.post("/api/ops/incident")
async def add_incident(req: IncidentRequest):
    ops = _ops.get(req.venue_id)
    if not ops:
        raise HTTPException(404)
    entry = ops.record_incident(req.zone_id, req.text)
    await session_manager.broadcast_ops(req.venue_id, {"type": "incident", **entry})
    return entry


@app.post("/api/ops/approve")
async def approve_rec(req: ApproveRequest):
    ops = _ops.get(req.venue_id)
    if not ops:
        raise HTTPException(404)
    rec = ops.approve_rec(req.rec_id)
    if not rec:
        raise HTTPException(404, "Rec not found")

    venue = _venues.get(req.venue_id)
    translations = await g.translate_announcement(
        f"Attention: Please use {rec.alternate_zone or 'alternate'} entry. {rec.action}",
        list(session_manager.active_fan_langs(req.venue_id)) or ["en"],
    )

    fan_sessions = session_manager.fan_sessions_for_venue(req.venue_id)
    count = 0
    for sess in fan_sessions:
        if sess.ws is None:
            continue
        lang = sess.lang
        text = translations.get(lang) or translations.get("en", rec.action)
        alert_payload: dict = {"type": "alert", "text": text, "rec_id": rec.id, "priority": rec.priority}

        if sess.destination_zone == rec.zone_id and rec.alternate_zone and venue:
            alt_route = find_route(venue, sess.destination_zone, rec.alternate_zone, accessible_only=sess.accessibility)
            if alt_route:
                alert_payload["route"] = alt_route.model_dump()

        sent = await session_manager.send_to_fan(sess.session_id, alert_payload)
        if sent:
            count += 1

    await session_manager.broadcast_ops(req.venue_id, {
        "type": "approved",
        "rec_id": rec.id,
        "fan_count": count,
    })

    return {"approved": True, "fan_count": count, "rec": rec.model_dump()}


@app.post("/api/director/scenario")
async def apply_scenario(req: ScenarioRequest):
    sim = _sims.get(req.venue_id)
    if not sim:
        raise HTTPException(404)
    if req.scenario_id == "reset":
        sim.reset()
        return {"applied": "reset"}
    scenario = _scenarios.get(req.scenario_id)
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    sim.set_speed(req.speed)
    sim.apply_scenario(scenario)
    return {"applied": req.scenario_id}


@app.post("/api/cv/count")
async def cv_count(req: CVCountRequest):
    sim = _sims.get(req.venue_id)
    if not sim:
        raise HTTPException(404)
    sim.add_inflow(req.zone_id, req.delta)
    return {"ok": True}


@app.get("/api/ops/state/{venue_id}")
async def ops_state(venue_id: str):
    sim = _sims.get(venue_id)
    ops = _ops.get(venue_id)
    if not sim or not ops:
        raise HTTPException(404)
    state = sim.get_state()
    return {
        "clock_min": state.clock_min,
        "speed": state.speed,
        "zones": [z.model_dump() for z in state.zones],
        "recs": [r.model_dump() for r in ops.get_active_recs()],
        "incidents": ops.get_incidents()[-5:],
    }


@app.websocket("/ws/ops/{venue_id}")
async def ws_ops(ws: WebSocket, venue_id: str):
    await ws.accept()
    session_manager.connect_ops_ws(venue_id, ws)
    try:
        sim = _sims.get(venue_id)
        if sim:
            state = sim.get_state()
            ops = _ops.get(venue_id)
            await ws.send_text(json.dumps({
                "type": "tick",
                "clock_min": state.clock_min,
                "speed": state.speed,
                "zones": [z.model_dump() for z in state.zones],
                "recs": [r.model_dump() for r in (ops.get_active_recs() if ops else [])],
            }))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        session_manager.disconnect_ops_ws(venue_id, ws)


@app.websocket("/ws/fan/{venue_id}/{session_id}")
async def ws_fan(ws: WebSocket, venue_id: str, session_id: str):
    await ws.accept()
    session_manager.connect_fan_ws(session_id, venue_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        session_manager.disconnect_fan_ws(session_id)


if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
