import { FONT_MONO, FONT_BODY, colorWithAlpha, C } from "../config/tokens.js";
import { Icon } from "./Icon.jsx";

// A feed bar reads as "how much of the last 48 h this input actually covers".
// The window is a presentation choice, not a model constant: fresh inputs are
// hours old, so anything past two days renders as an empty track.
const CURRENCY_WINDOW_H = 48;
const LOAD_OK_H = 36;
const WEATHER_OK_H = 48;

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hourCycle: "h23",
});

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function stamp(iso) {
  const d = toDate(iso);
  return d ? `${STAMP.format(d).replace(",", "")}Z` : "—";
}

function ageHours(iso, ref) {
  const d = toDate(iso);
  if (!d || !ref) return null;
  return Math.max(0, (ref.getTime() - d.getTime()) / 3.6e6);
}

function ageLabel(h) {
  if (h == null) return "no timestamp";
  if (h < 1) return "under 1 h old";
  if (h < 48) return `${h.toFixed(0)} h old`;
  return `${(h / 24).toFixed(1)} d old`;
}

const LEVEL = {
  live: { color: C.safe, icon: "check", label: "LIVE" },
  caution: { color: C.caution, icon: "alert", label: "LAGGED" },
  proxy: { color: C.gold, icon: "info", label: "ESTIMATED" },
  stale: { color: C.critical, icon: "clock", label: "REPLAY" },
};

function Channel({ id, icon, source, status, time, age, fill, hatched, note, delay }) {
  const level = LEVEL[status.level];
  const pct = fill == null ? 1 : Math.max(0, Math.min(1, fill));
  return (
    <div
      className="rounded-control p-3 border min-w-0 animate-fade-in"
      style={{
        background: colorWithAlpha(level.color, 0.04),
        borderColor: colorWithAlpha(level.color, 0.16),
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className="flex items-center gap-1.5 text-2xs tracking-label uppercase min-w-0"
          style={{ fontFamily: FONT_MONO, color: "var(--color-txt-dim)" }}
        >
          <span style={{ color: level.color }} aria-hidden="true">
            <Icon name={icon} size={12} />
          </span>
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{id}</span>
        </span>
        <span
          className="flex items-center gap-1 shrink-0 text-2xs font-bold tracking-label px-1.5 py-0.5 rounded-control"
          style={{
            fontFamily: FONT_MONO,
            color: level.color,
            background: colorWithAlpha(level.color, 0.12),
          }}
        >
          <Icon name={level.icon} size={10} strokeWidth={2.4} />
          {status.label ?? level.label}
        </span>
      </div>

      <div
        className="mt-1.5 text-xs leading-snug text-txt-dim"
        style={{ fontFamily: FONT_BODY }}
      >
        {source}
      </div>

      <div
        className="mt-1 text-2xs tabular tracking-label uppercase"
        style={{ fontFamily: FONT_MONO, color: "var(--color-txt-muted)" }}
      >
        {time} · {age}
      </div>

      <div
        className="mt-2 h-[3px] rounded-pill bg-line/70 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`rail-fill h-full origin-left ${hatched ? "hatch-proxy" : ""}`}
          style={{
            transform: `scaleX(${pct})`,
            background: hatched ? "transparent" : level.color,
            opacity: hatched ? 0.7 : 0.85,
            animationDelay: `${delay + 120}ms`,
          }}
        />
      </div>

      {note && (
        <div
          className="mt-1.5 text-2xs leading-snug"
          style={{ fontFamily: FONT_MONO, color: level.color }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

/**
 * Per-feed currency, straight from GET /health plus the forecast/risk payloads.
 * The headline risk number is a replay of the newest hour every input covers,
 * which is not the same hour the load feed reaches — so the dashboard states
 * both instead of implying one "live" timestamp.
 */
export function SignalRail({ health, forecastMeta, risk, delay = 0 }) {
  if (!health && !risk) {
    return (
      <div
        role="status"
        className="glass-panel rounded-panel px-4 py-3 shrink-0 animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <span
          className="flex items-center gap-2 text-2xs tracking-label uppercase text-txt-muted"
          style={{ fontFamily: FONT_MONO }}
        >
          <span className="w-2 h-2 rounded-pill bg-cyan animate-pulse" aria-hidden="true" />
          Reading feed provenance…
        </span>
      </div>
    );
  }

  const prov = health?.data_provenance || null;
  const ref = toDate(health?.generated_at) || (risk ? new Date() : null);

  const loadAge = ageHours(prov?.load_latest_timestamp ?? forecastMeta?.originTimestamp, ref);
  const weatherAge = ageHours(prov?.weather_latest_timestamp, ref);
  const riskAge = ageHours(risk?.snapshot_timestamp, ref);
  const weatherLagH = prov?.weather_lag_hours ?? null;

  const servedBy = forecastMeta?.servedBy ?? null;
  const weatherBlind = servedBy === "no_weather_fallback";
  const capacityProxy =
    prov?.capacity === "p99-of-load proxy" || risk?.is_proxy_capacity === true;

  const weatherBehind =
    weatherLagH != null ? weatherLagH > LOAD_OK_H : weatherAge != null && weatherAge > WEATHER_OK_H;

  const forecasterLine =
    servedBy == null
      ? "Which forecaster served the 24 h window is not reported yet. "
      : weatherBlind
        ? "The 24 h forecast is therefore served by the weather-blind fallback. "
        : "The 24 h forecast is served by the weather-aware model. ";

  const summary = prov
    ? `Load reaches ${stamp(prov.load_latest_timestamp)}; weather only ${stamp(
        prov.weather_latest_timestamp
      )}${weatherLagH != null ? `, ${weatherLagH.toFixed(0)} h behind it` : ""}. ` +
      forecasterLine +
      (capacityProxy ? "Capacity remains a p99 proxy, not rated MW." : "Capacity is rated MW.")
    : "No /health provenance available from this backend, so feed currency cannot be confirmed.";

  return (
    <section
      aria-label="Input feed currency and provenance"
      className="glass-panel rounded-panel px-3 py-3 sm:px-4 sm:py-3.5 shrink-0 animate-panel-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <h2
          className="flex items-center gap-2 text-2xs tracking-label uppercase min-w-0"
          style={{ fontFamily: FONT_MONO, color: "var(--color-txt-muted)", margin: 0 }}
        >
          <span style={{ color: "var(--color-cyan)" }} aria-hidden="true">
            <Icon name="radar" size={12} />
          </span>
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            Signal integrity
          </span>
        </h2>
        <span
          className="text-2xs tabular tracking-label uppercase text-txt-faint shrink-0"
          style={{ fontFamily: FONT_MONO }}
        >
          REF {stamp(health?.generated_at)}
        </span>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Channel
          id="GRID LOAD"
          icon="database"
          source={
            prov && Object.keys(prov.load || {}).join("+").includes("entsoe")
              ? "ENTSO-E Transparency · actual load"
              : prov
                ? `Source stamp: ${Object.keys(prov.load || {}).join(", ") || "unstamped"}`
                : "Provenance not reported"
          }
          status={{
            level: prov?.is_synthetic
              ? "stale"
              : loadAge != null && loadAge <= LOAD_OK_H
                ? "live"
                : "caution",
            label: prov?.is_synthetic ? "SIMULATED" : null,
          }}
          time={stamp(prov?.load_latest_timestamp ?? forecastMeta?.originTimestamp)}
          age={ageLabel(loadAge)}
          fill={loadAge == null ? 0 : 1 - loadAge / CURRENCY_WINDOW_H}
          delay={delay}
        />
        <Channel
          id="WEATHER"
          icon="wave"
          source="NASA POWER · hourly reanalysis"
          status={{
            level: prov?.is_synthetic ? "stale" : weatherBehind ? "caution" : "live",
            label: prov?.is_synthetic ? "SIMULATED" : null,
          }}
          time={stamp(prov?.weather_latest_timestamp)}
          age={weatherLagH != null ? `${weatherLagH.toFixed(0)} h behind load` : ageLabel(weatherAge)}
          fill={
            weatherLagH != null
              ? Math.max(0, 1 - (loadAge ?? 0) / CURRENCY_WINDOW_H - weatherLagH / (CURRENCY_WINDOW_H * 3))
              : weatherAge == null
                ? 0
                : 1 - weatherAge / CURRENCY_WINDOW_H
          }
          note={
            weatherBlind
              ? "FORECAST WEATHER-BLIND"
              : weatherBehind
                ? "REANALYSIS TAIL UNPUBLISHED"
                : null
          }
          delay={delay + 60}
        />
        <Channel
          id="CAPACITY"
          icon="layers"
          source={capacityProxy ? "p99 of observed load, per zone" : "Rated MW from asset register"}
          status={{ level: capacityProxy ? "proxy" : "live", label: capacityProxy ? null : "RATED" }}
          time="per-zone"
          age={capacityProxy ? "not measured" : "operator supply"}
          fill={1}
          hatched={capacityProxy}
          note={capacityProxy ? "OVERLOAD = RELATIVE TO P99" : null}
          delay={delay + 120}
        />
        <Channel
          id="RISK SNAPSHOT"
          icon="clock"
          source={
            servedBy
              ? `Scored by ${servedBy === "weather_aware" ? "weather-aware" : "no-weather"} model`
              : "Scored by the deployed risk model"
          }
          status={{
            level:
              riskAge == null
                ? "caution"
                : riskAge > LOAD_OK_H
                  ? "stale"
                  : "live",
            label:
              riskAge == null ? "NO STAMP" : riskAge > LOAD_OK_H ? "REPLAY" : null,
          }}
          time={stamp(risk?.snapshot_timestamp)}
          age={ageLabel(riskAge)}
          fill={riskAge == null ? 0 : 1 - riskAge / CURRENCY_WINDOW_H}
          note={
            riskAge != null && riskAge > LOAD_OK_H
              ? "NEWEST FULL-FEATURE HOUR"
              : null
          }
          delay={delay + 180}
        />
      </div>

      <p
        className="mt-2.5 text-2xs leading-relaxed text-txt-muted"
        style={{ fontFamily: FONT_BODY }}
      >
        {summary}
      </p>

      <div
        className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs tracking-label uppercase text-txt-faint"
        style={{ fontFamily: FONT_MONO }}
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[3px] rounded-pill bg-safe/80" aria-hidden="true" />
          CURRENT
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[3px] rounded-pill hatch-proxy" aria-hidden="true" />
          PROXY / ESTIMATED
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[3px] rounded-pill bg-line" aria-hidden="true" />
          BAR = COVERAGE OF LAST 48 H
        </span>
        <span className="ml-auto hidden sm:inline">GET /health · data_provenance</span>
      </div>
    </section>
  );
}
