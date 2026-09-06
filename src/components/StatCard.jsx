import { FONT_DISPLAY, FONT_MONO, colorWithAlpha } from "../config/tokens.js";

export function StatCard({ label, value, subtext, accent, icon, trend }) {
  const accentVar = accent || "var(--color-cyan)";
  return (
    <div
      className="glass-panel gradient-accent rounded-lg p-4 flex items-center justify-between gap-3"
      style={{ "--accent-color": accentVar }}
    >
      <div className="flex flex-col gap-1">
        <span
          className="text-[9px] tracking-[0.16em] uppercase text-txt-faint font-mono"
          style={{ fontFamily: FONT_MONO }}
        >
          {label}
        </span>
        <span
          className="tabular text-[26px] sm:text-[30px] font-bold leading-none text-txt"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {value}
        </span>
        {subtext && (
          <span
            className="text-[10px] text-txt-muted font-body"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {subtext}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: colorWithAlpha(accentVar, 0.08),
              border: `1px solid ${colorWithAlpha(accentVar, 0.2)}`,
              boxShadow: `0 0 18px ${colorWithAlpha(accentVar, 0.1)}`,
            }}
          >
            <span className="text-lg">{icon}</span>
          </div>
        )}
        {trend && (
          <span
            className="text-[9px] font-mono tracking-wide"
            style={{ fontFamily: FONT_MONO, color: accentVar }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
