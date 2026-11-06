import { useMemo, useState } from "react";
import { Panel } from "./Panel.jsx";
import { StatusDot } from "./StatusDot.jsx";
import { Icon } from "./Icon.jsx";
import { ZONE_LABELS, ZONE_CHANNEL_COLOR } from "../config/zones.js";
import {
  FONT_HEADER,
  FONT_MONO,
  FONT_BODY,
  FONT_DISPLAY,
  C,
  STATUS_META,
  stateColor,
  stateGlow,
  hexFromChannel,
  colorWithAlpha,
  riskPercentText,
} from "../config/tokens.js";

const SORTS = {
  risk: (a, b) => b.risk_score - a.risk_score,
  zone: (a, b) => a.zone.localeCompare(b.zone),
};

export function AssetTable({
  sortedAssets,
  selectedZone,
  onSelectZone,
  safeCount,
  elevatedCount,
  criticalCount,
  location,
  index = "01",
}) {
  const [sort, setSort] = useState("risk");
  const rows = useMemo(
    () => [...sortedAssets].sort(SORTS[sort]),
    [sortedAssets, sort]
  );

  return (
    <Panel
      index={index}
      title="Monitored Assets"
      accent={C.cyan}
      className="h-full"
      meta={
        <span className="tabular whitespace-nowrap">
          {sortedAssets.length} zones
        </span>
      }
    >
      <div className="flex flex-col h-full gap-3">
        {/* Status summary: count plus label, never colour alone */}
        <div className="grid grid-cols-3 gap-2">
          <StatusPill count={safeCount} label="Normal" color={C.safe} icon="shield" />
          <StatusPill count={elevatedCount} label="Elevated" color={C.caution} icon="alert" />
          <StatusPill count={criticalCount} label="Critical" color={C.critical} icon="bolt" />
        </div>

        {/* Sort controls double as column headers and carry their own state */}
        <div
          className="grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-center pb-1 border-b border-line/50"
          role="group"
          aria-label="Sort assets"
        >
          <SortButton active={sort === "zone"} onClick={() => setSort("zone")}>
            Asset / Zone
          </SortButton>
          <SortButton
            active={sort === "risk"}
            onClick={() => setSort("risk")}
            align="right"
            descending
            ariaSort="descending"
          >
            Risk
          </SortButton>
        </div>

        <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
          {rows.map((a, i) => (
            <AssetRow
              key={a.asset_id}
              asset={a}
              selected={selectedZone === a.zone}
              onSelect={() => onSelectZone(a.zone)}
              index={i}
            />
          ))}
        </ul>

        <p
          className="mt-auto pt-2.5 text-xs text-txt-muted leading-snug border-t border-line/40 flex items-start gap-2"
          style={{ fontFamily: FONT_BODY }}
        >
          <span className="mt-0.5 shrink-0 text-txt-faint" aria-hidden="true">
            <Icon name="target" size={13} />
          </span>
          <span className="min-w-0">
            Select an asset to inspect its 24-hour forecast and recommended shed
            actions.
            {location && (
              <span
                className="block text-2xs tabular mt-0.5"
                style={{ fontFamily: FONT_MONO }}
              >
                {selectedZone.replace("_", "-")} · {location}
              </span>
            )}
          </span>
        </p>
      </div>
    </Panel>
  );
}

function SortButton({ active, onClick, children, align = "left", descending = false, ariaSort }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      {...(ariaSort ? { "aria-sort": ariaSort } : {})}
      className={`flex items-center gap-1 px-1.5 min-h-[40px] rounded-control text-2xs tracking-label uppercase font-mono pressable
        ${align === "right" ? "justify-end" : ""}
        ${active ? "text-cyan bg-cyan/8" : "text-txt-muted hover:text-txt-dim hover:bg-panel-hover"}`}
      style={{ fontFamily: FONT_MONO }}
    >
      {children}
      <Icon
        name={active ? "arrowUp" : "arrowRight"}
        size={10}
        strokeWidth={2.2}
        className={active && descending ? "rotate-180" : ""}
      />
    </button>
  );
}

function AssetRow({ asset, selected, onSelect, index }) {
  const channelHex = hexFromChannel(ZONE_CHANNEL_COLOR[asset.zone]);
  const meta = STATUS_META[asset.status] || STATUS_META.normal;
  const glowColor = stateGlow(asset.status);
  const riskPct = riskPercentText(asset.risk_score);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="group pressable w-full grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3 text-left text-txt cursor-pointer rounded-control animate-fade-in"
        style={{
          animationDelay: `${index * 40}ms`,
          background: selected
            ? `linear-gradient(135deg, ${colorWithAlpha(channelHex, 0.1)} 0%, hsl(216 28% 11% / 0.85) 100%)`
            : "transparent",
          border: `1px solid ${selected ? colorWithAlpha(channelHex, 0.35) : "transparent"}`,
          padding: "10px 12px",
          backdropFilter: selected ? "blur(8px)" : "none",
        }}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={asset.status} />
          <span className="min-w-0 flex-1">
            <span
              className="block text-sm font-semibold tracking-wide truncate"
              style={{ fontFamily: FONT_HEADER }}
            >
              {asset.asset_id}
            </span>
            <span className="block text-2xs mt-0.5 truncate" style={{ color: channelHex, fontFamily: FONT_MONO }}>
              {ZONE_LABELS[asset.zone]}
            </span>
            {/* Risk meter: shape plus number, readable without colour perception */}
            <span
              className="block mt-1.5 h-[3px] rounded-pill bg-line/70 overflow-hidden"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-pill transition-transform duration-500 ease-out"
                style={{
                  width: "100%",
                  transform: `scaleX(${asset.risk_score})`,
                  transformOrigin: "left center",
                  background: stateColor(asset.status),
                }}
              />
            </span>
          </span>
        </span>

        <span className="flex flex-col items-end gap-0.5">
          <span
            className="tabular text-lg font-bold leading-none"
            style={{
              fontFamily: FONT_DISPLAY,
              color: meta.color,
              textShadow: selected ? `0 0 12px ${colorWithAlpha(glowColor, 0.35)}` : "none",
            }}
          >
            {riskPct}
            <span className="text-2xs align-top" style={{ color: C.textMuted }}>%</span>
          </span>
          <span
            className="text-2xs uppercase tracking-label font-mono"
            style={{ fontFamily: FONT_MONO, color: meta.color }}
          >
            {meta.label}
          </span>
        </span>
        <span className="sr-only">
          {`Zone ${asset.zone}, ${meta.label} risk ${riskPct} percent. Activate to inspect.`}
        </span>
      </button>
    </li>
  );
}

function StatusPill({ count, label, color, icon }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-control py-2 px-2 border gap-1"
      style={{
        background: colorWithAlpha(color, 0.06),
        borderColor: colorWithAlpha(color, 0.24),
      }}
    >
      <span className="flex items-center gap-1.5">
        <Icon name={icon} size={13} style={{ color }} />
        <span
          className="tabular text-lg font-bold leading-none"
          style={{ fontFamily: FONT_DISPLAY, color }}
        >
          {count}
        </span>
      </span>
      <span
        className="text-2xs text-txt-muted tracking-label uppercase font-mono leading-none"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </span>
    </div>
  );
}
