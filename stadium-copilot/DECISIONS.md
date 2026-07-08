# Decisions Log

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Python version | Python 3.14 (available on build machine) | Available; type hints fully supported |
| 2 | WebSocket library | FastAPI native WebSockets | Already in FastAPI, no extra dep |
| 3 | Frontend port | Vite dev on 5173, backend on 8080 | Standard Vite default |
| 4 | SVG venue maps | Hand-drawn SVG paths in component | No map lib dependency; schematic is fine per spec |
| 5 | Tailwind v4 | @tailwindcss/vite plugin | Per spec requirement |
| 6 | Sample ticket images | SVG→base64 embedded, no external files | Simpler than PNG; loads instantly |
