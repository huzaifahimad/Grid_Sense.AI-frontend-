import { FONT_MONO } from "../config/tokens.js";
import { Icon } from "./Icon.jsx";

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="px-[var(--gutter)] sm:px-5 py-2 shrink-0 border-b border-critical/30 flex items-start gap-2"
      style={{
        background: "hsl(5 50% 12% / 0.9)",
        backdropFilter: "blur(12px)",
        color: "var(--color-critical)",
        fontFamily: FONT_MONO,
      }}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <Icon name="alert" size={14} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="font-bold tracking-label">API ERROR</span> — {error}. Live data is
        unavailable; no simulated data was loaded.
      </span>
    </div>
  );
}
