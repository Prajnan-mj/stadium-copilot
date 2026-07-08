# Architecture

## System overview

Stadium Copilot is a single-container app: FastAPI serves both the REST/WS API and the React build from `backend/static/`. WebSockets carry real-time state from the sim engine to the ops dashboard and push alerts from ops to fans.

```
                        ┌──────────────────────────────────────────────────────┐
                        │                  Cloud Run container                  │
                        │                                                        │
Fan browser ──WS──────► │  /ws/fan/{venue}/{session}    SessionManager           │
Fan browser ──HTTP────► │  /api/chat                    ├─ fan_sessions dict     │
                        │  /api/venues                   └─ ops_ws set           │
Ops browser ──WS──────► │  /ws/ops/{venue}                                       │
Ops browser ──HTTP────► │  /api/ops/state  /api/ops/approve                     │
                        │  /api/ops/announce  /api/director/scenario             │
                        │                                                        │
                        │  SimEngine (asyncio task, ticks every 2s real-time)   │
                        │  ├─ stock-and-flow occupancy model per zone            │
                        │  ├─ GATE_OCC_CURVE / CONCOURSE_OCC_CURVE              │
                        │  ├─ scenario modifiers (inflow_mult, capacity_mult)   │
                        │  └─ on_tick → OpsManager → broadcast_ops WS           │
                        │                                                        │
                        │  OpsManager                                            │
                        │  ├─ maybe_generate_recs (rate-limited: 2/min)         │
                        │  │  └─ NVIDIA dispatch.md → structured JSON recs      │
                        │  ├─ approve_rec → translate_announcement → fan WS     │
                        │  └─ record_incident                                    │
                        │                                                        │
                        │  Chat pipeline (/api/chat)                             │
                        │  1. extract_ticket (vision model, if image attached)  │
                        │  2. BM25 retrieve top chunks from venue knowledge base │
                        │  3. build_fan_system prompt (fan_system.md template)  │
                        │  4. chat_with_tools → NVIDIA llama-3.1-70b            │
                        │  5. _try_extract_route (Dijkstra on venue graph)      │
                        │  6. cache result (DEMO_MODE) / return ChatResponse    │
                        │                                                        │
                        │  Static files: /  →  backend/static/ (React build)   │
                        └──────────────────────────────────────────────────────┘
                                            │
                                   NVIDIA NIM API
                              integrate.api.nvidia.com/v1
                              ├─ meta/llama-3.1-70b-instruct  (chat, dispatch)
                              ├─ meta/llama-3.1-8b-instruct   (translate)
                              └─ meta/llama-3.2-11b-vision-instruct (ticket)
```

---

## Simulation model

The occupancy engine uses a **stock-and-flow** model. Each zone holds a scalar `occupancy` (% of capacity). Every tick (1 sim-minute, fires every 2 real seconds at speed 1×):

```
occ_delta = CURVE[clock]   # %/min from piecewise-linear curve
occupancy += occ_delta * dt + noise(±1.5%)
```

`GATE_OCC_CURVE` and `CONCOURSE_OCC_CURVE` encode the expected crowd shape across a match timeline (T=-120 to T=+160 minutes):

| Phase | Gate delta | Concourse delta |
|---|---|---|
| T-120 to T-60 | 0.05–0.80 %/min | 0.02–0.40 %/min |
| T-30 to T-5 (pre-kickoff) | 1.50–1.80 %/min | 0.60 %/min |
| T0 (kickoff) | −4.00 %/min | 0.10 %/min |
| T+44 to T+65 (halftime) | 1.50 %/min | **2.00 %/min** |
| T+66 to T+90 (2nd half) | −2.50 → −1.00 %/min | −2.00 %/min |
| T+93 to T+133 (post-match egress) | 1.50 → 2.00 %/min | 1.50 → 2.00 %/min |

**Scenario modifiers** multiply `base_delta` by `inflow_mult` (surge) or amplify drain by `capacity_mult` (gate closure):

```python
if inflow_mult > 1.0:
    occ_delta = base_delta * inflow_mult
elif cap_mult < 1.0:
    occ_delta = fill + drain * (1.0 - cap_mult)
```

**Status thresholds:**
- `ok`: occupancy ≤ 70% and ETA to 90% > 15 min
- `watch`: occupancy > 70% or ETA < 15 min  
- `critical`: occupancy > 85% or ETA < 8 min

---

## AI pipeline

### Fan chat

```
User message
    │
    ▼
BM25 retrieve(query, chunks)   ← venue JSON chunked by section/facility/policy
    │
    ▼
format_context(header, selected, seat_chunk)
    │
    ▼
fan_system.md template filled with:
  {venue_fifa_name}, {retrieved_chunks}, {user_section}, {accessibility_mode}
    │
    ▼
NVIDIA llama-3.1-70b-instruct
  system: filled template
  user: message (+ image_url if ticket attached)
    │
    ▼
reply_text + detected_lang (heuristic)
    │
    ▼
_try_extract_route (Dijkstra, if route keywords detected)
    │
    ▼
ChatResponse {reply_text, route, detected_lang, source}
```

### Dispatch recommendations

```
Every tick → OpsManager.maybe_generate_recs()
  rate guard: 2 dispatch calls/min max, 8 sim-min cooldown per zone
      │
      ▼
  dispatch.md + state_json + incidents_json
      │
      ▼
  NVIDIA llama-3.1-70b → JSON {recommendations: [{priority, zone_id, action, …}]}
  fallback if empty: _template_recs()
```

### Approve → fan alert

```
POST /api/ops/approve {venue_id, rec_id}
    │
    ▼
translate_announcement(text, active_fan_langs)
  NVIDIA llama-3.1-8b → {translations: {en, es, pt, …}}
    │
    ▼
For each fan WebSocket session:
  text = translations[sess.lang] or translations["en"]
  send {type:"alert", text, rec_id, priority}
  (optional) if fan heading to blocked zone: attach alt_route
```

---

## Rate limiting

NVIDIA NIM free tier allows ~20 req/min. A token bucket enforces this in-process:

```python
_BUCKET_RATE = 20.0 / 60.0   # tokens/second
_BUCKET_MAX  = 20.0
```

`_consume_token()` is called before every API call. If the bucket is empty, the call returns the template fallback immediately (no blocking). `RateLimitError` (HTTP 429) adds a 3s sleep and also returns fallback.

---

## Routing

Venue graphs are defined in `data/venues/*.json` as node/edge lists. `routing.py` implements Dijkstra with edge weights (meters). Accessibility filter removes any edge tagged `steps=true`. Route results carry `path_nodes`, `distance_m`, and `eta_min`.

---

## WebSocket protocol

### `/ws/ops/{venue_id}`

Server → client messages:

| type | fields | when |
|---|---|---|
| `tick` | `clock_min, speed, zones[], recs[]` | every 2s |
| `recommendation` | `rec` | new rec generated |
| `approved` | `rec_id, fan_count` | rec approved |
| `announce_sent` | `text, count` | broadcast sent |
| `incident` | `zone_id, text, timestamp` | incident logged |

### `/ws/fan/{venue_id}/{session_id}`

Server → client messages:

| type | fields | when |
|---|---|---|
| `alert` | `text, rec_id, priority, route?` | ops approves rec |
| `announcement` | `text` | ops broadcasts announcement |

---

## Deployment

Single container, no external state. The sim runs in-process, so Cloud Run must have `--min-instances 1` to avoid cold-start sim resets mid-demo. WebSocket sessions are in-process only — horizontal scaling would require a Redis pub/sub layer (not implemented).

```
Dockerfile stages:
1. node:20-slim   → npm ci + npm run build → /app/frontend/dist
2. python:3.11-slim → pip install + copy backend + copy dist to backend/static
CMD: uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
```
