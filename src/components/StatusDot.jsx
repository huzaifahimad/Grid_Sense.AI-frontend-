export function StatusDot({ status }) {
  const color =
    status === "critical"
      ? "var(--color-critical)"
      : status === "elevated"
        ? "var(--color-caution)"
        : "var(--color-safe)";
  return (
    <span
      className="inline-block w-[7px] h-[7px] rounded-full mr-2.5 shrink-0"
      style={{ background: color, boxShadow: `0 0 7px ${color}` }}
    />
  );
}
