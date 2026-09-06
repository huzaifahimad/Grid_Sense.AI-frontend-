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
import { C, FONT_MONO, hexFromChannel, colorWithAlpha } from "../config/tokens.js";

export function ForecastChart({ forecast, selectedZone }) {
  const channelHex = hexFromChannel(ZONE_CHANNEL_COLOR[selectedZone]);

  return (
    <Panel
      index="04"
      title={`24H Load Forecast — ${selectedZone.replace("_", "-")} · P10 / P50 / P90`}
      accent={channelHex}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={forecast} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={channelHex} stopOpacity={0.28} />
              <stop offset="100%" stopColor={channelHex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.line} vertical={false} strokeOpacity={0.5} />
          <XAxis
            dataKey="hour"
            tick={{ fill: C.textFaint, fontSize: 10, fontFamily: FONT_MONO }}
            axisLine={{ stroke: C.line }}
            tickLine={false}
            label={{
              value: "HOURS AHEAD",
              position: "insideBottom",
              offset: -2,
              fill: C.textFaint,
              fontSize: 9,
              fontFamily: FONT_MONO,
            }}
          />
          <YAxis
            tick={{ fill: C.textFaint, fontSize: 10, fontFamily: FONT_MONO }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(216 30% 8% / 0.94)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${colorWithAlpha(channelHex, 0.4)}`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: FONT_MONO,
              boxShadow: "0 4px 20px hsl(216 40% 2% / 0.5)",
            }}
            labelStyle={{ color: C.textFaint }}
            itemStyle={{ color: C.textDim }}
          />
          <Area type="monotone" dataKey="p90" stroke="none" fill="url(#bandFill)" />
          <Area type="monotone" dataKey="p10" stroke="none" fill={C.field} fillOpacity={1} />
          <Line
            type="monotone"
            dataKey="p50"
            stroke={channelHex}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: C.field, strokeWidth: 2, fill: channelHex }}
          />
          <Line
            type="monotone"
            dataKey="p90"
            stroke={C.textFaint}
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="p10"
            stroke={C.textFaint}
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}
