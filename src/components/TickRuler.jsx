export function TickRuler() {
  return (
    <div
      className="h-[6px] shrink-0 opacity-70"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, var(--color-line-bright) 0px, var(--color-line-bright) 1px, transparent 1px, transparent 24px)`,
        maskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    />
  );
}
