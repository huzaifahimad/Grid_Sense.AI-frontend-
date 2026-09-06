# GridSense AI — Frontend

**Mission-control dashboard for smart grid overload risk monitoring.**

React 18 · Three.js · Recharts · Vite · Deploys to Vercel

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185.1-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## What it does

A real-time operator dashboard for the
[GridSense AI backend](https://github.com/huzaifahimad/Grid_Sense.AI-Backend-) —
an ML system that forecasts electricity demand and predicts grid overload risk across
three Southern European zones (Spain, Greece, Southern Italy).

**Dashboard layout:**

- **System Header** — SIMULATION/LIVE mode indicator, critical asset count, system
  average risk, live UTC clock
- **KPI Row** — three at-a-glance stat cards: System Risk Average, Critical Zones,
  Selected Zone
- **3D Grid Topology** — interactive Three.js scene with per-zone risk-colored nodes,
  animated connections, auto-orbiting camera, and click-to-inspect raycasting
- **24H Load Forecast** — Recharts area chart. The band is a **fixed ±8% envelope** around the LightGBM point forecast, not a learned P10/P90 quantile model.
- **Asset Risk List** — all monitored assets ranked by overload risk score
- **Risk Detail** — score, predicted load vs. capacity, top SHAP risk factors, and the
  recommended load-shedding schedule with per-asset reasoning
- **Footer** — deployment metadata and capacity proxy reminder

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

The committed local environment is configured for live backend data with
`VITE_USE_MOCK_DATA=false`. Demo mode is opt-in only: set the variable to the literal
string `true` when an offline mock-data demo is intentional.

### Connecting to a live backend

Create `.env.local`:

```bash
VITE_API_BASE_URL=https://grid-senseai-backend.fastapicloud.dev
VITE_USE_MOCK_DATA=false
```

Then restart the dev server. The header switches from `SIMULATION` to `LIVE`.

---

## Environment Variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Vercel dashboard → Settings → Environment Variables | Yes (for live mode) | Full URL of the deployed backend, e.g. `https://<your-app>.fastapicloud.dev` — no trailing slash |
| `VITE_USE_MOCK_DATA` | Same | Yes (for live mode) | Set to the literal string `false` to use the real backend. Set it to `true` only for intentional offline demo mode |

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
│   ├── App.jsx                  # Main dashboard layout and composition
│   ├── main.jsx                 # React 18 entry point
│   ├── api/
│   │   ├── client.js            # Backend API client
│   │   └── mocks.js             # Demo-mode mock data
│   ├── components/              # UI building blocks
│   │   ├── AnimatedNumber.jsx
│   │   ├── AssetTable.jsx
│   │   ├── ErrorBanner.jsx
│   │   ├── Footer.jsx
│   │   ├── ForecastChart.jsx
│   │   ├── Header.jsx
│   │   ├── Panel.jsx
│   │   ├── RiskDetail.jsx
│   │   ├── StatCard.jsx
│   │   ├── StatusDot.jsx
│   │   └── TickRuler.jsx
│   ├── config/
│   │   ├── tokens.js            # Colors, fonts, status helpers
│   │   └── zones.js             # Zone IDs, labels, coordinates, channel colors
│   ├── hooks/
│   │   ├── useAnimatedNumber.js
│   │   └── useGridData.js       # Data fetching, selection, sorting
│   ├── styles/
│   │   └── index.css            # Tailwind v4 theme + Google Fonts
│   └── three/
│       ├── GridTopology3D.jsx   # Canvas + interaction wrapper
│       └── scene/
│           ├── buildScene.js    # Scene graph assembly
│           ├── labels.js        # Zone label sprites
│           ├── transformer.js   # Procedural transformer model
│           └── transmissionLine.js  # Catenary transmission lines
├── docs/                        # 13-document suite (mirrored from backend repo)
├── index.html                   # Vite entry + font preconnect
├── vite.config.js               # Vite + React + Tailwind plugins
├── vercel.json                  # Vercel build config + SPA rewrite
└── .env.example                 # Environment variable template
```

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18.3.1 | Concurrent rendering, stable ecosystem |
| Build | Vite 5.4 | Sub-second HMR, clean env-var handling |
| 3D | Three.js 0.185.1 | Procedural grid topology with raycasting and animated energy particles |
| Charts | Recharts 2.15.4 | Forecast chart with a fixed ±8% band around the point forecast |
| Styling | Tailwind CSS 4.3.3 + CSS custom properties | Utility-first styling with a centralized HSL design-token system |
| Fonts | Google Fonts (Orbitron, Rajdhani, Chakra Petch, Work Sans, Space Mono) | Multi-font hierarchy for a professional mission-control aesthetic |

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
