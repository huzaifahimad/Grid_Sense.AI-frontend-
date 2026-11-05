import { FONT_BODY, FONT_MONO } from "../config/tokens.js";
import { USE_MOCK_DATA } from "../api/client.js";

export function Footer() {
  return (
    <footer className="shrink-0 glass-footer">
      <div className="h-px bg-gradient-to-r from-transparent via-cyan/25 to-transparent" />
      <div
        className="px-4 sm:px-6 pt-2.5 pb-1 text-2xs sm:text-xs text-txt-dim leading-relaxed"
        style={{ fontFamily: FONT_BODY }}
      >
        <span className="text-gold font-semibold uppercase tracking-label text-2xs">
          Data provenance:{" "}
        </span>
        European ENTSO-E load and NASA POWER weather used as{" "}
        <strong className="text-txt">proxies</strong>. This is not Pakistani
        NTDC/DISCO data, and no accuracy figure here transfers to NTDC/DISCO
        without retraining on grid-operator data and a fresh validation run.
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 sm:px-6 py-2 text-2xs text-txt-faint tracking-label"
        style={{ fontFamily: FONT_MONO }}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="text-cyan/80 font-bold">GridSense AI</span>
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span>PROXY CAPACITY FLAGGED</span>
          <span className="opacity-40">·</span>
          <span>PROXY GRID · NOT NTDC/DISCO</span>
          <span className="opacity-40">·</span>
          <span className="text-gold font-bold">HUZAIFA HIMAD'S TEAM</span>
        </div>
      </div>
    </footer>
  );
}
