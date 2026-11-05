import { FONT_HEADER, FONT_MONO } from "../config/tokens.js";

// Shimmer rather than pulse: the moving highlight reads as "data arriving",
// and it collapses to a flat block under prefers-reduced-motion.
const SHIMMER = "skeleton-shimmer block";

export function Bar({ className = "", style }) {
  return <span className={`${SHIMMER} ${className}`} style={style} aria-hidden="true" />;
}

/**
 * Skeletons reuse the real Panel frame (index, title, accent) so swapping the
 * loaded content in place does not move anything on screen.
 */
export function SkeletonPanel({ index, title, accent, className = "", children, noPad }) {
  return (
    <div
      className={`glass-panel gradient-accent rounded-panel flex flex-col relative min-w-0 ${className}`}
      style={{
        "--accent-color": accent || "var(--color-line)",
        padding: noPad ? 0 : "var(--panel-pad-block) var(--panel-pad-inline)",
      }}
    >
      <div
        className={`flex items-center gap-2 ${
          noPad
            ? "absolute top-3 left-[18px] right-[18px] z-10"
            : "mb-3 pb-2.5 border-b border-line/50"
        }`}
      >
        <span
          className="text-2xs px-1.5 py-0.5 rounded-control font-mono tabular leading-none"
          style={{ fontFamily: FONT_MONO, color: accent || "var(--color-line)" }}
        >
          {index}
        </span>
        <span
          className="font-semibold text-sm tracking-label uppercase text-txt-dim"
          style={{ fontFamily: FONT_HEADER }}
        >
          {title}
        </span>
      </div>
      <div className={`flex-1 min-w-0 min-h-0 ${noPad ? "pt-11" : ""}`}>{children}</div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-panel gradient-accent rounded-panel p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Bar className="h-2.5 w-24" />
        <Bar className="w-8 h-8 rounded-control shrink-0" />
      </div>
      <Bar className="h-8 w-20" />
      <div className="flex items-center justify-between gap-2">
        <Bar className="h-2.5 w-28" />
        <Bar className="h-3.5 w-14 rounded-pill" />
      </div>
      <span className="sr-only">Loading metric</span>
    </div>
  );
}

export function AssetTableSkeleton({ rows = 3 }) {
  return (
    <SkeletonPanel index="01" title="Monitored Assets" accent="var(--color-cyan)" className="h-full">
      <div className="flex flex-col h-full gap-3">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bar key={i} className="h-11 rounded-control" />
          ))}
        </div>
        <Bar className="h-2.5 w-full" />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Bar className="w-2 h-2 rounded-pill shrink-0" />
                <div className="flex-1 min-w-0">
                  <Bar className="h-3 w-28 mb-1.5" />
                  <Bar className="h-2 w-20 mb-1.5" />
                  <Bar className="h-[3px] w-full rounded-pill" />
                </div>
              </div>
              <Bar className="h-5 w-9 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPanel>
  );
}

export function ChartSkeleton({ zone }) {
  return (
    <SkeletonPanel
      index="04"
      title={`24H Load Forecast — ${zone ? zone.replace("_", "-") : ""}`}
      accent="var(--color-cyan)"
      className="h-full"
    >
      <div className="h-full flex flex-col justify-between gap-3 pb-5">
        <div className="flex gap-2">
          <Bar className="h-5 w-28 rounded-control" />
          <Bar className="h-5 w-24 rounded-control" />
        </div>
        <div className="flex-1 flex items-end gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Bar
              key={i}
              className="flex-1 rounded-t-control"
              style={{ height: `${28 + ((i * 37) % 55)}%` }}
            />
          ))}
        </div>
        <Bar className="h-2.5 w-full" />
      </div>
    </SkeletonPanel>
  );
}

export function DetailSkeleton({ index, title, accent, lines = 5 }) {
  return (
    <SkeletonPanel index={index} title={title} accent={accent} className="h-full">
      <div className="flex flex-col gap-3">
        <Bar className="h-24 rounded-panel" />
        <div className="grid grid-cols-2 gap-3">
          <Bar className="h-14 rounded-panel" />
          <Bar className="h-14 rounded-panel" />
        </div>
        {Array.from({ length: lines }).map((_, i) => (
          <Bar key={i} className="h-3" style={{ width: `${92 - i * 9}%` }} />
        ))}
      </div>
    </SkeletonPanel>
  );
}
