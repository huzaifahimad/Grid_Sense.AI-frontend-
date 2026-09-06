import { FONT_HEADER, FONT_MONO, colorWithAlpha } from "../config/tokens.js";

export function Panel({
  index,
  title,
  accent,
  children,
  style,
  noPad,
  className = "",
}) {
  const accentColor = accent || "var(--color-line)";
  const resolvedAccent =
    typeof accentColor === "number"
      ? "#" + accentColor.toString(16).padStart(6, "0")
      : accentColor;

  return (
    <div
      className={`glass-panel gradient-accent rounded-lg flex flex-col relative min-w-0 ${className}`}
      style={{
        "--accent-color": resolvedAccent,
        padding: noPad ? 0 : "16px 18px",
        ...style,
      }}
    >
      <div
        className={`flex items-baseline gap-2 ${noPad ? "absolute top-3.5 left-[18px] z-10" : "mb-3.5 pb-2.5 border-b border-line/50"}`}
      >
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono"
          style={{
            fontFamily: FONT_MONO,
            color: resolvedAccent,
            background: colorWithAlpha(resolvedAccent, 0.1),
            border: `1px solid ${colorWithAlpha(resolvedAccent, 0.28)}`,
          }}
        >
          {index}
        </span>
        <span
          className="font-semibold text-[13px] tracking-[0.12em] uppercase text-txt-dim"
          style={{ fontFamily: FONT_HEADER }}
        >
          {title}
        </span>
      </div>
      <div className={`flex-1 min-w-0 min-h-0 ${noPad ? "pt-9" : ""}`}>{children}</div>
    </div>
  );
}
