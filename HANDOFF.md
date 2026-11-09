# HANDOFF — gridsense-frontend

Written 2026-11-09. Frozen working tree; **not deployed**.

## STATE

React 18 + Vite + Tailwind v4 dashboard for GridSense AI. Desktop three-column layout with a
3D topology view; phone layout is five true `role="tabpanel"` views (RISK / LOAD / FEEDS / GRID /
REPORT) mounted one at a time, with a fixed bottom tab bar. It reads the FastAPI backend at
`https://grid-senseai-backend.fastapicloud.dev`.

| | |
|---|---|
| Working branch | `wip/handoff-2026-11-09` @ **b6324f8** (pre-HANDOFF.md) |
| Base / deployed | `main` @ **2d630e6**, identical to `origin/main` (`rev-list` = `0 0`) |
| Divergence | Branch is 1 commit ahead, 5 files, +109/−16 |
| Deployed? | **No.** Vercel deploys `main`; the live site is unchanged and safe to show. |

**Check, as run on this tree:**

```
$ npm run build
vite v5.4.21 building for production...
✓ 865 modules transformed.
✓ built in 14.62s
```

Build passes. **No browser verification of this branch** — the defects below were *reproduced*
on the pre-fix build at 393×852 CSS px, and the fix is build-checked only.

## DONE

| Item | Evidence |
|---|---|
| Phone layout as 5 true tab views (no scroll-jump), verified in Chromium | commit `2d630e6`; agent report: every switch lands `scrollY=0`, new `[role=tabpanel]`, arrow keys move selection+focus |
| DOM ↔ API parity verified live | agent report: LOAD/ES `origin 11-07 06:00Z · 1.9 h old`, `PEAK 28761 MW` matched `/forecast/ES` exactly; risk numbers matched `/risk/ES` |
| Y-axis clip fixed (this branch) | `ForecastChart.jsx`: recharts draws ticks at `width-15`, so `width={48}` left 33 px for a ~63 px label and cut the leading digit of every tick; ticks now compact to `29k MW` inside a 62 px band |
| "HOURS AHEAD" overlap fixed (this branch) | caption moved from an SVG `insideBottom` label (baseline outside the clipped box) to a DOM caption |
| Security headers added (this branch) | `vercel.json`: nosniff, `Referrer-Policy`, `X-Frame-Options: DENY`, CSP with `connect-src` for the FastAPI host — **not live until a main deploy** |
| No credential in any frontend request | agent report: zero sensitive headers or query params observed |

## IN PROGRESS

1. **Browser re-verification of this branch at 393×852.** The chart fix is reasoned and build-clean
   but unmeasured. **Next step:** build with `VITE_API_BASE_URL` overridden, serve on a spare port,
   mount at 393×852 in Chromium, screenshot the LOAD tab, and confirm no tick is truncated and the
   caption is below the tick row. Note: Playwright's `isMobile:true` inflates the viewport to
   980×2125 — use plain viewport emulation to get true 393 px.
2. **`Header.jsx` data-age wording** is part of the same unverified change set; the pre-fix header
   tracked wall-clock poll time (~1 min) rather than data age, while genuine staleness lives in the
   FEEDS rail.

## PENDING

| Task | Acceptance criteria | Effort | Risk | Depends on |
|---|---|---|---|---|
| Verify chart/header fix in a browser | screenshot at the fixed commit, no clipping, no overlap | S | Low | — |
| Deploy the security headers | headers present on the deployed `vercel.json`; re-measure with `curl -I` | S | Medium (needs a main deploy) | owner approval |
| Desktop ≥1024 px regression pass | three-column layout renders, 3D shows, no console errors | M | Low | — |
| OrbitControls drag / touch paths | drag rotates the model on desktop; touch works on phone | S | Low | — |
| Tap targets under 44 px | chart legend 38 px and sort headers 40 px raised to ≥44 px | S | Low | — |
| GRID tab zone coherence | switching zone updates the 3D view and asset table within the viewport, not only after scrolling | S | Low | — |
| Per-zone exploration UI | each zone's history and forecast independently selectable | M | Low | backend |
| Closed-loop replay picker | user can choose a replay window instead of the fixed one | M | Low | backend |

## BROKEN OR RISKY

- **The deployed app still scores a risk snapshot 7.0 days old** beside a 1.9 h forecast. That is a
  backend defect (`RISK_FEATURE_COLS` requires weather), not something the UI can fix; the FEEDS
  rail states it honestly. Do not "fix" it by hiding the age.
- **The CSP is untested.** `vercel.json` is committed but not deployed; a too-tight `connect-src`
  or `script-src` would blank the app. Verify on a preview deployment before promoting to production.
- Vercel intermittently returns `403 x-vercel-mitigated: challenge` to automated clients after
  ~15 loads. That blocks headless review, not real users. Do not chase it with a bypass.
- The 3D component's console shows a THREE.js shader warning (X4122) while rendering fine.

## HOW TO RUN

```bash
npm install
npm run dev        # Vite dev server

# production build with the API base baked in at build time
VITE_API_BASE_URL=https://grid-senseai-backend.fastapicloud.dev npm run build
npm run preview

# local backend (separate repo) must allow the origin:
#   CORS_ORIGINS=http://localhost:4173 GRIDSENSE_REFRESH=false uvicorn api.main:app --port 8124
```

Deploy: pushing `main` triggers Vercel. **Do not push `main` without approval.**

## RULES THE NEXT AGENT MUST FOLLOW

1. Do not deploy, and do not push `main` without the owner's explicit approval — it auto-deploys the
   site being shown to reviewers.
2. Do not widen the backend CORS allowlist to make a local probe work. The live host correctly
   refuses a `localhost` origin.
3. Do not "improve" a number by changing a threshold, a label, or a copy string. If a figure on
   screen is wrong, fix the figure's source, not the display.
4. Every claim of verification must name the viewport, the commit, and the tool used.
5. Keep `_extract_dist_env.py` and `.verify/` out of git (now ignored).
