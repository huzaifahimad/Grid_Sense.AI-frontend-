import { useEffect, useRef, useState } from "react";
import { FONT_DISPLAY, FONT_MONO, stateColor, colorWithAlpha, riskPercentText } from "../config/tokens.js";

const shortZone = (zone) => zone.replace("_", "-");

/**
 * Phone-only zone switcher. On desktop the asset table carries this job; at
 * 375 px it sits below the fold, so the selection has to live above it.
 */
export function ZoneChips({ sortedAssets, selectedZone, onSelectZone }) {
  const scroller = useRef(null);
  const [overflow, setOverflow] = useState(false);

  // A cut chip with a hidden scrollbar looks broken; a faded edge looks like
  // more. Only show the fade when the row genuinely overflows.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const check = () => setOverflow(el.scrollWidth - el.clientWidth > 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sortedAssets.length]);

  return (
    <div className="chips-bar sticky top-0 z-30 rounded-panel border border-line/70 overflow-hidden">
      <span id="zone-chip-label" className="sr-only">
        Monitored zones
      </span>
      <div
        ref={scroller}
        role="group"
        aria-labelledby="zone-chip-label"
        className={`no-scrollbar flex snap-x gap-1.5 overflow-x-auto px-2 py-2 ${
          overflow ? "chips-fade" : ""
        }`}
      >
        {sortedAssets.map((a) => {
          const color = stateColor(a.status);
          const selected = a.zone === selectedZone;
          return (
            <button
              key={a.zone}
              type="button"
              onClick={() => onSelectZone(a.zone)}
              aria-current={selected ? "true" : undefined}
              aria-label={`${shortZone(a.zone)}, ${a.status}, risk ${riskPercentText(a.risk_score)} percent`}
              className="chip snap-start grow basis-0 rounded-control border px-2.5 py-1.5 text-left min-w-[104px] min-h-[46px] flex flex-col justify-center gap-0.5"
              style={{
                background: selected
                  ? colorWithAlpha(color, 0.14)
                  : "hsl(216 28% 11% / 0.82)",
                borderColor: selected
                  ? colorWithAlpha(color, 0.55)
                  : "hsl(213 24% 20% / 0.9)",
              }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-pill shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  aria-hidden="true"
                />
                <span
                  className="tabular text-sm font-bold truncate"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    color: selected ? "var(--color-txt)" : "var(--color-txt-dim)",
                  }}
                >
                  {shortZone(a.zone)}
                </span>
              </span>
              <span className="flex items-baseline justify-between gap-1 min-w-0">
                <span
                  className="text-2xs tracking-label uppercase truncate"
                  style={{ fontFamily: FONT_MONO, color: "var(--color-txt-muted)" }}
                >
                  {a.status}
                </span>
                <span
                  className="tabular text-2xs font-bold shrink-0"
                  style={{ fontFamily: FONT_MONO, color }}
                >
                  {riskPercentText(a.risk_score)}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
