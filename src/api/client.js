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

/**
 * Where each input feed actually reaches. Returned raw because the payload is a
 * provenance report, not model output — the rail labels the fields verbatim.
 * Null under mocks, and on any backend that does not answer /health, so the
 * dashboard reports "currency unconfirmed" instead of guessing.
 */
export async function fetchHealth(signal) {
  if (USE_MOCK_DATA) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    return null;
  }
}

export async function fetchForecast(zone, signal) {
  if (USE_MOCK_DATA) {
    return { points: generateMockForecast(zone), meta: null };
  }
  const res = await fetch(`${API_BASE_URL}/forecast/${zone}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return {
    points: data.points.map((p, i) => ({ ...p, hour: p.step ?? i + 1 })),
    meta: data.served_by
      ? {
          servedBy: data.served_by,
          originTimestamp: data.origin_timestamp,
          originAgeHours: data.origin_age_hours,
          horizonHours: data.horizon_hours,
        }
      : null,
  };
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

/**
 * Closed-loop validation report, or null when the backend has no /validation
 * route (404 = an older deploy, not an outage) or when running on mocks.
 * Callers render "no gate evidence available" instead of raising the banner.
 */
export async function fetchValidation(signal) {
  if (USE_MOCK_DATA) return null;
  const res = await fetch(`${API_BASE_URL}/validation`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch validation report");
  return res.json();
}
