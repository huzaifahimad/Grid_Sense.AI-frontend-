# GridSense AI — Frontend

**Mission-control dashboard for smart grid overload risk monitoring.**

React 18 · Three.js · Recharts · Vite · Deploys to Vercel

[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.128-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## What it does

A real-time operator dashboard for the
[GridSense AI backend](https://github.com/huzaifahimad/Grid_Sense.AI-Backend-) —
an ML system that forecasts electricity demand and predicts grid overload risk across
three Southern European zones (Spain, Greece, Southern Italy).

**Dashboard panels:**

- **3D Grid Topology** — interactive Three.js scene with per-zone risk-colored nodes,
  animated connections, auto-orbiting camera, and click-to-inspect raycasting
- **Asset Risk List** — all monitored assets ranked by overload risk score
- **Risk Detail** — score, predicted load vs. capacity, top SHAP risk factors, and the
  recommended load-shedding schedule with per-asset reasoning
- **24H Load Forecast** — Recharts area chart with P10/P50/P90 uncertainty bands
- **System Header** — SIMULATION/LIVE mode indicator, critical asset count, system
  average risk, live UTC clock

The dashboard is **decision support, not decision authority** — it recommends, it never
controls grid equipment.

---

## Quick Start

```bash
git clone https://github.com/huzaifahimad/Grid_Sense.AI-frontend-.git
cd Grid_Sense.AI-frontend-
npm install
npm run dev          # opens on http://localhost:5173
```

Runs in **demo mode by default** (`VITE_USE_MOCK_DATA=true`) — no backend required to
see the full dashboard working with realistic mock data.

### Connecting to a live backend

Create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000      # or your deployed backend URL
VITE_USE_MOCK_DATA=false
```

Then restart the dev server. The header switches from `SIMULATION` to `LIVE`.

---

## Environment Variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Vercel dashboard → Settings → Environment Variables | Yes (for live mode) | Full URL of the deployed backend, e.g. `https://<your-app>.fastapicloud.dev` — no trailing slash |
| `VITE_USE_MOCK_DATA` | Same | Yes (for live mode) | Set to the literal string `false` to use the real backend. Any other value (or unset) keeps demo mode |

> Vite bakes env vars in **at build time** — after changing them in Vercel, trigger a
> redeploy for the change to take effect.

---

## Deployment (Vercel)

1. Import the repo at [vercel.com/new](https://vercel.com/new) — Vite is auto-detected
2. Set the two environment variables above
3. Deploy — build config is committed in [`vercel.json`](vercel.json)
   (`npm run build` → `dist/`)

```bash
# or via CLI
npm i -g vercel
vercel --prod
```

---

## Project Structure

```
├── src/
│   ├── GridSenseDashboard.jsx   # Full dashboard: 3D scene, charts, panels, API layer
│   └── main.jsx                 # React 18 entry point
├── docs/                        # 13-document suite (mirrored from backend repo)
├── index.html                   # Vite entry
├── vite.config.js               # Vite + React plugin
├── vercel.json                  # Vercel build config + SPA rewrite
└── .env.example                 # Environment variable template
```

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18.3 | Concurrent rendering, stable ecosystem |
| Build | Vite 5.4 | Sub-second HMR, zero-config JSX |
| 3D | Three.js 0.128 | Grid topology visualization with raycasting |
| Charts | Recharts 2.12 | Declarative P10/P50/P90 uncertainty bands |
| Styling | Inline design tokens | Single-file component, no CSS pipeline needed |

## Important — repo boundary

This repo is **frontend-only**. It must never contain `requirements.txt`, an `api/`
folder, `.joblib` files, or any Python backend code — an earlier attempt to merge the
backend in here broke the Vercel build (ML dependencies exceed Vercel's 250 MB
serverless limit). Full story:
[`docs/03_System_Architecture.md`](docs/03_System_Architecture.md) §2.2.

## Documentation

| Doc | Covers |
|---|---|
| [`06_Project_Overview.md`](docs/06_Project_Overview.md) | Plain-language orientation — start here |
| [`07_User_Manual.md`](docs/07_User_Manual.md) | Panel-by-panel operator guide |
| [`05_Deployment_Guide.md`](docs/05_Deployment_Guide.md) | Full-stack deployment steps |
| [`03_System_Architecture.md`](docs/03_System_Architecture.md) | Two-repo architecture rationale |
| [`08_Testing_Validation_Prompt.md`](docs/08_Testing_Validation_Prompt.md) | 6-phase QA verification prompt |

## Related

Backend API (FastAPI + LightGBM):
**[Grid_Sense.AI-Backend-](https://github.com/huzaifahimad/Grid_Sense.AI-Backend-)**

## License

MIT — free to use, modify, and distribute.
