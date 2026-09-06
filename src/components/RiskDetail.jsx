import { Panel } from "./Panel.jsx";
import { AnimatedNumber } from "./AnimatedNumber.jsx";
import {
  FONT_DISPLAY,
  FONT_HEADER,
  FONT_BODY,
  FONT_MONO,
  C,
  stateColor,
  stateGlow,
  statusFromScore,
  hexFromChannel,
  colorWithAlpha,
} from "../config/tokens.js";
import { ZONE_CHANNEL_COLOR, ZONE_LABELS } from "../config/zones.js";

export function RiskDetail({ risk, shedSchedule, selectedZone }) {
  const riskStatus = risk ? statusFromScore(risk.risk_score) : "normal";
  const statusColor = stateColor(riskStatus);
  const statusGlow = stateGlow(riskStatus);
  const channelHex = hexFromChannel(ZONE_CHANNEL_COLOR[selectedZone]);
  const zoneLabel = ZONE_LABELS[selectedZone];

  return (
    <Panel
      index="03"
      title={`Zone Inspector — ${selectedZone.replace("_", "-")}`}
      accent={statusColor}
      className="h-full"
    >
      {risk ? (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
          {/* Big risk score */}
          <div
            className="rounded-xl p-4 border"
            style={{
              background: `linear-gradient(135deg, ${colorWithAlpha(statusColor, 0.07)} 0%, hsl(216 28% 11% / 0.6) 100%)`,
              borderColor: colorWithAlpha(statusColor, 0.22),
              boxShadow: `inset 0 1px 0 ${colorWithAlpha(statusColor, 0.09)}, 0 8px 24px ${colorWithAlpha(statusColor, 0.08)}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] tracking-[0.16em] uppercase text-txt-faint font-mono"
                style={{ fontFamily: FONT_MONO }}
              >
                Overload Risk
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded border font-mono uppercase tracking-wider"
                style={{
                  fontFamily: FONT_MONO,
                  color: statusColor,
                  borderColor: colorWithAlpha(statusColor, 0.35),
                  background: colorWithAlpha(statusColor, 0.08),
                }}
              >
                {riskStatus}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="tabular text-[52px] sm:text-[58px] font-bold leading-[0.9]"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: statusColor,
                  textShadow: `0 0 28px ${colorWithAlpha(statusGlow, 0.35)}`,
                }}
              >
                <AnimatedNumber value={risk.risk_score * 100} />
              </span>
              <span
                className="text-[18px] text-txt-faint font-display"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                %
              </span>
            </div>
            <div
              className="text-[10px] text-txt-muted mt-1"
              style={{ fontFamily: FONT_BODY }}
            >
              {zoneLabel}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBox
              label="Predicted Load"
              value={`${risk.predicted_load_mw.toFixed(0)}`}
              unit="MW"
              accent={C.cyan}
            />
            <MetricBox
              label="Capacity"
              value={`${risk.capacity_mw.toFixed(0)}`}
              unit="MW"
              accent={C.violet}
              flag={risk.is_proxy_capacity ? "PROXY" : null}
            />
          </div>

          {/* Factors */}
          <div>
            <div
              className="text-[9px] text-txt-faint tracking-[0.16em] uppercase mb-2.5 font-mono"
              style={{ fontFamily: FONT_MONO }}
            >
              Top Contributing Factors
            </div>
            <div className="flex flex-col gap-2.5">
              {risk.top_factors.map((f) => (
                <div key={f.feature} className="min-w-0">
                  <div
                    className="flex min-w-0 justify-between gap-2 text-[10.5px] text-txt-dim mb-1 font-mono"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{f.feature}</span>
                    <span className="tabular shrink-0">
                      {f.contribution > 0 ? "+" : ""}
                      {f.contribution.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-[4px] bg-line/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.abs(f.contribution) * 220, 100)}%`,
                        background:
                          f.contribution > 0
                            ? `linear-gradient(90deg, ${colorWithAlpha(C.critical, 0.5)}, ${C.critical})`
                            : `linear-gradient(90deg, ${colorWithAlpha(C.safe, 0.5)}, ${C.safe})`,
                        boxShadow: f.contribution > 0 ? `0 0 8px ${colorWithAlpha(C.criticalGlow, 0.35)}` : `0 0 8px ${colorWithAlpha(C.safeGlow, 0.35)}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shed schedule */}
          {shedSchedule.length > 0 && (
            <div>
              <div
                className="text-[9px] text-txt-faint tracking-[0.16em] uppercase mb-2.5 font-mono"
                style={{ fontFamily: FONT_MONO }}
              >
                Recommended Shed Schedule
              </div>
              <div className="flex flex-col gap-2">
                {shedSchedule.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 transition-all duration-200"
                    style={{
                      background:
                        s.priority === 1
                          ? `linear-gradient(135deg, ${colorWithAlpha(C.critical, 0.06)} 0%, hsl(216 28% 11% / 0.7) 100%)`
                          : "hsl(216 28% 11% / 0.6)",
                      border: `1px solid ${s.priority === 1 ? colorWithAlpha(C.critical, 0.28) : colorWithAlpha(C.line, 0.4)}`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <span
                        className="font-semibold text-[12px] text-txt"
                        style={{ fontFamily: FONT_HEADER }}
                      >
                        {s.asset_id}
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-px rounded font-mono"
                        style={{
                          fontFamily: FONT_MONO,
                          color: s.priority === 1 ? C.critical : C.caution,
                          border: `1px solid ${colorWithAlpha(s.priority === 1 ? C.critical : C.caution, 0.35)}`,
                          background: colorWithAlpha(s.priority === 1 ? C.critical : C.caution, 0.08),
                        }}
                      >
                        PRIORITY {s.priority}
                      </span>
                    </div>
                    <div
                      className="text-[10.5px] text-txt-dim leading-relaxed"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {s.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shedSchedule.length === 0 && (
            <div
              className="text-[10.5px] text-safe font-mono"
              style={{ fontFamily: FONT_MONO }}
            >
              No shed actions recommended — margin healthy or critical
              infrastructure excluded.
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-line/40">
            <div
              className="text-[10px] text-txt-faint leading-relaxed"
              style={{ fontFamily: FONT_BODY }}
            >
              Decision-support output only. No automated action is taken — human
              review required before any operational change.
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-txt-faint text-xs font-mono">
          LOADING ZONE DATA…
        </div>
      )}
    </Panel>
  );
}

function MetricBox({ label, value, unit, accent, flag }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{
        background: colorWithAlpha(accent, 0.05),
        borderColor: colorWithAlpha(accent, 0.18),
      }}
    >
      <div
        className="text-[9px] text-txt-faint tracking-[0.14em] uppercase mb-1 font-mono"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="tabular text-[20px] font-bold"
          style={{ fontFamily: FONT_DISPLAY, color: accent }}
        >
          {value}
        </span>
        <span
          className="text-[10px] text-txt-faint font-mono"
          style={{ fontFamily: FONT_MONO }}
        >
          {unit}
        </span>
      </div>
      {flag && (
        <span
          className="text-[8px] text-gold font-bold tracking-wider font-mono"
          style={{ fontFamily: FONT_MONO }}
        >
          · {flag}
        </span>
      )}
    </div>
  );
}
