# Stadium Copilot

A two-sided venue intelligence app built for FIFA World Cup 2026: a multilingual assistant for fans on one side, and a live crowd-ops command center for stadium staff on the other — both wired into the same real-time data.

The idea started from a simple annoyance: stadiums already collect a ton of crowd and gate data, but it rarely reaches the two people who need it most in the moment — the fan standing at the wrong gate, and the ops person deciding whether to redirect them. Stadium Copilot tries to close that loop.

## What it actually does

**If you're a fan:**
- Ask anything, in your own language — bag policy, accessible restrooms, nearest concession, how to get back to your seat
- Snap your ticket and it figures out your section/seat and gives you a step-by-step route
- If ops redirects your gate, you get pinged automatically — already translated

**If you're running the venue:**
- A live heatmap of every zone, updating every couple seconds
- When a zone starts trending toward capacity, the AI drafts a dispatch recommendation (which gate to close, where to redirect) — you approve it with one click and it goes out to fans instantly, translated per-language
- A scenario simulator to stress-test things: pre-match rush, halftime surge, a gate closure, full egress
- A simple incident log so staff can flag things by zone as they happen

- deployed link: https://beverly-norman-origin-amp.trycloudflare.com/

## Running it locally

```bash
cp .env.example .env
# drop your NVIDIA_API_KEY into .env

cd frontend && npm install && cd ..
pip install -r backend/requirements.txt

# two terminals:
cd backend && uvicorn main:app --reload --port 8080
cd frontend && npm run dev
```

Then:
- Fan app → http://localhost:5173/fan?venue=nyj
- Ops center → http://localhost:5173/ops

Or skip the manual steps:
```bash
make install
make dev
```

## Deploying

This runs fine as a single Docker container — there's a `render.yaml` for a one-click Render deploy, or you can push it anywhere that runs containers (Cloud Run, Fly, etc.). Either way you just need to set `NVIDIA_API_KEY` as a secret/env var on whatever platform you use — it's intentionally never in the repo.

```bash
docker build -t stadium-copilot .
docker run -p 8080:8080 --env-file .env stadium-copilot
```

## How it's put together

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
│  NVIDIA NIM  (OpenAI-compatible API)    │
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

More detail in [ARCHITECTURE.md](ARCHITECTURE.md) if you want to dig into the routing/retrieval/simulation logic.

## Repo layout

```
stadium-copilot/
├── backend/
│   ├── main.py          # FastAPI app, routes, startup
│   ├── gemini.py        # NVIDIA NIM client + rate limiter
│   ├── sim.py           # crowd occupancy simulator
│   ├── ops.py           # recommendations, incidents, approvals
│   ├── retrieval.py     # BM25 chunking + tag boost
│   ├── routing.py       # graph load, Dijkstra, accessibility filter
│   ├── sessions.py      # fan sessions + WS connection manager
│   ├── models.py        # Pydantic schemas
│   └── warm_cache.py    # cache pre-warmer (make warm)
├── frontend/src/
│   ├── routes/          # Landing.tsx  FanApp.tsx  OpsApp.tsx
│   ├── components/fan/  # chat, ticket scan, venue map, message bubbles
│   ├── components/ops/  # heatmap, zone panel, rec cards, phone preview…
│   └── lib/             # api.ts  ws.ts  store.ts  offline.ts
├── prompts/              # the actual prompts used at runtime, kept out of code
├── data/
│   ├── venues/           # nyj.json  mia.json
│   ├── scenarios/        # the 4 demo scenarios
│   └── canned_queries.json
├── Dockerfile
├── Makefile
└── .env.example
```

## Environment variables

| Variable | Default | What it's for |
|---|---|---|
| `NVIDIA_API_KEY` | — | required — your NVIDIA NIM key |
| `NVIDIA_CHAT_MODEL` | `meta/llama-3.1-70b-instruct` | chat + dispatch reasoning |
| `NVIDIA_LITE_MODEL` | `meta/llama-3.1-8b-instruct` | translation |
| `NVIDIA_VISION_MODEL` | `meta/llama-3.2-11b-vision-instruct` | ticket OCR |
| `DEMO_MODE` | `0` | `1` = serve from the response cache when available, so demos don't burn API calls |
| `SIM_SEED` | `26` | seeds the sim's RNG so runs are reproducible |
| `PORT` | `8080` | server port |

## Stack

- **Backend** — Python 3.11, FastAPI, uvicorn, Pydantic v2
- **AI** — NVIDIA NIM (OpenAI-compatible API), via the `openai` SDK
- **Frontend** — React 18, Vite, TypeScript, Zustand
- **Deploy** — single Docker container; works on Render, Cloud Run, Fly, or anywhere else that takes a Dockerfile
