import { ZONES } from "../config/zones.js";

export function generateMockAssets() {
  return ZONES.map((zone, i) => {
    const risk = [0.82, 0.34, 0.58][i];
    return {
      asset_id: `${zone}-FEEDER-01`,
      zone,
      risk_score: risk,
      status: risk > 0.7 ? "critical" : risk > 0.4 ? "elevated" : "normal",
    };
  });
}

export function generateMockForecast(zone) {
  const now = Date.now();
  const points = [];
  for (let h = 0; h < 24; h++) {
    const base = 4200 + Math.sin(h / 3.8) * 900 + (zone === "ES" ? 300 : 0);
    points.push({
      timestamp: new Date(now + h * 3600000).toISOString(),
      hour: h,
      p10: Math.round(base * 0.9),
      p50: Math.round(base),
      p90: Math.round(base * 1.1),
    });
  }
  return points;
}

export function generateMockRisk(zone) {
  const factors = {
    ES: [
      { feature: "temperature_c", contribution: 0.31 },
      { feature: "load_to_capacity_ratio", contribution: 0.24 },
      { feature: "load_roll_std_24h", contribution: 0.11 },
    ],
    GR: [
      { feature: "hour_sin", contribution: 0.08 },
      { feature: "temperature_c", contribution: 0.06 },
      { feature: "load_lag_24h", contribution: 0.04 },
    ],
    IT_SOUTH: [
      { feature: "temperature_c", contribution: 0.19 },
      { feature: "wind_speed_ms", contribution: 0.09 },
      { feature: "load_roll_mean_168h", contribution: 0.07 },
    ],
  };
  const scores = { ES: 0.82, GR: 0.34, IT_SOUTH: 0.58 };
  const caps = { ES: 5400, GR: 3100, IT_SOUTH: 4000 };
  const loads = { ES: 5050, GR: 2100, IT_SOUTH: 3350 };
  const snapshot = new Date().toISOString();
  return {
    zone,
    asset_id: `${zone}-FEEDER-01`,
    risk_score: scores[zone],
    snapshot_timestamp: snapshot,
    snapshot_load_mw: loads[zone],
    capacity_mw: caps[zone],
    top_factors: factors[zone],
    is_proxy_capacity: true,
  };
}

export function generateMockShedSchedule(zone) {
  const risk = generateMockRisk(zone);
  const margin = risk.capacity_mw - risk.snapshot_load_mw;
  const snapshotHour = risk.snapshot_timestamp.slice(0, 16).replace("T", " ");
  return [
    {
      zone,
      asset_id: risk.asset_id,
      priority: risk.risk_score > 0.7 ? 1 : 2,
      reasoning: `Load ${risk.snapshot_load_mw.toFixed(0)}MW at ${snapshotHour}Z against estimated (proxy) capacity ${risk.capacity_mw.toFixed(0)}MW — margin ${margin.toFixed(0)}MW, risk score ${risk.risk_score.toFixed(2)}`,
      predicted_margin_mw: margin,
    },
  ];
}
