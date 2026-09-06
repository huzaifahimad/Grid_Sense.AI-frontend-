import { FONT_MONO } from "../config/tokens.js";
import { USE_MOCK_DATA } from "../api/client.js";

export function Footer() {
  return (
    <div className="shrink-0 border-t border-line/40">
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2 glass-footer text-[9px] sm:text-[9.5px] text-txt-faint tracking-wider"
        style={{ fontFamily: FONT_MONO }}
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400/80 font-bold">GridSense AI</span>
          <span className="opacity-50">v2.0</span>
          <span className="opacity-40">·</span>
          <span>LIGHTGBM</span>
          <span className="opacity-40">·</span>
          <span>
            SRC: {USE_MOCK_DATA ? "SIMULATED" : "ENTSO-E + NASA POWER SNAPSHOT"}
          </span>
          <span className="opacity-40">·</span>
          <span>WALK-FORWARD VALIDATED</span>
        </div>
        <div className="flex items-center gap-2">
          <span>PROXY CAPACITY FLAGGED</span>
          <span className="opacity-40">·</span>
          <span className="opacity-60">IEEE / NEPRA ALIGNED</span>
          <span className="opacity-40">·</span>
          <span className="text-gold font-bold">HUZAIFA HIMAD</span>
        </div>
      </div>
    </div>
  );
}
