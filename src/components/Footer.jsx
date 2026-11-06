import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FONT_BRAND,
  FONT_BODY,
  FONT_MONO,
  STAGGER_MS,
} from "../config/tokens.js";
import { API_BASE_URL, USE_MOCK_DATA } from "../api/client.js";
import { prefersReducedMotion } from "../hooks/useMediaQuery.js";
import { Icon } from "./Icon.jsx";

const SITE_URL = "https://grid-senseai.vercel.app";
const BACKEND_REPO = "https://github.com/huzaifahimad/Grid_Sense.AI-Backend-";
const FRONTEND_REPO = "https://github.com/huzaifahimad/Grid_Sense.AI-frontend-";

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hourCycle: "h23",
});

function utc(stamp) {
  const d = stamp ? new Date(stamp) : null;
  return d && !Number.isNaN(d.getTime()) ? `${STAMP.format(d).replace(",", "")}Z` : null;
}

function ageLabel(h) {
  if (h == null) return null;
  if (h < 48) return `${h.toFixed(0)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

function rowCounts(obj) {
  if (!obj) return null;
  return Object.entries(obj)
    .map(([k, v]) => `${k} ${v.toLocaleString()}`)
    .join(" / ");
}

const LINKS = [
  { label: "API reference", href: `${API_BASE_URL}/docs` },
  { label: "Validation report", href: `${API_BASE_URL}/validation` },
  { label: "Backend source", href: BACKEND_REPO },
  { label: "Frontend source", href: FRONTEND_REPO },
  { label: "This deployment", href: SITE_URL },
];

function ColHeading({ children }) {
  return (
    <h2
      className="text-sm font-semibold text-txt"
      style={{ fontFamily: FONT_BODY }}
    >
      {children}
    </h2>
  );
}

/** Label/value line. On a phone the label sits over the value so neither wraps
    mid-word; from sm up they share a line. */
function Fact({ label, value, missing }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <dt
        className="text-2xs uppercase tracking-label text-txt-faint shrink-0"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </dt>
      <dd
        className={`text-xs tabular ${
          missing ? "text-txt-faint italic" : "text-txt-dim"
        }`}
        style={{ fontFamily: FONT_MONO }}
      >
        {value ?? "unconfirmed"}
      </dd>
    </div>
  );
}

export function Footer({ health, validation }) {
  const shell = useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  // Columns start visible. The reveal only arms itself when motion is allowed
  // and the observer exists, and a timer forces the shown state regardless, so
  // a missed intersection can never leave the legal text invisible.
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;
    setArmed(true);
  }, []);

  useEffect(() => {
    if (!armed) return undefined;
    const el = shell.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown(true);
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    const failsafe = setTimeout(() => setShown(true), 1500);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [armed]);

  const prov = health?.data_provenance;
  const weatherLagH = prov?.weather_lag_hours;
  const newestHour = utc(health?.serving_window_end ?? prov?.load_latest_timestamp);
  const zones = health?.zones ?? [];

  const report = validation?.report;
  const gates = report?.gates;
  const passCount = gates ? gates.filter((g) => g.result === "PASS").length : null;
  const gateLine = gates
    ? `${passCount}/${gates.length} pass · overall ${report.overall}`
    : validation?.state === "missing"
      ? "no /validation on this backend"
      : validation?.state === "error"
        ? "validation endpoint unreachable"
        : null;

  const rows = [
    { label: "Zones", value: zones.length ? zones.join(", ") : null },
    { label: "Newest hour scored", value: newestHour },
    {
      label: "Load rows",
      value: rowCounts(prov?.load) || (prov ? "none" : null),
    },
    {
      label: "Weather rows",
      value: rowCounts(prov?.weather) || (prov ? "none" : null),
    },
    {
      label: "Weather lag",
      value:
        weatherLagH != null ? `${ageLabel(weatherLagH)} behind load` : null,
    },
    { label: "Capacity basis", value: prov?.capacity ?? null },
    {
      label: "Synthetic data",
      value: prov ? (prov.is_synthetic ? "present" : "none") : null,
    },
    { label: "Release gates", value: gateLine },
  ];

  const revealed = !armed || shown;

  return (
    <footer
      ref={shell}
      className="glass-footer shrink-0"
      aria-labelledby="footer-heading"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-cyan/25 to-transparent" />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-6 pb-0 sm:pb-5">
        <h2 id="footer-heading" className="sr-only">
          About GridSense AI, data sources and project links
        </h2>

        <div className="grid gap-7 sm:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]">
          {/* ---- About ---- */}
          <section
            aria-label="About GridSense AI"
            className="min-w-0"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "none" : "translate3d(0,12px,0)",
              transition: `opacity 420ms var(--ease-out-quart), transform 420ms var(--ease-out-quart)`,
            }}
          >
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span
                className="text-base font-bold tracking-display text-cyan"
                style={{ fontFamily: FONT_BRAND }}
              >
                GRIDSENSE AI
              </span>
              <span
                className="text-xs text-txt-muted"
                style={{ fontFamily: FONT_BODY }}
              >
                Overload risk, forecast 24 hours ahead.
              </span>
            </div>
            <p
              className="mt-2.5 text-xs sm:text-sm text-txt-dim leading-relaxed max-w-[62ch]"
              style={{ fontFamily: FONT_BODY }}
            >
              An operational dashboard and API for transmission interconnections:
              it forecasts hourly load up to a day ahead, scores how close each
              zone runs to its capacity line, and reports the interval the
              forecast actually lives in. Every figure on the page is served from
              trained models and validated by replaying the served window hour by
              hour.
            </p>
            <p
              className="mt-2.5 text-xs text-txt-muted leading-relaxed max-w-[66ch]"
              style={{ fontFamily: FONT_BODY }}
            >
              <span className="text-gold font-semibold uppercase tracking-label text-2xs">
                Data provenance:{" "}
              </span>
              European ENTSO-E load and NASA POWER weather used as{" "}
              <strong className="text-txt">proxies</strong>. This is not Pakistani
              NTDC/DISCO data, and no accuracy figure here transfers to
              NTDC/DISCO without retraining on grid-operator data and a fresh
              validation run.
            </p>
            <p
              className="mt-3 text-xs text-txt-dim"
              style={{ fontFamily: FONT_BODY }}
            >
              Designed, trained and built by{" "}
              <span className="font-semibold text-txt">Huzaifa Himad</span>.
            </p>
          </section>

          {/* ---- Live data status ---- */}
          <section
            aria-label="Data sources and model status"
            className="min-w-0"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "none" : "translate3d(0,12px,0)",
              transition: `opacity 420ms var(--ease-out-quart) ${STAGGER_MS}ms, transform 420ms var(--ease-out-quart) ${STAGGER_MS}ms`,
            }}
          >
            <ColHeading>What the API is reading now</ColHeading>
            <dl className="mt-2.5 flex flex-col gap-2">
              {rows.map((r) => (
                <Fact
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  missing={!r.value}
                />
              ))}
            </dl>
            <p
              className="mt-3 text-2xs text-txt-faint leading-relaxed"
              style={{ fontFamily: FONT_BODY }}
            >
              {USE_MOCK_DATA
                ? "Serving simulated demo data in this build — the rows above are not real feed readings."
                : "These rows come from GET /health and GET /validation on the live API, not from a static label."}
            </p>
          </section>

          {/* ---- Links ---- */}
          <section
            aria-label="Project resources"
            className="min-w-0"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "none" : "translate3d(0,12px,0)",
              transition: `opacity 420ms var(--ease-out-quart) ${STAGGER_MS * 2}ms, transform 420ms var(--ease-out-quart) ${STAGGER_MS * 2}ms`,
            }}
          >
            <ColHeading>Project</ColHeading>
            <ul className="mt-2 flex flex-col">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="footer-link"
                  >
                    <span>{l.label}</span>
                    <Icon
                      name="link"
                      size={12}
                      strokeWidth={1.8}
                      className="footer-link-glyph"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ---- Legal / build strip ---- */}
        <div className="mt-6 pt-3 border-t border-line/70 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div
            className="text-xs text-txt-dim leading-relaxed"
            style={{ fontFamily: FONT_BODY }}
          >
            <p>
              <span className="font-semibold text-txt">Powered by Huzaifa Himad</span>
            </p>
            <p className="mt-1 text-2xs text-txt-faint">
              &copy; {new Date().getFullYear()} GridSense AI. All rights
              reserved. Research prototype for grid operators; not a dispatch
              instruction.
            </p>
          </div>
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-txt-faint tracking-label sm:justify-end"
            style={{ fontFamily: FONT_MONO }}
          >
            <span className="text-cyan/80 font-bold">v2.0</span>
            <span className="opacity-40">·</span>
            <span>{USE_MOCK_DATA ? "SRC: SIMULATED" : "SRC: ENTSO-E + NASA POWER"}</span>
            {gates && (
              <>
                <span className="opacity-40">·</span>
                <span>
                  REPLAY:{" "}
                  {report.window?.rows_scored?.toLocaleString() ?? "n/a"} HOURS
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
