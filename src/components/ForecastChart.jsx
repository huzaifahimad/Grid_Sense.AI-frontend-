import {
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Panel } from "./Panel.jsx";
import { ZONE_CHANNEL_COLOR } from "../config/zones.js";
import { C, FONT_MONO } from "../config/tokens.js";

export function ForecastChart({ forecast, selectedZone }) {
  const channelHex =
    "#" + (ZONE_CHANNEL_COLOR[selectedZone] || 0x35d6e8).toString(16).padStart(6, "0");

  return (
    <Panel
      index="04"
      title={`24H Load Forecast — ${selectedZone} · P10 / P50 / P90`}
      accent={channelHex}
      style={{ height: "100%" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={forecast} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={channelHex} stopOpacity={0.25} />
              <stop offset="100%" stopColor={channelHex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: C.textFaint, fontSize: 10, fontFamily: "Space Mono" }}
            axisLine={{ stroke: C.line }}
            tickLine={false}
            label={{
              value: "HOURS AHEAD",
              position: "insideBottom",
              offset: -2,
              fill: C.textFaint,
              fontSize: 9.5,
            }}
          />
          <YAxis
            tick={{ fill: C.textFaint, fontSize: 10, fontFamily: "Space Mono" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(14,20,28,0.9)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${channelHex}66`,
              borderRadius: 6,
              fontSize: 11,
              fontFamily: FONT_MONO,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: C.textFaint }}
          />
          <Area type="monotone" dataKey="p90" stroke="none" fill="url(#bandFill)" />
          <Area type="monotone" dataKey="p10" stroke="none" fill={C.field} fillOpacity={1} />
          <Line type="monotone" dataKey="p50" stroke={channelHex} strokeWidth={2.25} dot={false} />
          <Line type="monotone" dataKey="p90" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="2 3" />
          <Line type="monotone" dataKey="p10" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="2 3" />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}
