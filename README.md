# Stadium Copilot

AI-powered venue intelligence for FIFA World Cup 2026. Real-time crowd management for ops teams, multilingual fan assistant for attendees.

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
