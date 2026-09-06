import { FONT_MONO } from "../config/tokens.js";

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      className="px-5 py-2 shrink-0 border-b border-critical/30 font-mono"
      style={{
        background: "hsl(5 50% 12% / 0.9)",
        backdropFilter: "blur(12px)",
        color: "var(--color-critical)",
        fontFamily: FONT_MONO,
      }}
    >
      <span className="font-bold">⚠ API ERROR</span> — {error}. Live data is unavailable; no simulated data was loaded.
    </div>
  );
}
