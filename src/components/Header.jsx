import { useEffect, useState } from "react";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";
import { API_BASE_URL, USE_MOCK_DATA } from "../api/client.js";
import {
  FONT_BODY,
  FONT_BRAND,
  FONT_MONO,
  stateColor,
  statusFromScore,
  riskPercent,
  riskPercentText,
} from "../config/tokens.js";
import { Icon } from "./Icon.jsx";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="hidden md:flex flex-col items-end">
      <span
        className="tabular text-xs text-txt-dim"
        style={{ fontFamily: FONT_MONO }}
      >
        {now.toISOString().slice(0, 16).replace("T", " ")} UTC
      </span>
      <span
        className="text-2xs tracking-label uppercase text-txt-muted"
        style={{ fontFamily: FONT_MONO }}
      >
        {USE_MOCK_DATA ? "SIMULATION MODE" : "LIVE MODEL SNAPSHOT"}
      </span>
    </div>
  );
}

export function Header({
  criticalCount,
  systemAvgRisk,
  lastUpdated,
  assetCount,
  forecastMeta,
  health,
}) {
  const avg = riskPercent(systemAvgRisk);
  const animatedAvg = useAnimatedNumber(avg.shown);

  const systemStatus = statusFromScore(systemAvgRisk);
  const statusColor = stateColor(criticalCount > 0 ? "critical" : systemStatus);
  const statusLabel =
    criticalCount > 0
      ? "CRITICAL ALERT"
      : systemStatus === "elevated"
        ? "ELEVATED WATCH"
        : "SYSTEM NORMAL";
  const statusIcon = criticalCount > 0 ? "bolt" : systemStatus === "elevated" ? "alert" : "shield";

  // The ribbon must not imply data freshness. `lastUpdated` is only when this
  // browser last completed a fetch; the load behind it is as old as the feed's
  // own newest stamped hour, which /health declares and //{zone} echoes. When
  // neither answers, say so instead of guessing.
  const dataAgeHours = (() => {
    const prov = health?.data_provenance;
    const loadStamp = prov?.load_latest_timestamp || forecastMeta?.originTimestamp;
    const ref = health?.generated_at ? new Date(health.generated_at) : null;
    if (loadStamp && ref && !Number.isNaN(ref.getTime())) {
      const h = (ref.getTime() - new Date(loadStamp).getTime()) / 3.6e6;
      if (Number.isFinite(h)) return Math.max(0, h);
    }
    return typeof forecastMeta?.originAgeHours === "number"
      ? Math.max(0, forecastMeta.originAgeHours)
      : null;
  })();
  const ageText =
    dataAgeHours == null
      ? "DATA AGE UNREPORTED"
      : dataAgeHours < 1
        ? `DATA ${Math.round(dataAgeHours * 60)} MIN OLD`
        : `DATA ${dataAgeHours.toFixed(1)} H OLD`;
  const ageTone =
    dataAgeHours == null
      ? "text-txt-muted"
      : dataAgeHours > 36
        ? "text-caution"
        : "text-txt-muted";

  return (
    <header className="glass-header shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[var(--gutter)] sm:px-5 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            <img
              src="/images/logo-tile.png"
              alt=""
              width="128"
              height="128"
              decoding="async"
              className="h-11 sm:h-12 w-11 sm:w-12 rounded-panel object-cover object-center ring-1 ring-cyan/30"
              style={{ boxShadow: "var(--shadow-glow-cyan)" }}
            />
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-pill animate-pulse"
              style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
              aria-hidden="true"
            />
          </div>
          <h1 className="flex flex-col min-w-0" style={{ margin: 0 }}>
            <span className="sr-only">
              GridSense AI — weather-aware grid overload risk prediction
            </span>
            <span
              className="flex items-baseline leading-none text-lg sm:text-xl tracking-display"
              aria-hidden="true"
            >
              <span style={{ fontFamily: FONT_BRAND, fontWeight: 700, color: "var(--color-txt)" }}>
                Grid
              </span>
              <span style={{ fontFamily: FONT_BRAND, fontWeight: 800, color: "var(--color-cyan)" }}>
                Sense
              </span>
              <span
                className="ml-0.5 text-xs"
                style={{ fontFamily: FONT_BRAND, fontWeight: 700, color: "var(--color-cyan)" }}
              >
                .AI
              </span>
            </span>
            <span className="flex items-center gap-2 mt-1" aria-hidden="true">
              <span
                className="text-2xs tracking-label px-1.5 py-px rounded-control border border-cyan/25 bg-cyan/5 shrink-0"
                style={{ fontFamily: FONT_MONO, color: "var(--color-cyan)" }}
              >
                v2.0
              </span>
              <span
                className="text-2xs text-txt-dim min-w-0"
                style={{ fontFamily: FONT_BODY }}
              >
                Overload risk, forecast 24 hours ahead.
              </span>
            </span>
          </h1>
        </div>

        {/* System status + clock */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            role="status"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-control border border-line/60 bg-field/50"
          >
            <span style={{ color: statusColor }} aria-hidden="true">
              <Icon name={statusIcon} size={14} strokeWidth={1.8} />
            </span>
            <span
              className="text-2xs font-bold tracking-label"
              style={{ fontFamily: FONT_MONO, color: statusColor }}
            >
              {statusLabel}
            </span>
            <span className="sr-only">
              {criticalCount > 0
                ? `${criticalCount} zone${criticalCount === 1 ? "" : "s"} in critical state. `
                : "No zones in critical state. "}
            </span>
            <span className="w-px h-3 bg-line/60" aria-hidden="true" />
            <span
              className="tabular text-xs text-txt-dim"
              style={{ fontFamily: FONT_MONO }}
              aria-hidden="true"
            >
              AVG {avg.prefix}
              {animatedAvg.toFixed(avg.decimals)}%
            </span>
            <span className="sr-only">
              System average risk {riskPercentText(systemAvgRisk)} percent across{" "}
              {assetCount} monitored interconnections.
            </span>
          </div>

          <Clock />
        </div>
      </div>

      {/* Source ribbon */}
      <div
        className="h-px"
        style={{ background: "var(--gradient-line)" }}
        aria-hidden="true"
      />
      <div className="px-[var(--gutter)] sm:px-5 py-1.5 flex items-center justify-between gap-3 text-2xs text-txt-muted">
        <span
          className="tabular min-w-0 truncate hidden sm:inline"
          style={{ fontFamily: FONT_MONO }}
        >
          {USE_MOCK_DATA ? "SIMULATED DATA" : `SOURCE · ${API_BASE_URL}`}
          {lastUpdated &&
            ` · LAST FETCH ${lastUpdated.toISOString().slice(11, 19)} UTC · AUTO-REFRESH 60S`}
          {` · ${ageText}`}
        </span>
        <span
          className={`tabular min-w-0 sm:hidden ${dataAgeHours != null && dataAgeHours > 36 ? ageTone : ""}`}
          style={{ fontFamily: FONT_MONO }}
        >
          {USE_MOCK_DATA ? "SIMULATED DATA" : "REAL-DATA FEED"}
          {lastUpdated ? ` · FETCHED ${lastUpdated.toISOString().slice(11, 16)} UTC` : " · FETCH PENDING"}
          {` · ${ageText}`}
        </span>
        <span
          className="hidden lg:inline shrink-0 tracking-label uppercase"
          style={{ fontFamily: FONT_MONO }}
        >
          ENTSO-E + NASA POWER · LIGHTGBM · SHAP
        </span>
      </div>

      {/* Poll cadence: the bar fills over exactly the 60s refresh interval. */}
      <div className="h-[2px] bg-line/40 overflow-hidden" aria-hidden="true">
        <div
          key={lastUpdated ? lastUpdated.getTime() : "initial"}
          className="refresh-bar h-full"
          style={{
            background: `linear-gradient(90deg, ${statusColor}, var(--color-cyan))`,
            opacity: 0.7,
          }}
        />
      </div>
    </header>
  );
}
