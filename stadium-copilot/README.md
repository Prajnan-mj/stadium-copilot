# Stadium Copilot

**Smart Stadiums & Tournament Operations** — a GenAI-powered solution that optimizes stadium operations and enhances the FIFA World Cup 2026 experience through intelligent, real-time assistance, for both attendees and the operations staff running the venue.

One shared intelligence layer, two connected surfaces: a multilingual fan assistant, and a live ops command center — both reading from and reacting to the same real-time crowd data.

## Problem statement alignment

| Problem statement ask | How Stadium Copilot delivers it |
|---|---|
| Optimize stadium operations | Live per-zone occupancy simulation, AI-generated dispatch recommendations as zones approach capacity, one-click approve-and-notify, a scenario simulator (pre-match rush, halftime surge, gate closure, full egress) for stress-testing ops response |
| Enhance the FIFA World Cup 2026 experience | A grounded, multilingual fan assistant for wayfinding, accessibility, bag policy, and transit — plus proactive, auto-translated alerts the moment ops redirects a gate |
| GenAI-powered | NVIDIA NIM (Llama 3.1/3.2) drives chat, dispatch reasoning, live translation, and ticket-image OCR — retrieval-grounded against real venue data, not free-form hallucination |
| Intelligent, real-time assistance | WebSocket-pushed crowd state every 2 seconds, live dispatch generation on status change, instant fan-facing alerts — not a static chatbot bolted onto a dashboard |

## Live demo

Fan chat: `https://stadium-copilot-<hash>-el.a.run.app/fan?venue=nyj`  
Ops dashboard: `https://stadium-copilot-<hash>-el.a.run.app/ops`

*(replace `<hash>` with the actual Cloud Run URL after deployment)*

---

## What it does

**For fans**
- Natural-language Q&A in any language: directions, bag policy, accessibility, transit
- Ticket scan → automatic section/seat context → step-by-step route
- Live push alerts when ops redirects your entry gate

**For operations staff**
- Live heatmap of all zones updated every 2 seconds via WebSocket
- AI-generated dispatch recommendations (NVIDIA LLaMA 3.1 70B) as zones approach capacity
- One-click approve → NVIDIA-translated alert pushed to fans in their language
- Scenario simulator: Pre-match Rush, Halftime Surge, Gate Closure, Full Egress
- Incident log with zone tagging

---

## Testing

74 automated tests covering the core logic, not just happy-path smoke checks:

- **Routing** — Dijkstra shortest-path, accessible-only edge filtering, section/label lookup, unreachable-node handling
- **Retrieval** — BM25 ranking, tag-boosted relevance, context window budgeting
- **Simulation engine** — tick math, occupancy bounds, status-threshold consistency, deterministic replay from seed, scenario application
- **Ops dispatch logic** — cooldown windows, global rate limiting, LLM-fallback-to-template behavior (mocked, no live API calls)
- **Data integrity** — every venue graph edge/section resolves to a real node, every scenario references a real zone, every gate can route to every POI
- **API layer** — FastAPI endpoint tests via `TestClient` for health, venues, ops state, announcements, and scenario triggers

```bash
cd backend && pytest tests/ -v
```

or as part of the full check:
```bash
make check
```

---

## Code quality

- **Zero lint warnings** — `ruff check .` passes clean on the entire backend; no unused imports, no dead code, no bare excepts
- **Fully typed** — every backend module uses Python type hints end-to-end; all request/response shapes are Pydantic v2 models (`models.py`), so the API contract is enforced, not just documented
- **No deprecated APIs** — FastAPI's modern `lifespan` context manager for startup/shutdown (including graceful sim-engine teardown), not the deprecated `on_event` hooks
- **Modular by responsibility** — routing, retrieval, simulation, and ops-dispatch logic each live in their own module with a single job; `main.py` wires them together and stays a thin HTTP layer
- **Files stay small and focused** — most modules are under 300 lines; nothing is a monolith
- **Secrets never touch the repo** — API keys load from environment/`.env` only, verified by `.gitignore` and kept out of every script
- **Every AI prompt lives in a file** — `prompts/*.md`, loaded at runtime, never inlined as a string buried in application code

```bash
cd backend && ruff check .
```

---

## Accessibility

- **WCAG AA color contrast** verified across both the light (fan) and dark (ops) themes — computed contrast ratios checked against text/background pairs, not just eyeballed
- **Keyboard-operable modals** — the ticket-scan dialog traps focus on open, closes on `Escape`, and returns focus to the triggering control on close
- **Screen-reader support** — every interactive control (inputs, selects, icon-only buttons) has an explicit `aria-label`; status is always conveyed with a text label alongside color, never color alone
- **Visible focus states** — a consistent `:focus-visible` outline across every interactive element for keyboard navigation

---

## Quick start (local)

```bash
cp .env.example .env
# fill NVIDIA_API_KEY in .env
cd frontend && npm install && cd ..
pip install -r backend/requirements.txt
# terminal 1
cd backend && uvicorn main:app --reload --port 8080
# terminal 2
cd frontend && npm run dev
```

Fan app: http://localhost:5173/fan?venue=nyj  
Ops dashboard: http://localhost:5173/ops

Or with Make:
```bash
make install
make dev
```

---

## Deploy to Cloud Run

```bash
# 1. Store API key in Secret Manager
echo -n "nvapi-..." | gcloud secrets create NVIDIA_API_KEY --data-file=-

# 2. Deploy (Cloud Build builds the Docker image)
make deploy
```

The Makefile target runs:
```
gcloud run deploy stadium-copilot --source . --region asia-south1 \
  --allow-unauthenticated --min-instances 1 \
  --set-env-vars DEMO_MODE=1,SIM_SEED=26 \
  --set-secrets NVIDIA_API_KEY=NVIDIA_API_KEY:latest
```

---

## Architecture

```
Browser (Fan)          Browser (Ops)
    │                       │
    │ HTTP + WebSocket       │ HTTP + WebSocket
    ▼                       ▼
┌─────────────────────────────────────────┐
│           FastAPI  (port 8080)          │
│  /api/chat   /api/ops/*   /ws/fan/*     │
│  /ws/ops/*   /api/director/scenario     │
├─────────────┬──────────────┬────────────┤
│  SimEngine  │  OpsManager  │  Sessions  │
│  (asyncio   │  (recs,      │  (WS conn  │
│   tick/2s)  │   incidents) │   manager) │
├─────────────┴──────────────┴────────────┤
│  NVIDIA NIM  (OpenAI-compat API)        │
│  • llama-3.1-70b  → chat + dispatch     │
│  • llama-3.1-8b   → translation         │
│  • llama-3.2-11b-vision → ticket OCR    │
├─────────────┴──────────────┴────────────┤
│  BM25 retrieval   │   Dijkstra routing  │
│  (venue chunks)   │   (accessibility)   │
└─────────────────────────────────────────┘
         │
   backend/static/     ← React/Vite build
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full detail.

---

## Repo layout

```
stadium-copilot/
├── backend/
│   ├── main.py          # FastAPI app, routes, startup
│   ├── gemini.py        # NVIDIA NIM client + rate limiter
│   ├── sim.py           # Stock-and-flow occupancy simulator
│   ├── ops.py           # Recommendations, incidents, approve
│   ├── retrieval.py     # BM25 chunking + tag boost
│   ├── routing.py       # Graph load, Dijkstra, accessibility
│   ├── sessions.py      # Fan sessions + WS manager
│   ├── models.py        # Pydantic schemas
│   ├── warm_cache.py    # Cache pre-warmer (make warm)
│   └── tests/           # pytest suite — routing, retrieval, sim, ops, API
├── frontend/src/
│   ├── routes/          # Landing.tsx  FanApp.tsx  OpsApp.tsx
│   ├── components/fan/  # Chat, TicketSnap, VenueMap, MessageBubble
│   ├── components/ops/  # Heatmap, ZonePanel, RecCard, PhonePreview…
│   └── lib/             # api.ts  ws.ts  store.ts  offline.ts
├── prompts/             # fan_system.md  dispatch.md  announce_translate.md
├── data/
│   ├── venues/          # nyj.json  mia.json
│   ├── scenarios/       # 4 demo scenarios
│   └── canned_queries.json
├── Dockerfile
├── Makefile
└── .env.example
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NVIDIA_API_KEY` | — | **Required.** NVIDIA NIM API key |
| `NVIDIA_CHAT_MODEL` | `meta/llama-3.1-70b-instruct` | Chat + dispatch model |
| `NVIDIA_LITE_MODEL` | `meta/llama-3.1-8b-instruct` | Translation model |
| `NVIDIA_VISION_MODEL` | `meta/llama-3.2-11b-vision-instruct` | Ticket OCR model |
| `DEMO_MODE` | `0` | `1` = serve from response cache when available |
| `SIM_SEED` | `26` | RNG seed for reproducible sim noise |
| `PORT` | `8080` | Server port |

---

## Tech stack

- **Backend**: Python 3.11, FastAPI, uvicorn, Pydantic v2
- **AI**: NVIDIA NIM API (OpenAI-compatible), `openai` SDK
- **Frontend**: React 18, Vite, TypeScript, Zustand
- **Deployment**: Google Cloud Run (single container, min 1 instance)
