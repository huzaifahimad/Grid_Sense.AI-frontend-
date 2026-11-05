import { Panel } from "./Panel.jsx";
import { AnimatedNumber } from "./AnimatedNumber.jsx";
import { Icon } from "./Icon.jsx";
import {
  FONT_DISPLAY,
  FONT_HEADER,
  FONT_BODY,
  FONT_MONO,
  C,
  stateColor,
  stateGlow,
  statusFromScore,
  colorWithAlpha,
} from "../config/tokens.js";
import { ZONE_LABELS } from "../config/zones.js";

// Mirrors RISK_BUCKETS in models/risk_classifier.py. Display-only label for the
// band whose averaged SHAP factors are shown below; the numbers themselves come
// from the API, never recomputed here.
const RISK_BANDS = [
  { label: "low", lo: 0.0, hi: 0.3 },
  { label: "moderate", lo: 0.3, hi: 0.6 },
  { label: "elevated", lo: 0.6, hi: 0.8 },
  { label: "critical", lo: 0.8, hi: 1.01 },
];

function bandForScore(score) {
  const band = RISK_BANDS.find((b) => score >= b.lo && score < b.hi);
  return band ? band.label : null;
}

function SectionLabel({ children, count }) {
  return (
    <h3
      className="flex items-baseline gap-2 text-2xs tracking-label uppercase text-txt-muted mb-2.5"
      style={{ fontFamily: FONT_MONO, fontWeight: 500 }}
    >
      <span className="min-w-0">{children}</span>
      {count != null && <span className="tabular text-txt-faint ml-auto">{count}</span>}
    </h3>
  );
}

export function RiskDetail({ risk, shedSchedule, selectedZone, delay = 0 }) {
  const riskStatus = risk ? statusFromScore(risk.risk_score) : "normal";
  const statusColor = stateColor(riskStatus);
  const statusGlow = stateGlow(riskStatus);
  const zoneLabel = ZONE_LABELS[selectedZone];
  const factors = risk?.top_factors ?? [];
  const band = risk ? bandForScore(risk.risk_score) : null;
  // /risk scores one historical row; /forecast starts from the latest row. Stating
  // the scored hour keeps those two panels from looking like they disagree.
  const snapshotLabel = risk?.snapshot_timestamp
    ? `${risk.snapshot_timestamp.slice(0, 16).replace("T", " ")}Z`
    : null;
  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.contribution)), 0.0001);

  return (
    <Panel
      index="03"
      title={`Zone Inspector — ${selectedZone.replace("_", "-")}`}
      accent={statusColor}
      delay={delay}
      meta={
        snapshotLabel && (
          <span className="flex items-center gap-1.5 tabular">
            <Icon name="clock" size={12} />
            {snapshotLabel}
          </span>
        )
      }
      className="h-full"
    >
      {risk ? (
        <div className="flex flex-col gap-4 h-full max-lg:h-auto lg:overflow-y-auto">
          {/* Headline risk gauge */}
          <div
            className="rounded-panel p-4 border"
            style={{
              background: `linear-gradient(135deg, ${colorWithAlpha(statusColor, 0.07)} 0%, hsl(216 28% 11% / 0.6) 100%)`,
              borderColor: colorWithAlpha(statusColor, 0.22),
              boxShadow: `inset 0 1px 0 ${colorWithAlpha(statusColor, 0.09)}, 0 8px 24px ${colorWithAlpha(statusColor, 0.08)}`,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-2xs tracking-label uppercase text-txt-muted"
                style={{ fontFamily: FONT_MONO }}
              >
                Overload Risk
              </span>
              <span
                className="flex items-center gap-1.5 text-2xs font-bold px-2 py-0.5 rounded-control border uppercase tracking-label"
                style={{
                  fontFamily: FONT_MONO,
                  color: statusColor,
                  borderColor: colorWithAlpha(statusColor, 0.35),
                  background: colorWithAlpha(statusColor, 0.08),
                }}
              >
                <Icon
                  name={riskStatus === "critical" ? "bolt" : riskStatus === "elevated" ? "alert" : "shield"}
                  size={12}
                  strokeWidth={1.9}
                />
                {riskStatus}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={risk.risk_score * 100}
                announce={false}
                className="text-gauge font-bold"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: statusColor,
                  textShadow: `0 0 28px ${colorWithAlpha(statusGlow, 0.35)}`,
                }}
              />
              <span
                className="text-lg text-txt-muted"
                style={{ fontFamily: FONT_DISPLAY }}
                aria-hidden="true"
              >
                %
              </span>
              <span className="sr-only">
                {zoneLabel} overload risk {(risk.risk_score * 100).toFixed(0)} percent,{" "}
                {riskStatus}.
              </span>
            </div>
            <div
              className="text-xs text-txt-muted mt-1"
              style={{ fontFamily: FONT_BODY }}
            >
              {zoneLabel}
              {snapshotLabel ? ` · scored on ${snapshotLabel}` : ""}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBox
              label="Load at Snapshot"
              value={
                Number.isFinite(risk.snapshot_load_mw) ? risk.snapshot_load_mw.toFixed(0) : "—"
              }
              unit="MW"
              accent={C.cyan}
              icon="activity"
            />
            <MetricBox
              label="Capacity"
              value={Number.isFinite(risk.capacity_mw) ? risk.capacity_mw.toFixed(0) : "—"}
              unit="MW"
              accent={C.violet}
              icon="database"
              flag={risk.is_proxy_capacity ? "PROXY" : null}
            />
          </div>

          {/* Attribution */}
          {factors.length > 0 && (
            <div>
              <SectionLabel count={`${factors.length}`}>Top Contributing Factors</SectionLabel>
              <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
                {factors.map((f) => (
                  <li key={f.feature} className="min-w-0">
                    <div
                      className="flex min-w-0 justify-between gap-2 text-xs text-txt-dim mb-1.5"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {f.feature}
                      </span>
                      <span className="tabular shrink-0 flex items-center gap-1" style={{ color: f.contribution > 0 ? C.critical : C.safe }}>
                        <Icon
                          name={f.contribution > 0 ? "arrowUp" : "arrowRight"}
                          size={11}
                          strokeWidth={2}
                        />
                        {f.contribution > 0 ? "+" : ""}
                        {f.contribution.toFixed(2)}
                      </span>
                    </div>
                    {/* Rail scales with transform, never width, so the layout
                        does not reflow while the bars animate in. */}
                    <div
                      className="h-[3px] bg-line/60 rounded-pill overflow-hidden"
                      role="img"
                      aria-label={`${f.feature}: mean SHAP contribution ${f.contribution.toFixed(2)} for the ${band ?? "current"} risk band`}
                    >
                      <div
                        className="h-full rounded-pill origin-left transition-transform duration-500 ease-out"
                        style={{
                          transform: `scaleX(${Math.min(Math.abs(f.contribution) / maxAbs, 1) * 0.92 + 0.08})`,
                          background:
                            f.contribution > 0
                              ? `linear-gradient(90deg, ${colorWithAlpha(C.critical, 0.5)}, ${C.critical})`
                              : `linear-gradient(90deg, ${colorWithAlpha(C.safe, 0.5)}, ${C.safe})`,
                          boxShadow:
                            f.contribution > 0
                              ? `0 0 8px ${colorWithAlpha(C.criticalGlow, 0.35)}`
                              : `0 0 8px ${colorWithAlpha(C.safeGlow, 0.35)}`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p
                className="text-2xs text-txt-faint leading-relaxed mt-2.5 mb-0"
                style={{ fontFamily: FONT_BODY }}
              >
                Band-level mean SHAP values{band ? ` for the “${band}” risk band` : ""} —
                the same reference values apply to every asset scored in that band, so they
                are context for the score, not a per-feeder attribution.
              </p>
            </div>
          )}

          {/* Shed schedule */}
          {shedSchedule.length > 0 && (
            <div>
              <SectionLabel count={`${shedSchedule.length}`}>
                Recommended Shed Schedule
              </SectionLabel>
              <ul className="flex flex-col gap-2 list-none m-0 p-0">
                {shedSchedule.map((s, i) => (
                  <ShedRow key={`${s.asset_id}-${i}`} shed={s} index={i} />
                ))}
              </ul>
            </div>
          )}

          {shedSchedule.length === 0 && (
            <div
              className="flex items-start gap-2 text-xs text-safe"
              style={{ fontFamily: FONT_MONO }}
            >
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                <Icon name="check" size={14} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                No shed actions recommended — margin healthy or critical infrastructure
                excluded.
              </span>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-line/40">
            <div
              className="flex items-start gap-2 text-2xs text-txt-muted leading-relaxed"
              style={{ fontFamily: FONT_BODY }}
            >
              <span className="mt-0.5 shrink-0 text-txt-muted" aria-hidden="true">
                <Icon name="info" size={13} />
              </span>
              <span className="min-w-0">
                Decision-support output only. No automated action is taken — human review
                required before any operational change.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="h-full flex items-center justify-center text-txt-muted text-xs tracking-label"
          style={{ fontFamily: FONT_MONO }}
        >
          LOADING ZONE DATA…
        </div>
      )}
    </Panel>
  );
}

function ShedRow({ shed, index }) {
  const isP1 = shed.priority === 1;
  const tone = isP1 ? C.critical : C.caution;
  return (
    <li
      className="rounded-panel p-3 pressable"
      style={{
        background: isP1
          ? `linear-gradient(135deg, ${colorWithAlpha(C.critical, 0.06)} 0%, hsl(216 28% 11% / 0.7) 100%)`
          : "hsl(216 28% 11% / 0.6)",
        border: `1px solid ${isP1 ? colorWithAlpha(C.critical, 0.28) : colorWithAlpha(C.line, 0.4)}`,
        backdropFilter: "blur(8px)",
        animationName: "fade-in",
        animationDuration: "220ms",
        animationDelay: `${index * 40}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="font-semibold text-sm text-txt min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ fontFamily: FONT_HEADER }}
        >
          {shed.asset_id}
        </span>
        <span
          className="flex items-center gap-1.5 shrink-0 text-2xs font-bold px-1.5 py-px rounded-control"
          style={{
            fontFamily: FONT_MONO,
            color: tone,
            border: `1px solid ${colorWithAlpha(tone, 0.35)}`,
            background: colorWithAlpha(tone, 0.08),
          }}
        >
          <Icon name={isP1 ? "bolt" : "alert"} size={11} strokeWidth={2} />
          PRIORITY {shed.priority}
        </span>
      </div>
      <div
        className="text-xs text-txt-dim leading-relaxed"
        style={{ fontFamily: FONT_BODY }}
      >
        {shed.reasoning}
      </div>
    </li>
  );
}

function MetricBox({ label, value, unit, accent, flag, icon }) {
  return (
    <div
      className="rounded-panel p-3 border min-w-0"
      style={{
        background: colorWithAlpha(accent, 0.05),
        borderColor: colorWithAlpha(accent, 0.18),
      }}
    >
      <div
        className="flex items-start gap-1.5 text-2xs tracking-label uppercase text-txt-muted mb-1.5 min-w-0"
        style={{ fontFamily: FONT_MONO }}
      >
        <span style={{ color: accent }} aria-hidden="true" className="mt-px shrink-0">
          <Icon name={icon} size={12} />
        </span>
        <span className="min-w-0 leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="tabular text-xl font-bold"
          style={{ fontFamily: FONT_DISPLAY, color: accent }}
        >
          {value}
        </span>
        <span
          className="text-2xs text-txt-muted"
          style={{ fontFamily: FONT_MONO }}
        >
          {unit}
        </span>
      </div>
      {flag && (
        <span
          className="flex items-center gap-1 text-2xs text-gold mt-1"
          style={{ fontFamily: FONT_MONO }}
        >
          <Icon name="info" size={11} />
          {flag} capacity
        </span>
      )}
    </div>
  );
}
