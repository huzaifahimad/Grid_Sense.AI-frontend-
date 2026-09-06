import { Panel } from "./Panel.jsx";
import { StatusDot } from "./StatusDot.jsx";
import { ZONE_LABELS, ZONE_CHANNEL_COLOR } from "../config/zones.js";
import { FONT_HEADER, FONT_MONO, FONT_BODY, FONT_DISPLAY, C, stateColor, stateGlow, hexFromChannel, colorWithAlpha } from "../config/tokens.js";

export function AssetTable({
  sortedAssets,
  selectedZone,
  onSelectZone,
  safeCount,
  elevatedCount,
  criticalCount,
}) {
  return (
    <Panel index="01" title="Monitored Assets" accent={C.cyan} className="h-full">
      <div className="flex flex-col h-full">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatusPill count={safeCount} label="Normal" color={C.safe} />
          <StatusPill count={elevatedCount} label="Elevated" color={C.caution} />
          <StatusPill count={criticalCount} label="Critical" color={C.critical} />
        </div>

        {/* Column headers */}
        <div
          className="grid grid-cols-[1fr_50px] text-[9px] text-txt-faint tracking-[0.14em] uppercase pb-2 border-b border-line/40 font-mono"
          style={{ fontFamily: FONT_MONO }}
        >
          <span>Asset / Zone</span>
          <span className="text-right">Risk</span>
        </div>

        {/* Asset list */}
        <div className="flex flex-col overflow-y-auto gap-1 pt-1.5">
          {sortedAssets.map((a) => {
            const channelHex = hexFromChannel(ZONE_CHANNEL_COLOR[a.zone]);
            const isSelected = selectedZone === a.zone;
            const status = a.status;
            const glowColor = stateGlow(status);

            return (
              <button
                key={a.asset_id}
                onClick={() => onSelectZone(a.zone)}
                className="group grid grid-cols-[1fr_50px] items-center border-none text-left text-txt cursor-pointer rounded-lg transition-all duration-250 hover:shadow-glow-cyan focus-visible:outline-2 focus-visible:outline-cyan"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${colorWithAlpha(channelHex, 0.09)} 0%, hsl(216 28% 11% / 0.85) 100%)`
                    : "transparent",
                  border: `1px solid ${isSelected ? colorWithAlpha(channelHex, 0.35) : "transparent"}`,
                  padding: "10px 10px 10px 12px",
                  backdropFilter: isSelected ? "blur(8px)" : "none",
                }}
              >
                <div className="flex items-center min-w-0 gap-2.5">
                  <StatusDot status={status} />
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis tracking-wide"
                      style={{ fontFamily: FONT_HEADER }}
                    >
                      {a.asset_id}
                    </div>
                    <div
                      className="text-[10px] mt-0.5 font-mono"
                      style={{ color: channelHex, fontFamily: FONT_MONO }}
                    >
                      {ZONE_LABELS[a.zone]}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className="tabular text-[15px] font-bold"
                    style={{ fontFamily: FONT_DISPLAY, color: stateColor(status), textShadow: isSelected ? `0 0 12px ${colorWithAlpha(glowColor, 0.35)}` : "none" }}
                  >
                    {(a.risk_score * 100).toFixed(0)}
                  </span>
                  <span className="text-[8px] text-txt-faint font-mono uppercase" style={{ fontFamily: FONT_MONO }}>
                    %
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="mt-auto pt-2.5 text-[9.5px] text-txt-faint leading-relaxed border-t border-line/40"
          style={{ fontFamily: FONT_BODY }}
        >
          Select an asset to inspect 24-hour forecast and recommended shed actions.
        </div>
      </div>
    </Panel>
  );
}

function StatusPill({ count, label, color }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-md py-1.5 px-2 border"
      style={{
        background: colorWithAlpha(color, 0.06),
        borderColor: colorWithAlpha(color, 0.22),
      }}
    >
      <span
        className="tabular text-[16px] font-bold leading-none"
        style={{ fontFamily: FONT_DISPLAY, color }}
      >
        {count}
      </span>
      <span
        className="text-[8px] text-txt-faint tracking-[0.1em] uppercase mt-0.5 font-mono"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </span>
    </div>
  );
}
