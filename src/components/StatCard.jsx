import { FONT_DISPLAY, FONT_MONO, FONT_BODY, colorWithAlpha } from "../config/tokens.js";
import { Icon } from "./Icon.jsx";

function Sparkline({ values, color, label }) {
  if (!values || values.length < 2) return null;
  const w = 72;
  const h = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        aria-hidden="true"
        className="overflow-visible"
      >
        <polyline
          points={pts}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <circle cx={w} cy={pts.split(" ").pop().split(",")[1]} r="2" fill={color} />
      </svg>
      {label && (
        <span
          className="text-2xs tracking-label uppercase text-txt-faint leading-none"
          style={{ fontFamily: FONT_MONO }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  accent,
  icon,
  trend,
  trendIcon,
  spark,
  sparkLabel,
  delay = 0,
}) {
  const accentVar = accent || "var(--color-cyan)";
  return (
    <div
      className="glass-panel gradient-accent rounded-panel p-4 flex flex-col gap-3 min-w-0 animate-panel-in"
      style={{ "--accent-color": accentVar, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <span
          className="text-2xs tracking-label uppercase text-txt-muted font-mono leading-tight min-w-0"
          style={{ fontFamily: FONT_MONO }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="grid place-items-center w-8 h-8 rounded-control shrink-0"
            style={{
              background: colorWithAlpha(accentVar, 0.08),
              border: `1px solid ${colorWithAlpha(accentVar, 0.22)}`,
              boxShadow: `0 0 18px ${colorWithAlpha(accentVar, 0.1)}`,
              color: accentVar,
            }}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 min-w-0">
        <span
          className="tabular text-hero font-bold leading-none text-txt truncate"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {value}
        </span>
        <Sparkline values={spark} color={accentVar} label={sparkLabel} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        {subtext && (
          <span
            className="text-xs text-txt-muted leading-snug min-w-0 flex-1 basis-24 line-clamp-2"
            style={{ fontFamily: FONT_BODY }}
          >
            {subtext}
          </span>
        )}
        {trend && (
          <span
            className="ml-auto flex items-center gap-1 text-2xs font-mono uppercase tracking-label whitespace-nowrap px-1.5 py-0.5 rounded-control"
            style={{
              fontFamily: FONT_MONO,
              color: accentVar,
              background: colorWithAlpha(accentVar, 0.09),
            }}
          >
            <Icon name={trendIcon || "activity"} size={11} strokeWidth={2} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
