import { FONT_HEADER, FONT_MONO } from "../config/tokens.js";

export function Panel({ index, title, accent, children, style, noPad }) {
  const accentColor = accent || "var(--color-line)";
  return (
    <div
      className="glass-panel gradient-accent rounded-lg flex flex-col relative transition-shadow duration-300"
      style={{
        "--accent-color": typeof accentColor === "number"
          ? "#" + accentColor.toString(16).padStart(6, "0")
          : accentColor,
        padding: noPad ? 0 : "16px 18px",
        ...style,
      }}
    >
      <div
        className={`flex items-baseline gap-2 ${noPad ? "absolute top-3.5 left-[18px] z-2" : "mb-3.5 pb-2.5 border-b border-line/50"}`}
      >
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm"
          style={{
            fontFamily: FONT_MONO,
            color: typeof accentColor === "number"
              ? "#" + accentColor.toString(16).padStart(6, "0")
              : accentColor,
            background: typeof accentColor === "number"
              ? "#" + accentColor.toString(16).padStart(6, "0") + "18"
              : `${accentColor}18`,
            border: `1px solid ${typeof accentColor === "number"
              ? "#" + accentColor.toString(16).padStart(6, "0")
              : accentColor}44`,
          }}
        >
          {index}
        </span>
        <span
          className="font-semibold text-[14px] tracking-wider uppercase text-txt-dim"
          style={{ fontFamily: FONT_HEADER }}
        >
          {title}
        </span>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
