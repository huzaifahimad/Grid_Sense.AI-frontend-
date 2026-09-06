import { stateColor, stateGlow, colorWithAlpha } from "../config/tokens.js";

export function StatusDot({ status, className = "" }) {
  const color = stateColor(status);
  const glow = stateGlow(status);
  return (
    <span
      className={`inline-block w-[8px] h-[8px] rounded-full shrink-0 ${className}`}
      style={{
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 14px ${colorWithAlpha(glow, 0.35)}`,
      }}
    />
  );
}
