import { STATUS_META, colorWithAlpha } from "../config/tokens.js";

export function StatusDot({ status, className = "" }) {
  const { color, glow } = STATUS_META[status] || STATUS_META.normal;
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block w-2 h-2 rounded-full shrink-0 ${className}`}
      style={{
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 14px ${colorWithAlpha(glow, 0.35)}`,
      }}
    >
      {status === "critical" && (
        <span
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ border: `1.5px solid ${color}` }}
        />
      )}
    </span>
  );
}
