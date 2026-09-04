# GridSense AI — Frontend

3D power-grid risk dashboard. React + Three.js + Recharts, deploys to Vercel.

**Start here:** `docs/06_Project_Overview.md` for what this is,
`docs/07_User_Manual.md` for how to use the live dashboard,
`docs/05_Deployment_Guide.md` for how to deploy it.

## Quick local run

```bash
npm install
npm run dev
```

Runs in demo mode by default (`VITE_USE_MOCK_DATA=true` unless overridden) — no backend
required to see it working.

## Connecting to a real backend

Copy `.env.example` to `.env.local` and set:
```
VITE_API_BASE_URL=https://your-backend-url
VITE_USE_MOCK_DATA=false
```

## Important

This repo is frontend-only. It should never contain `requirements.txt`, an `api/`
folder, `.joblib` files, or any other Python backend code — an earlier attempt to merge
backend code in here broke the Vercel build (Python dependencies don't fit Vercel's
serverless function size limit). See `docs/03_System_Architecture.md` Section 2.2 for
the full story, and `docs/09_Two_Repo_Setup_Guide.md` for the correct repo split.

## Full documentation

Same doc set as the backend repo — see `docs/` here for the complete set, particularly
`docs/07_User_Manual.md` for how to actually read and use the dashboard.
