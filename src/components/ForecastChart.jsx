import { useState } from "react";
import {
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Panel } from "./Panel.jsx";
import { Icon } from "./Icon.jsx";
import { ZONE_CHANNEL_COLOR } from "../config/zones.js";
import {
  C,
  FONT_MONO,
  FONT_BODY,
  hexFromChannel,
  colorWithAlpha,
} from "../config/tokens.js";

const SERIES = [
  { key: "band", label: "P10–P90 band", icon: "layers" },
  { key: "p50", label: "P50 median", icon: "activity" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const by = (key) => payload.find((p) => p.dataKey === key)?.value;
  const p50 = by("p50");
  const p10 = by("p10");
  const p90 = by("p90");
  return (
    <div
      className="rounded-control px-2.5 py-2 text-xs"
      style={{
        background: "hsl(216 30% 8% / 0.94)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${colorWithAlpha(C.cyan, 0.4)}`,
        boxShadow: "var(--shadow-panel)",
        fontFamily: FONT_MONO,
      }}
    >
      <div className="text-txt-muted text-2xs tracking-label uppercase mb-1">
        HOUR +{label}
      </div>
      {p50 != null && (
        <div className="tabular text-txt font-bold">{p50.toFixed(0)} MW</div>
      )}
      {p10 != null && p90 != null && (
        <div className="tabular text-txt-dim text-2xs mt-0.5">
          {p10.toFixed(0)}–{p90.toFixed(0)} MW
        </div>
      )}
    </div>
  );
}

export function ForecastChart({
  forecast,
  forecastMeta,
  selectedZone,
  delay = 0,
  index = "04",
}) {
  const channelHex = hexFromChannel(ZONE_CHANNEL_COLOR[selectedZone]);
  const [visible, setVisible] = useState({ band: true, p50: true });

  const finite = forecast.filter((p) => Number.isFinite(p.p50));
  const peak = finite.reduce(
    (best, p) => (best == null || p.p50 > best.p50 ? p : best),
    null
  );
  const lows = finite.map((p) => p.p50);
  const minMed = lows.length ? Math.min(...lows) : null;
  const maxMed = lows.length ? Math.max(...lows) : null;
  const bandWidth =
    finite.length && finite[0].p90 != null && finite[0].p10 != null
      ? ((finite[0].p90 - finite[0].p10) / finite[0].p50) * 100
      : null;

  const stale = forecastMeta
    ? forecastMeta.servedBy === "no_weather_fallback" ||
      (forecastMeta.originAgeHours ?? 0) > 6
    : false;
  const metaTone = stale ? C.caution : C.cyan;

  return (
    <Panel
      index={index}
      title={`24H Load Forecast — ${selectedZone.replace("_", "-")}`}
      accent={channelHex}
      delay={delay}
      meta={
        <span className="flex items-center gap-1.5">
          <Icon name="info" size={12} />
          <span className="hidden sm:inline">CONFORMAL 80%</span>
          <span className="sm:hidden">80%</span>
        </span>
      }
      className="h-full"
    >
      <div className="flex flex-col h-full min-h-0 gap-2">
        {/* Provenance: which model answered, and how old its origin is. */}
        {forecastMeta && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span
              className="flex items-center gap-1.5 text-2xs px-1.5 py-0.5 rounded-control"
              style={{
                fontFamily: FONT_MONO,
                color: metaTone,
                background: colorWithAlpha(metaTone, 0.08),
                border: `1px solid ${colorWithAlpha(metaTone, 0.24)}`,
              }}
            >
              <Icon name="cpu" size={11} />
              {forecastMeta.servedBy === "no_weather_fallback"
                ? "NO-WEATHER FALLBACK"
                : "WEATHER-AWARE"}
            </span>
            {forecastMeta.originTimestamp && (
              <span
                className="flex items-center gap-1.5 text-2xs text-txt-muted tabular"
                style={{ fontFamily: FONT_MONO }}
              >
                <Icon name="clock" size={11} />
                origin {forecastMeta.originTimestamp.slice(5, 16).replace("T", " ")}Z
                {forecastMeta.originAgeHours != null &&
                  ` · ${forecastMeta.originAgeHours.toFixed(1)} h old`}
              </span>
            )}
          </div>
        )}

        {/* Interactive legend: colour is never the only cue, each series is named. */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {SERIES.map((s) => {
            const on = visible[s.key];
            const tone = s.key === "p50" ? channelHex : C.textDim;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
                className="pressable flex items-center gap-1.5 text-2xs px-2.5 py-1.5 min-h-[38px] lg:min-h-[34px] rounded-control"
                style={{
                  fontFamily: FONT_MONO,
                  color: on ? tone : C.textFaint,
                  background: on ? colorWithAlpha(tone, 0.1) : "transparent",
                  border: `1px solid ${colorWithAlpha(on ? tone : C.line, on ? 0.3 : 0.6)}`,
                  opacity: on ? 1 : 0.7,
                }}
              >
                <Icon name={s.icon} size={11} strokeWidth={2} aria-hidden="true" />
                {s.label}
                {!on && <span className="tracking-label">OFF</span>}
              </button>
            );
          })}
          {peak && visible.p50 && (
            <span
              className="ml-auto flex items-center gap-1.5 text-2xs tabular"
              style={{ fontFamily: FONT_MONO, color: channelHex }}
            >
              <Icon name="arrowUp" size={11} strokeWidth={2} aria-hidden="true" />
              PEAK {peak.p50.toFixed(0)} MW @ +{peak.hour}h
            </span>
          )}
        </div>

        <div className="flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id={`bandFill-${selectedZone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={channelHex} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={channelHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.line} vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="hour"
                tick={{ fill: C.textFaint, fontSize: 11, fontFamily: FONT_MONO }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                minTickGap={26}
                label={{
                  value: "HOURS AHEAD",
                  position: "insideBottom",
                  offset: -2,
                  fill: C.textFaint,
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                }}
              />
              <YAxis
                tick={{ fill: C.textFaint, fontSize: 11, fontFamily: FONT_MONO }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={[
                  (min) => Math.floor((min * 0.97) / 100) * 100,
                  (max) => Math.ceil((max * 1.02) / 100) * 100,
                ]}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: channelHex, strokeOpacity: 0.35 }} />
              {visible.band && (
                <>
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stroke="none"
                    fill={`url(#bandFill-${selectedZone})`}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stroke="none"
                    fill={C.field}
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p90"
                    stroke={C.textFaint}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p10"
                    stroke={C.textFaint}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                    isAnimationActive={false}
                  />
                </>
              )}
              {visible.p50 && (
                <>
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke={channelHex}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, stroke: C.field, strokeWidth: 2, fill: channelHex }}
                    isAnimationActive={false}
                  />
                  {peak && (
                    <ReferenceDot
                      x={peak.hour}
                      y={peak.p50}
                      r={4}
                      fill={channelHex}
                      stroke={C.field}
                      strokeWidth={2}
                      isFront
                    />
                  )}
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* The chart is colour-and-mouse bound; this is the text equivalent. */}
        <p className="sr-only">
          {finite.length === 0
            ? "No forecast points available."
            : `Median load forecast for ${selectedZone.replace("_", "-")} ranges from ${minMed.toFixed(0)} to ${maxMed.toFixed(0)} megawatts over the next ${finite.length} hours. The P10 to P90 band starts about ${bandWidth != null ? bandWidth.toFixed(0) : "—"} percent wide around the median at hour plus one.${peak ? ` The highest median is ${peak.p50.toFixed(0)} megawatts at hour plus ${peak.hour}.` : ""}${forecastMeta ? ` Forecast served by the ${forecastMeta.servedBy === "no_weather_fallback" ? "no-weather fallback model" : "weather-aware model"} from an origin ${forecastMeta.originAgeHours?.toFixed(1) ?? "unknown"} hours old.` : ""}`}
        </p>
        <div
          className="text-2xs text-txt-faint leading-snug shrink-0"
          style={{ fontFamily: FONT_BODY }}
        >
          {stale
            ? "Weather inputs are lagging or unavailable for this origin, so the reduced-feature fallback model answered — its band is calibrated for that model, not the weather-aware one."
            : "Recursive weather-aware forecast; band is split-conformal P10–P90 calibrated on the validation window."}
        </div>
      </div>
    </Panel>
  );
}
