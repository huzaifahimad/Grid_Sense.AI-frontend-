import { Panel } from "./Panel.jsx";
import { AnimatedNumber } from "./AnimatedNumber.jsx";
import {
  FONT_HERO,
  FONT_HEADER,
  FONT_BODY,
  FONT_MONO,
  C,
  stateColor,
} from "../config/tokens.js";

export function RiskDetail({ risk, shedSchedule, selectedZone }) {
  const riskStatus = risk
    ? risk.risk_score >= 0.8
      ? "critical"
      : risk.risk_score >= 0.6
        ? "elevated"
        : "normal"
    : "normal";

  return (
    <Panel
      index="03"
      title={`Risk Detail — ${selectedZone}`}
      accent={stateColor(riskStatus)}
      style={{ height: "100%" }}
    >
      {risk ? (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
          <div>
            <div
              className="tabular text-[44px] font-extrabold leading-[0.95]"
              style={{ fontFamily: FONT_HERO, color: stateColor(riskStatus) }}
            >
              <AnimatedNumber value={risk.risk_score * 100} />
              <span className="text-[20px] text-txt-faint">%</span>
            </div>
            <div
              className="text-[10px] text-txt-faint tracking-widest mt-1"
              style={{ fontFamily: FONT_MONO }}
            >
              OVERLOAD RISK SCORE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1 border-t border-line/50">
            <div className="pt-3">
              <div
                className="tabular text-[17px] font-bold text-cyan"
                style={{ fontFamily: FONT_MONO }}
              >
                {risk.predicted_load_mw.toFixed(0)}
              </div>
              <div className="text-[10px] text-txt-faint mt-0.5">
                PREDICTED LOAD (MW)
              </div>
            </div>
            <div className="pt-3">
              <div
                className="tabular text-[17px] font-bold text-violet"
                style={{ fontFamily: FONT_MONO }}
              >
                {risk.capacity_mw.toFixed(0)}
              </div>
              <div className="text-[10px] text-txt-faint mt-0.5">
                CAPACITY (MW){" "}
                {risk.is_proxy_capacity && (
                  <span className="text-gold">· PROXY</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div
              className="text-[10px] text-txt-faint tracking-widest mb-2.5"
              style={{ fontFamily: FONT_MONO }}
            >
              TOP CONTRIBUTING FACTORS
            </div>
            <div className="flex flex-col gap-2">
              {risk.top_factors.map((f) => (
                <div key={f.feature}>
                  <div
                    className="flex justify-between text-[10.5px] text-txt-dim mb-0.5"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    <span>{f.feature}</span>
                    <span className="tabular">
                      {f.contribution > 0 ? "+" : ""}
                      {f.contribution.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-[3px] bg-line/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.abs(f.contribution) * 250, 100)}%`,
                        background:
                          f.contribution > 0
                            ? `linear-gradient(90deg, ${C.critical}88, ${C.critical})`
                            : `linear-gradient(90deg, ${C.safe}88, ${C.safe})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {shedSchedule.length > 0 && (
            <div>
              <div
                className="text-[10px] text-txt-faint tracking-widest mb-2.5"
                style={{ fontFamily: FONT_MONO }}
              >
                RECOMMENDED SHED SCHEDULE
              </div>
              <div className="flex flex-col gap-2">
                {shedSchedule.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-2.5 transition-all duration-200"
                    style={{
                      background: s.priority === 1
                        ? `linear-gradient(135deg, ${C.critical}12 0%, rgba(20,28,39,0.7) 100%)`
                        : "rgba(20,28,39,0.6)",
                      border: `1px solid ${s.priority === 1 ? C.critical + "44" : C.line + "66"}`,
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
                        className="text-[9.5px] font-bold px-1.5 py-px rounded"
                        style={{
                          fontFamily: FONT_MONO,
                          color: s.priority === 1 ? C.critical : C.caution,
                          border: `1px solid ${s.priority === 1 ? C.critical : C.caution}`,
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
              No shed actions recommended for this zone — critical infrastructure
              excluded or margin healthy.
            </div>
          )}

          <div className="mt-auto pt-3.5 border-t border-line/50">
            <div
              className="text-[10.5px] text-txt-faint leading-relaxed"
              style={{ fontFamily: FONT_BODY }}
            >
              Decision-support output only. No automated shed action is taken —
              human review required before any operational change.
            </div>
          </div>
        </div>
      ) : (
        <div className="text-txt-faint text-xs font-mono">LOADING…</div>
      )}
    </Panel>
  );
}
