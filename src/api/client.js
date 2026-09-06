import {
  generateMockAssets,
  generateMockForecast,
  generateMockRisk,
  generateMockShedSchedule,
} from "./mocks.js";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://grid-senseai-backend.fastapicloud.dev";
// Mock data is opt-in only. Anything other than the literal string "true"
// hits the live API; failed requests throw and surface in ErrorBanner —
// they must NOT fall through to mocks.js.
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export async function fetchAssets(signal) {
  if (USE_MOCK_DATA) return generateMockAssets();
  const res = await fetch(`${API_BASE_URL}/assets`, { signal });
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

export async function fetchForecast(zone, signal) {
  if (USE_MOCK_DATA) return generateMockForecast(zone);
  const res = await fetch(`${API_BASE_URL}/forecast/${zone}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return data.points.map((p, i) => ({ ...p, hour: i }));
}

export async function fetchRisk(zone, signal) {
  if (USE_MOCK_DATA) return generateMockRisk(zone);
  const res = await fetch(`${API_BASE_URL}/risk/${zone}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch risk");
  return res.json();
}

export async function fetchShedSchedule(zone, signal) {
  if (USE_MOCK_DATA) return generateMockShedSchedule(zone);
  const res = await fetch(`${API_BASE_URL}/shed-schedule/${zone}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch shed schedule");
  return res.json();
}
