import { Panel } from "./Panel.jsx";
import { Icon } from "./Icon.jsx";
import {
  FONT_BODY,
  FONT_DISPLAY,
  FONT_HEADER,
  FONT_MONO,
  C,
  STAGGER_MS,
  colorWithAlpha,
} from "../config/tokens.js";

const RESULT_COLOR = { PASS: C.safe, WARN: C.caution, FAIL: C.critical };
const RESULT_ICON = { PASS: "check", WARN: "alert", FAIL: "bolt" };

const pct = (v, digits = 1) => (v == null ? "—" : `${(v * 100).toFixed(digits)}%`);
const num = (v, digits = 2) => (v == null ? "—" : v.toFixed(digits));

function age(hours) {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min ago`;
  if (hours < 48) return `${hours.toFixed(1)} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function SectionLabel({ icon, children }) {
  return (
    <h3
      className="flex items-center gap-1.5 text-2xs tracking-label uppercase text-txt-muted mb-2"
      style={{ fontFamily: FONT_MONO, fontWeight: 500 }}
    >
      <span className="text-txt-faint" aria-hidden="true">
        <Icon name={icon} size={12} />
      </span>
      {children}
    </h3>
  );
}

function Metric({ label, value, sub, accent, delay = 0 }) {
  return (
    <div
      className="rounded-panel p-2.5 border min-w-0"
      style={{
        background: colorWithAlpha(accent, 0.05),
        borderColor: colorWithAlpha(accent, 0.18),
        animationName: "fade-in",
        animationDuration: "220ms",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        className="text-2xs text-txt-muted tracking-label uppercase mb-1 leading-snug"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </div>
      <div
        className="tabular text-xl font-bold leading-none"
        style={{ fontFamily: FONT_DISPLAY, color: accent }}
      >
        {value}
      </div>
      <div
        className="text-2xs text-txt-muted mt-1.5 leading-snug"
        style={{ fontFamily: FONT_BODY }}
      >
        {sub}
      </div>
    </div>
  );
}

function StatLine({ label, value, accent }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-txt-muted min-w-0" style={{ fontFamily: FONT_MONO }}>
        {label}
      </span>
      <span
        className="tabular shrink-0"
        style={{ fontFamily: FONT_MONO, color: accent || "var(--color-txt-dim)" }}
      >
        {value}
      </span>
    </div>
  );
}

function GateRow({ gate, index }) {
  const color = RESULT_COLOR[gate.result] || C.textFaint;
  const target = Array.isArray(gate.target) ? `${gate.target[0]}–${gate.target[1]}` : gate.target;
  return (
    <li
      className="flex items-start gap-2 py-1.5 border-b border-line/25 last:border-0"
      style={{
        animationName: "fade-in",
        animationDuration: "220ms",
        animationDelay: `${index * 30}ms`,
        animationFillMode: "both",
      }}
    >
      <span
        className="flex items-center gap-1 text-2xs font-bold px-1.5 py-px rounded-control shrink-0 mt-0.5"
        style={{
          fontFamily: FONT_MONO,
          color,
          background: colorWithAlpha(color, 0.1),
          border: `1px solid ${colorWithAlpha(color, 0.3)}`,
        }}
      >
        <Icon name={RESULT_ICON[gate.result] || "info"} size={10} strokeWidth={2} />
        {gate.result}
      </span>
      <span
        className="text-2xs text-txt-dim leading-snug min-w-0"
        style={{ fontFamily: FONT_BODY }}
      >
        {gate.label}
        <span className="text-txt-faint">
          {" "}
          — {gate.value == null ? "no value" : num(gate.value, 3)} (target {target})
        </span>
      </span>
    </li>
  );
}

const GATE_ALPHA = { PASS: 0.42, WARN: 0.85, FAIL: 1 };

/** One cell per gate, in report order. A proportional hairline summarising the
    same counts measured 3px tall on screen and read as a missing graph; the
    cells also show which gates are short, not just how many. */
function GateMap({ gates }) {
  const count = (k) => gates.filter((g) => g.result === k).length;
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`${count("PASS")} passing, ${count("WARN")} warning, ${count(
        "FAIL"
      )} failing of ${gates.length} release gates`}
    >
      {gates.map((g) => {
        const color = RESULT_COLOR[g.result] || C.textFaint;
        return (
          <span
            key={g.id}
            title={`${g.label} — ${g.result}`}
            className="h-2 flex-1 min-w-0 rounded-pill transition-opacity duration-300 ease-out"
            style={{
              background: color,
              opacity: GATE_ALPHA[g.result] ?? 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

export function ValidationPanel({ validation, delay = 0, index = "05" }) {
  const { state, report } = validation;

  if (state === "loading") {
    return (
      <Panel index={index} title="Closed-Loop Validation" accent={C.cyan} delay={delay} className="h-full">
        <div
          role="status"
          className="h-full flex items-center justify-center gap-2 text-txt-muted text-2xs tracking-label"
          style={{ fontFamily: FONT_MONO }}
        >
          <Icon name="refresh" size={13} className="animate-spin" />
          LOADING VALIDATION REPORT…
        </div>
      </Panel>
    );
  }

  if (state !== "ok") {
    return (
      <Panel index={index} title="Closed-Loop Validation" accent={C.caution} delay={delay} className="h-full">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0" style={{ color: C.caution }} aria-hidden="true">
            <Icon name="alert" size={14} />
          </span>
          <div
            className="text-xs text-txt-dim leading-relaxed min-w-0"
            style={{ fontFamily: FONT_BODY }}
          >
            {state === "missing"
              ? "This backend build does not expose /validation, so no release-gate evidence is available from it. The live numbers below are served by the models but are not independently gated."
              : "The validation report could not be read from this backend. Live numbers are served, but treat them as ungated until /validation responds."}
          </div>
        </div>
      </Panel>
    );
  }

  const m = report.metrics;
  const w = report.window;
  const counts = report.gates.reduce(
    (acc, g) => ({ ...acc, [g.result]: (acc[g.result] || 0) + 1 }),
    {}
  );
  const overallColor = RESULT_COLOR[report.overall] || C.textFaint;
  const h24 = m.forecast.per_step?.["24"];
  const headline =
    report.overall === "PASS"
      ? "Loop validated"
      : report.overall === "WARN"
        ? "Passed with warnings"
        : "Gate failure";
  const overallIcon = report.overall === "PASS" ? "shield" : report.overall === "WARN" ? "alert" : "bolt";
  // Coverage against the nominal 80% band the forecaster is calibrated to.
  const coverage = m.forecast.coverage_p10_p90_overall;

  return (
    <Panel index={index} title="Closed-Loop Validation" accent={overallColor} delay={delay} className="h-full">
      <div className="flex flex-col gap-3 h-full max-lg:h-auto">
        <div
          className="rounded-panel p-3 border"
          style={{
            background: colorWithAlpha(overallColor, 0.06),
            borderColor: colorWithAlpha(overallColor, 0.25),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="flex items-center gap-2 text-sm font-bold tracking-label uppercase min-w-0"
              style={{ fontFamily: FONT_HEADER, color: overallColor }}
            >
              <Icon name={overallIcon} size={15} strokeWidth={1.9} />
              <span className="min-w-0 truncate">{headline}</span>
            </span>
            <span
              className="tabular text-2xs shrink-0"
              style={{ fontFamily: FONT_MONO, color: overallColor }}
            >
              {counts.PASS || 0}/{report.gates.length} GATES
            </span>
          </div>
          <div className="mt-2">
            <GateMap gates={report.gates} />
          </div>
          <div
            className="text-2xs text-txt-muted mt-2 leading-snug"
            style={{ fontFamily: FONT_BODY }}
          >
            {w.rows_scored?.toLocaleString()} held-out hours replayed through the live
            serving path · {m.events.n_events} real overload events · report generated{" "}
            {age(report.staleness_hours)}
            {counts.WARN ? ` · ${counts.WARN} warning` : ""}
            {counts.FAIL ? ` · ${counts.FAIL} failing` : ""}
          </div>
        </div>

        <div>
          <SectionLabel icon="target">Headline gates</SectionLabel>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            <Metric
              label="Alarm precision"
              value={pct(m.alarm.precision)}
              sub={`of hours it would have shed, share truly overloaded (≥${m.alarm.threshold})`}
              accent={C.cyan}
              delay={0}
            />
            <Metric
              label="Alarm recall"
              value={pct(m.alarm.recall)}
              sub={`of all ${m.alarm.positive_rate ? pct(m.alarm.positive_rate, 1) : "—"} overload hours caught`}
              accent={C.violet}
              delay={STAGGER_MS}
            />
            <Metric
              label="False alarms"
              value={num(m.alarm.false_alarms_per_zone_day, 2)}
              sub="per zone-day — the operator-burden number"
              accent={C.safe}
              delay={STAGGER_MS * 2}
            />
            <Metric
              label="Warning lead"
              value={`${num(m.events.median_lead_hours_stable, 1)} h`}
              sub={`median unbroken lead · ${pct(m.events.share_warned_3h, 0)} of events warned ≥3 h`}
              accent={C.gold}
              delay={STAGGER_MS * 3}
            />
          </div>
        </div>

        <div>
          <SectionLabel icon="layers">Forecast quality</SectionLabel>
          <div className="grid gap-x-4 gap-y-1.5 xl:grid-cols-3">
            <StatLine
              label="P10–P90 coverage (nominal 80%)"
              value={pct(coverage)}
              accent={
                coverage == null
                  ? null
                  : Math.abs(coverage - 0.8) <= 0.05
                    ? C.safe
                    : C.caution
              }
            />
            <StatLine
              label="h+24 MAPE vs seasonal-naive"
              value={
                h24
                  ? `${h24.mape_recursive.toFixed(2)}% vs ${h24.mape_seasonal_naive.toFixed(2)}%`
                  : "—"
              }
            />
            <StatLine
              label="Events alarmed while running"
              value={`${m.events.n_detected}/${m.events.n_events}`}
            />
          </div>
        </div>

        <div className="grid gap-x-4 xl:grid-cols-2">
        <details className="text-xs group">
          <summary
            className="flex items-center gap-1.5 cursor-pointer text-txt-muted tracking-label uppercase text-2xs list-none [&::-webkit-details-marker]:hidden py-1"
            style={{ fontFamily: FONT_MONO }}
          >
            <span className="transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
              <Icon name="chevron" size={12} strokeWidth={2} />
            </span>
            All {report.gates.length} release gates
          </summary>
          <ul className="mt-1 list-none m-0 p-0">
            {report.gates.map((g, i) => (
              <GateRow key={g.id} gate={g} index={i} />
            ))}
          </ul>
        </details>

        <details className="text-xs group">
          <summary
            className="flex items-center gap-1.5 cursor-pointer tracking-label uppercase text-2xs list-none [&::-webkit-details-marker]:hidden py-1"
            style={{ fontFamily: FONT_MONO, color: "var(--color-txt-muted)" }}
          >
            <span className="transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
              <Icon name="chevron" size={12} strokeWidth={2} />
            </span>
            Stated limitations ({report.limitations.length})
          </summary>
          <ul className="mt-1.5 flex flex-col gap-2 list-none m-0 p-0">
            {report.limitations.map((l, i) => (
              <li
                key={i}
                className="text-2xs text-txt-muted leading-snug pl-2 border-l border-line/50"
                style={{ fontFamily: FONT_BODY }}
              >
                {l}
              </li>
            ))}
          </ul>
        </details>
        </div>

        <div className="mt-auto pt-2 border-t border-line/40">
          <div
            className="text-2xs text-txt-faint leading-relaxed"
            style={{ fontFamily: FONT_MONO }}
          >
            REPLAY OF TEST WINDOW · WEATHER=PERSISTENCE · CAPACITY=PROXY ·{" "}
            {w.hours?.toLocaleString()} H · {w.zones?.join(" ")}
          </div>
        </div>
      </div>
    </Panel>
  );
}
