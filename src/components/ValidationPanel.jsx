import { Panel } from "./Panel.jsx";
import {
  FONT_BODY,
  FONT_DISPLAY,
  FONT_HEADER,
  FONT_MONO,
  C,
  colorWithAlpha,
} from "../config/tokens.js";

const RESULT_COLOR = { PASS: C.safe, WARN: C.caution, FAIL: C.critical };

const pct = (v, digits = 1) => (v == null ? "—" : `${(v * 100).toFixed(digits)}%`);
const num = (v, digits = 2) => (v == null ? "—" : v.toFixed(digits));

function age(hours) {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min ago`;
  if (hours < 48) return `${hours.toFixed(1)} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function Metric({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-lg p-2.5 border min-w-0"
      style={{
        background: colorWithAlpha(accent, 0.05),
        borderColor: colorWithAlpha(accent, 0.18),
      }}
    >
      <div
        className="text-[8.5px] text-txt-faint tracking-[0.14em] uppercase mb-1 font-mono truncate"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </div>
      <div
        className="tabular text-[17px] font-bold leading-none"
        style={{ fontFamily: FONT_DISPLAY, color: accent }}
      >
        {value}
      </div>
      <div
        className="text-[9px] text-txt-muted mt-1 leading-snug"
        style={{ fontFamily: FONT_BODY }}
      >
        {sub}
      </div>
    </div>
  );
}

function GateRow({ gate }) {
  const color = RESULT_COLOR[gate.result] || C.textFaint;
  const target = Array.isArray(gate.target)
    ? `${gate.target[0]}–${gate.target[1]}`
    : gate.target;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-line/25 last:border-0">
      <span
        className="text-[8px] font-bold px-1.5 py-px rounded shrink-0 font-mono mt-0.5"
        style={{
          fontFamily: FONT_MONO,
          color,
          background: colorWithAlpha(color, 0.1),
          border: `1px solid ${colorWithAlpha(color, 0.3)}`,
        }}
      >
        {gate.result}
      </span>
      <span
        className="text-[9.5px] text-txt-dim leading-snug min-w-0"
        style={{ fontFamily: FONT_BODY }}
      >
        {gate.label}
        <span className="text-txt-faint">
          {" "}
          — {gate.value == null ? "no value" : num(gate.value, 3)} (target {target})
        </span>
      </span>
    </div>
  );
}

export function ValidationPanel({ validation }) {
  const { state, report } = validation;

  if (state === "loading") {
    return (
      <Panel index="05" title="Closed-Loop Validation" accent={C.cyan} className="h-full">
        <div className="h-full flex items-center justify-center text-txt-faint text-[10px] font-mono">
          LOADING VALIDATION REPORT…
        </div>
      </Panel>
    );
  }

  if (state !== "ok") {
    return (
      <Panel index="05" title="Closed-Loop Validation" accent={C.caution} className="h-full">
        <div
          className="text-[10.5px] text-txt-dim leading-relaxed"
          style={{ fontFamily: FONT_BODY }}
        >
          {state === "missing"
            ? "This backend build does not expose /validation, so no release-gate evidence is available from it. The live numbers below are served by the models but are not independently gated."
            : "The validation report could not be read from this backend. Live numbers are served, but treat them as ungated until /validation responds."}
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

  return (
    <Panel index="05" title="Closed-Loop Validation" accent={overallColor} className="h-full">
      <div className="flex flex-col gap-3 h-full overflow-y-auto">
        <div
          className="rounded-lg p-2.5 border"
          style={{
            background: colorWithAlpha(overallColor, 0.06),
            borderColor: colorWithAlpha(overallColor, 0.25),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[13px] font-bold tracking-[0.1em] uppercase"
              style={{ fontFamily: FONT_HEADER, color: overallColor }}
            >
              {report.overall === "PASS"
                ? "Loop validated"
                : report.overall === "WARN"
                  ? "Passed with warnings"
                  : "Gate failure"}
            </span>
            <span
              className="text-[9px] font-mono tabular shrink-0"
              style={{ fontFamily: FONT_MONO, color: overallColor }}
            >
              {counts.PASS || 0}/{report.gates.length} GATES
            </span>
          </div>
          <div
            className="text-[9.5px] text-txt-muted mt-1 leading-snug"
            style={{ fontFamily: FONT_BODY }}
          >
            {w.rows_scored?.toLocaleString()} held-out hours replayed through the live
            serving path · {m.events.n_events} real overload events · report generated{" "}
            {age(report.staleness_hours)}
            {counts.WARN ? ` · ${counts.WARN} warning` : ""}
            {counts.FAIL ? ` · ${counts.FAIL} failing` : ""}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Alarm precision"
            value={pct(m.alarm.precision)}
            sub={`of hours it would have shed, share truly overloaded (≥${m.alarm.threshold})`}
            accent={C.cyan}
          />
          <Metric
            label="Alarm recall"
            value={pct(m.alarm.recall)}
            sub={`of all ${m.alarm.positive_rate ? pct(m.alarm.positive_rate, 1) : "—"} overload hours caught`}
            accent={C.violet}
          />
          <Metric
            label="False alarms"
            value={num(m.alarm.false_alarms_per_zone_day, 2)}
            sub="per zone-day — the operator-burden number"
            accent={C.safe}
          />
          <Metric
            label="Warning lead"
            value={`${num(m.events.median_lead_hours_stable, 1)} h`}
            sub={`median unbroken lead · ${pct(m.events.share_warned_3h, 0)} of events warned ≥3 h`}
            accent={C.gold}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className="flex justify-between text-[10px] font-mono"
            style={{ fontFamily: FONT_MONO }}
          >
            <span className="text-txt-faint">P10–P90 coverage (nominal 80%)</span>
            <span className="tabular text-txt-dim">{pct(m.forecast.coverage_p10_p90_overall)}</span>
          </div>
          <div
            className="flex justify-between text-[10px] font-mono"
            style={{ fontFamily: FONT_MONO }}
          >
            <span className="text-txt-faint">h+24 MAPE vs seasonal-naive</span>
            <span className="tabular text-txt-dim">
              {h24
                ? `${h24.mape_recursive.toFixed(2)}% vs ${h24.mape_seasonal_naive.toFixed(2)}%`
                : "—"}
            </span>
          </div>
          <div
            className="flex justify-between text-[10px] font-mono"
            style={{ fontFamily: FONT_MONO }}
          >
            <span className="text-txt-faint">Events alarmed while running</span>
            <span className="tabular text-txt-dim">
              {m.events.n_detected}/{m.events.n_events}
            </span>
          </div>
        </div>

        <details className="text-[10px]">
          <summary
            className="cursor-pointer text-txt-faint tracking-[0.14em] uppercase font-mono text-[9px]"
            style={{ fontFamily: FONT_MONO }}
          >
            All {report.gates.length} release gates
          </summary>
          <div className="mt-1.5">
            {report.gates.map((g) => (
              <GateRow key={g.id} gate={g} />
            ))}
          </div>
        </details>

        <details className="text-[10px]">
          <summary
            className="cursor-pointer text-gold/80 tracking-[0.14em] uppercase font-mono text-[9px]"
            style={{ fontFamily: FONT_MONO }}
          >
            Stated limitations ({report.limitations.length})
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1.5 list-none">
            {report.limitations.map((l, i) => (
              <li
                key={i}
                className="text-[9.5px] text-txt-muted leading-snug pl-2 border-l border-line/50"
                style={{ fontFamily: FONT_BODY }}
              >
                {l}
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-auto pt-2 border-t border-line/40">
          <div
            className="text-[9px] text-txt-faint leading-relaxed font-mono"
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
