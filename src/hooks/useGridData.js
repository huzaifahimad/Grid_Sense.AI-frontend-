import { useState, useCallback, useEffect, useMemo } from "react";
import {
  fetchAssets,
  fetchForecast,
  fetchRisk,
  fetchShedSchedule,
} from "../api/client.js";

export function useGridData() {
  const [assets, setAssets] = useState([]);
  const [selectedZone, setSelectedZone] = useState("ES");
  const [forecast, setForecast] = useState([]);
  const [risk, setRisk] = useState(null);
  const [shedSchedule, setShedSchedule] = useState([]);
  const [error, setError] = useState(null);

  const loadAssets = useCallback(async () => {
    try {
      setAssets(await fetchAssets());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadZoneDetail = useCallback(async (zone) => {
    try {
      const [f, r, s] = await Promise.all([
        fetchForecast(zone),
        fetchRisk(zone),
        fetchShedSchedule(zone),
      ]);
      setForecast(f);
      setRisk(r);
      setShedSchedule(s);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    loadZoneDetail(selectedZone);
  }, [selectedZone, loadZoneDetail]);

  const sortedAssets = useMemo(
    () => [...assets].sort((a, b) => b.risk_score - a.risk_score),
    [assets]
  );

  const systemAvgRisk = useMemo(
    () =>
      assets.length
        ? assets.reduce((s, a) => s + a.risk_score, 0) / assets.length
        : 0,
    [assets]
  );

  const criticalCount = useMemo(
    () => assets.filter((a) => a.status === "critical").length,
    [assets]
  );

  return {
    assets,
    sortedAssets,
    selectedZone,
    setSelectedZone,
    forecast,
    risk,
    shedSchedule,
    error,
    systemAvgRisk,
    criticalCount,
  };
}
