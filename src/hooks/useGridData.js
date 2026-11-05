import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  fetchAssets,
  fetchForecast,
  fetchHealth,
  fetchRisk,
  fetchShedSchedule,
  fetchValidation,
} from "../api/client.js";

const HEALTH_POLL_MS = 300_000;

export function useGridData() {
  const [assets, setAssets] = useState([]);
  const [selectedZone, setSelectedZone] = useState("ES");
  const [forecast, setForecast] = useState([]);
  const [forecastMeta, setForecastMeta] = useState(null);
  const [risk, setRisk] = useState(null);
  const [shedSchedule, setShedSchedule] = useState([]);
  const [errors, setErrors] = useState({ assets: null, detail: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  // The report is generated offline and only changes on redeploy, so it loads
  // once instead of riding the 60s poll. Kept as one object so the panel and
  // its status can never disagree.
  const [validation, setValidation] = useState({ state: "loading", report: null });
  const [health, setHealth] = useState(null);
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

  const loadZoneDetail = useCallback(async (zone, { background = false } = {}) => {
    detailController.current?.abort();
    const controller = new AbortController();
    const requestId = ++detailRequestId.current;
    detailController.current = controller;
    // Background refreshes keep the current panels visible until new data lands.
    if (!background) {
      setForecast([]);
      setForecastMeta(null);
      setRisk(null);
      setShedSchedule([]);
      setErrors((current) => ({ ...current, detail: null }));
    }
    try {
      const [{ points: f, meta: fm }, r, s] = await Promise.all([
        fetchForecast(zone, controller.signal),
        fetchRisk(zone, controller.signal),
        fetchShedSchedule(zone, controller.signal),
      ]);
      if (controller.signal.aborted || requestId !== detailRequestId.current) return;
      setForecast(f);
      setForecastMeta(fm);
      setRisk(r);
      setShedSchedule(s);
      setErrors((current) => ({ ...current, detail: null }));
      setLastUpdated(new Date());
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
    const controller = new AbortController();
    fetchValidation(controller.signal)
      .then((report) =>
        setValidation(
          report ? { state: "ok", report } : { state: "missing", report: null }
        )
      )
      .catch(() => {
        if (!controller.signal.aborted) setValidation({ state: "error", report: null });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      controller = new AbortController();
      fetchHealth(controller.signal)
        .then(setHealth)
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, HEALTH_POLL_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    loadZoneDetail(selectedZone);
    const timer = setInterval(() => loadZoneDetail(selectedZone, { background: true }), 60_000);
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
    health,
    selectedZone,
    setSelectedZone,
    forecast,
    forecastMeta,
    risk,
    shedSchedule,
    error: errors.assets || errors.detail,
    systemAvgRisk,
    criticalCount,
    lastUpdated,
    validation,
  };
}
