import {
  generateMockAssets,
  generateMockForecast,
  generateMockRisk,
  generateMockShedSchedule,
} from "./mocks.js";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";

export async function fetchAssets() {
  if (USE_MOCK_DATA) return generateMockAssets();
  const res = await fetch(`${API_BASE_URL}/assets`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

export async function fetchForecast(zone) {
  if (USE_MOCK_DATA) return generateMockForecast(zone);
  const res = await fetch(`${API_BASE_URL}/forecast/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return data.points.map((p, i) => ({ ...p, hour: i }));
}

export async function fetchRisk(zone) {
  if (USE_MOCK_DATA) return generateMockRisk(zone);
  const res = await fetch(`${API_BASE_URL}/risk/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch risk");
  return res.json();
}

export async function fetchShedSchedule(zone) {
  if (USE_MOCK_DATA) return generateMockShedSchedule(zone);
  const res = await fetch(`${API_BASE_URL}/shed-schedule/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch shed schedule");
  return res.json();
}
