export function TickRuler() {
  return (
    <div
      className="h-[7px] shrink-0"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, var(--color-line) 0px, var(--color-line) 1px, transparent 1px, transparent 22px)`,
      }}
    />
  );
}
