import { Panel } from "./Panel.jsx";
import { StatusDot } from "./StatusDot.jsx";
import { ZONE_LABELS, ZONE_CHANNEL_COLOR } from "../config/zones.js";
import { FONT_HEADER, FONT_MONO, C, stateColor } from "../config/tokens.js";

export function AssetTable({ sortedAssets, selectedZone, onSelectZone }) {
  return (
    <Panel index="01" title="Monitored Assets" accent={C.cyan} style={{ height: "100%" }}>
      <div className="flex flex-col h-full">
        <div
          className="grid grid-cols-[1fr_46px] text-[9.5px] text-txt-faint tracking-wider pb-2"
          style={{ fontFamily: FONT_MONO }}
        >
          <span>ASSET / ZONE</span>
          <span className="text-right">RISK</span>
        </div>
        <div className="flex flex-col overflow-y-auto gap-0.5">
          {sortedAssets.map((a) => {
            const channelHex =
              "#" + ZONE_CHANNEL_COLOR[a.zone].toString(16).padStart(6, "0");
            const isSelected = selectedZone === a.zone;
            return (
              <button
                key={a.asset_id}
                onClick={() => onSelectZone(a.zone)}
                className="grid grid-cols-[1fr_46px] items-center border-none text-left text-txt cursor-pointer rounded-md transition-all duration-200 hover:shadow-[0_0_12px_rgba(53,214,232,0.08)] focus-visible:outline-2 focus-visible:outline-cyan"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${channelHex}14 0%, rgba(20,28,39,0.8) 100%)`
                    : "rgba(14,20,28,0.4)",
                  borderLeft: `2px solid ${isSelected ? channelHex : "transparent"}`,
                  padding: "10px 8px 10px 10px",
                  backdropFilter: isSelected ? "blur(8px)" : "none",
                }}
              >
                <div className="flex items-center min-w-0">
                  <StatusDot status={a.status} />
                  <div className="min-w-0">
                    <div
                      className="text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: FONT_HEADER }}
                    >
                      {a.asset_id}
                    </div>
                    <div
                      className="text-[10px] mt-px"
                      style={{ color: channelHex, fontFamily: FONT_MONO }}
                    >
                      {ZONE_LABELS[a.zone]}
                    </div>
                  </div>
                </div>
                <div
                  className="tabular text-[13px] font-bold text-right"
                  style={{ fontFamily: FONT_MONO, color: stateColor(a.status) }}
                >
                  {(a.risk_score * 100).toFixed(0)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
