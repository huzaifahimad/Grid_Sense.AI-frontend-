import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  const [errors, setErrors] = useState({ assets: null, detail: null });
  const assetsController = useRef(null);
  const detailController = useRef(null);
  const detailRequestId = useRef(0);

  const loadAssets = useCallback(async () => {
    assetsController.current?.abort();
    const controller = new AbortController();
    assetsController.current = controller;
    try {
      setAssets(await fetchAssets(controller.signal));
      setErrors((current) => ({ ...current, assets: null }));
    } catch (e) {
      if (!controller.signal.aborted) {
        setErrors((current) => ({ ...current, assets: e.message }));
      }
    }
  }, []);

  const loadZoneDetail = useCallback(async (zone) => {
    detailController.current?.abort();
    const controller = new AbortController();
    const requestId = ++detailRequestId.current;
    detailController.current = controller;
    setForecast([]);
    setRisk(null);
    setShedSchedule([]);
    setErrors((current) => ({ ...current, detail: null }));
    try {
      const [f, r, s] = await Promise.all([
        fetchForecast(zone, controller.signal),
        fetchRisk(zone, controller.signal),
        fetchShedSchedule(zone, controller.signal),
      ]);
      if (controller.signal.aborted || requestId !== detailRequestId.current) return;
      setForecast(f);
      setRisk(r);
      setShedSchedule(s);
    } catch (e) {
      if (!controller.signal.aborted && requestId === detailRequestId.current) {
        setErrors((current) => ({ ...current, detail: e.message }));
      }
    }
  }, []);

  useEffect(() => {
    loadAssets();
    const timer = setInterval(loadAssets, 60_000);
    return () => {
      clearInterval(timer);
      assetsController.current?.abort();
    };
  }, [loadAssets]);

  useEffect(() => {
    loadZoneDetail(selectedZone);
    const timer = setInterval(() => loadZoneDetail(selectedZone), 60_000);
    return () => {
      clearInterval(timer);
      detailController.current?.abort();
    };
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
    error: errors.assets || errors.detail,
    systemAvgRisk,
    criticalCount,
  };
}
