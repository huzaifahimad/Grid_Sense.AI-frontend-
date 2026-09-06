import { useEffect, useState } from "react";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";
import { API_BASE_URL, USE_MOCK_DATA } from "../api/client.js";
import { FONT_HERO, FONT_MONO } from "../config/tokens.js";

export function Header({ criticalCount, systemAvgRisk }) {
  const [clock, setClock] = useState(new Date());
  const animatedAvg = useAnimatedNumber(systemAvgRisk * 100);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColor =
    criticalCount > 0 ? "var(--color-critical)" : "var(--color-safe)";

  return (
    <div className="gs-root flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 glass-header shrink-0 border-b border-line/50">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/logo-icon.jfif"
            alt="GridSense AI"
            className="h-10 sm:h-12 w-10 sm:w-12 rounded-lg object-cover object-center ring-1 ring-cyan-400/20 drop-shadow-[0_0_12px_rgba(53,214,232,0.35)]"
          />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-0 leading-none">
              <span
                className="text-lg sm:text-xl tracking-wide text-txt-dim"
                style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 600 }}
              >
                Grid
              </span>
              <span
                className="text-lg sm:text-xl tracking-wide"
                style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, color: "#35D6E8" }}
              >
                Sense
              </span>
              <span
                className="text-[10px] sm:text-xs ml-0.5"
                style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 600, color: "#35D6E8" }}
              >
                .AI
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-mono px-1.5 py-px rounded border border-cyan-400/25 bg-cyan-400/5"
                style={{ fontFamily: FONT_MONO, color: "#35D6E8" }}
              >
                v2.0
              </span>
              <span
                className="hidden sm:inline text-[8px] sm:text-[9px] tracking-[0.1em] uppercase font-mono"
                style={{ fontFamily: FONT_MONO, color: "var(--color-txt-faint)" }}
              >
                OVERLOAD RISK PREDICTION
              </span>
            </div>
          </div>
        </div>
        <div className="hidden md:block w-px h-8 bg-line/40" />
        <div
          className="hidden md:block text-[9.5px] text-txt-faint tracking-wider font-mono"
          style={{ fontFamily: FONT_MONO }}
        >
          {USE_MOCK_DATA ? "SIMULATION MODE" : `MODEL SNAPSHOT · ${API_BASE_URL}`}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-line/40 bg-field/50">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          />
          <span
            className="tabular text-[11px] sm:text-[11.5px] text-txt-dim font-mono tracking-wide"
            style={{ fontFamily: FONT_MONO }}
          >
            {criticalCount} CRITICAL
          </span>
          <span className="w-px h-3 bg-line/50" />
          <span
            className="tabular text-[11px] sm:text-[11.5px] text-txt-faint font-mono"
            style={{ fontFamily: FONT_MONO }}
          >
            AVG {animatedAvg.toFixed(0)}%
          </span>
        </div>
        <div
          className="tabular text-[10px] sm:text-[11px] text-txt-faint font-mono hidden md:block"
          style={{ fontFamily: FONT_MONO }}
        >
          {clock.toISOString().slice(0, 19).replace("T", " ")} UTC
        </div>
      </div>
    </div>
  );
}
