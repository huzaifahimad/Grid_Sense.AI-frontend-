import { useEffect, useState } from "react";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";
import { API_BASE_URL, USE_MOCK_DATA } from "../api/client.js";
import { FONT_BRAND, FONT_DISPLAY, FONT_MONO, stateColor, statusFromScore } from "../config/tokens.js";

export function Header({ criticalCount, systemAvgRisk }) {
  const [clock, setClock] = useState(new Date());
  const animatedAvg = useAnimatedNumber(systemAvgRisk * 100);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const systemStatus = statusFromScore(systemAvgRisk);
  const statusColor = stateColor(systemStatus);
  const statusLabel = criticalCount > 0 ? "CRITICAL ALERT" : systemStatus === "elevated" ? "ELEVATED WATCH" : "SYSTEM NORMAL";

  return (
    <header className="glass-header shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <img
              src="/images/logo-icon.jfif"
              alt="GridSense AI"
              className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl object-cover object-center ring-1 ring-cyan/30"
              style={{ boxShadow: "0 0 18px hsl(186 79% 56% / 0.25)" }}
            />
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-0 leading-none">
              <span
                className="text-lg sm:text-xl tracking-[0.04em] text-txt"
                style={{ fontFamily: FONT_BRAND, fontWeight: 700 }}
              >
                Grid
              </span>
              <span
                className="text-lg sm:text-xl tracking-[0.04em]"
                style={{ fontFamily: FONT_BRAND, fontWeight: 800, color: "var(--color-cyan)" }}
              >
                Sense
              </span>
              <span
                className="text-[10px] sm:text-xs ml-0.5"
                style={{ fontFamily: FONT_BRAND, fontWeight: 700, color: "var(--color-cyan)" }}
              >
                .AI
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[9px] tracking-[0.16em] uppercase px-1.5 py-px rounded border border-cyan/25 bg-cyan/5 font-mono"
                style={{ fontFamily: FONT_MONO, color: "var(--color-cyan)" }}
              >
                v2.0
              </span>
              <span
                className="hidden sm:inline text-[9px] tracking-[0.12em] uppercase text-txt-faint font-mono"
                style={{ fontFamily: FONT_MONO }}
              >
                OVERLOAD RISK PREDICTION
              </span>
            </div>
          </div>
        </div>

        {/* System status + clock */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-line/60 bg-field/50"
            style={{ boxShadow: "inset 0 1px 0 hsl(210 33% 95% / 0.03)" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
            />
            <span
              className="tabular text-[11px] font-bold tracking-wide font-mono"
              style={{ fontFamily: FONT_MONO, color: statusColor }}
            >
              {statusLabel}
            </span>
            <span className="w-px h-3 bg-line/60" />
            <span
              className="tabular text-[11px] text-txt-dim font-mono"
              style={{ fontFamily: FONT_MONO }}
            >
              AVG {animatedAvg.toFixed(0)}%
            </span>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <span
              className="tabular text-[11px] text-txt font-display"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {clock.toISOString().slice(0, 19).replace("T", " ")} UTC
            </span>
            <span
              className="text-[9px] text-txt-faint tracking-wider uppercase font-mono"
              style={{ fontFamily: FONT_MONO }}
            >
              {USE_MOCK_DATA ? "SIMULATION MODE" : "LIVE MODEL SNAPSHOT"}
            </span>
          </div>
        </div>
      </div>

      {/* Source ribbon */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <div className="px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-[9px] text-txt-faint tracking-wider uppercase font-mono">
        <span style={{ fontFamily: FONT_MONO }}>
          {USE_MOCK_DATA ? "SIMULATED DATA" : `SOURCE · ${API_BASE_URL}`}
        </span>
        <span className="hidden sm:inline" style={{ fontFamily: FONT_MONO }}>
          ENTSO-E + NASA POWER · LIGHTGBM · SHAP
        </span>
      </div>
    </header>
  );
}
