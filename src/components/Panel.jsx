import { useId } from "react";
import { FONT_HEADER, FONT_MONO, colorWithAlpha } from "../config/tokens.js";

export function Panel({
  index,
  title,
  accent,
  meta,
  children,
  style,
  noPad,
  delay = 0,
  className = "",
  as: Tag = "section",
}) {
  const titleId = useId();
  const resolvedAccent =
    typeof accent === "number"
      ? "#" + accent.toString(16).padStart(6, "0")
      : accent || "var(--color-line)";

  return (
    <Tag
      aria-labelledby={titleId}
      className={`glass-panel gradient-accent rounded-panel flex flex-col relative min-w-0 animate-panel-in ${className}`}
      style={{
        "--accent-color": resolvedAccent,
        padding: noPad ? 0 : "var(--panel-pad-block) var(--panel-pad-inline)",
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    >
      <div
        className={`flex items-center gap-2 ${
          noPad
            ? "absolute top-3 left-[18px] right-[18px] z-10"
            : "mb-3 pb-2.5 border-b border-line/50"
        }`}
      >
        {index && (
          <span
            className="text-2xs px-1.5 py-0.5 rounded-control font-mono tabular leading-none"
            style={{
              fontFamily: FONT_MONO,
              color: resolvedAccent,
              background: colorWithAlpha(resolvedAccent, 0.1),
              border: `1px solid ${colorWithAlpha(resolvedAccent, 0.28)}`,
            }}
          >
            {index}
          </span>
        )}
        <h2
          id={titleId}
          className="font-semibold text-sm tracking-label uppercase text-txt-dim leading-none truncate"
          style={{ fontFamily: FONT_HEADER, textWrap: "balance" }}
        >
          {title}
        </h2>
        {meta && (
          <div className="ml-auto flex items-center gap-2 shrink-0 text-2xs text-txt-muted font-mono">
            {meta}
          </div>
        )}
      </div>
      <div className={`flex-1 min-w-0 min-h-0 ${noPad ? "pt-11" : ""}`}>{children}</div>
    </Tag>
  );
}
