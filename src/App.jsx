import React, { Suspense } from "react";
import { useGridData } from "./hooks/useGridData.js";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { TickRuler } from "./components/TickRuler.jsx";
import { ErrorBanner } from "./components/ErrorBanner.jsx";
import { AssetTable } from "./components/AssetTable.jsx";
import { RiskDetail } from "./components/RiskDetail.jsx";
import { ForecastChart } from "./components/ForecastChart.jsx";
import { Panel } from "./components/Panel.jsx";
import { StatCard } from "./components/StatCard.jsx";
import { ZONE_CHANNEL_COLOR, ZONE_LABELS } from "./config/zones.js";
import { FONT_BODY, stateColor, hexFromChannel, statusFromScore } from "./config/tokens.js";

const GridTopology3D = React.lazy(() => import("./three/GridTopology3D.jsx"));

function TopologySkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
      <div
        className="text-txt-faint text-[10px] tracking-[0.14em] uppercase font-mono"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Initializing 3D topology…
      </div>
    </div>
  );
}

class TopologyErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-txt-faint text-xs font-mono tracking-wider gap-2 p-6 text-center">
          <div className="text-[26px] text-cyan">⚡</div>
          <div className="text-txt font-bold text-sm">3D TOPOLOGY UNAVAILABLE</div>
          <div>WebGL error. All data panels remain fully functional.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const {
    sortedAssets,
    selectedZone,
    setSelectedZone,
    forecast,
    risk,
    shedSchedule,
    error,
    systemAvgRisk,
    criticalCount,
  } = useGridData();

  const selectedAsset = sortedAssets.find((a) => a.zone === selectedZone);
  const selectedChannelHex = hexFromChannel(ZONE_CHANNEL_COLOR[selectedZone]);
  const selectedZoneLabel = ZONE_LABELS[selectedZone];

  const elevatedCount = sortedAssets.filter((a) => a.status === "elevated").length;
  const safeCount = sortedAssets.filter((a) => a.status === "normal").length;

  return (
    <div
      className="gs-root w-full min-h-screen bg-field text-txt flex flex-col overflow-x-hidden"
      style={{ fontFamily: FONT_BODY }}
    >
      <Header criticalCount={criticalCount} systemAvgRisk={systemAvgRisk} />
      <TickRuler />
      <ErrorBanner error={error} />

      <main className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto">
        <div className="min-h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-3 sm:gap-4">
          {/* LEFT STAGE — visualization + KPIs */}
          <section className="min-w-0 min-h-0 flex flex-col gap-3 sm:gap-4">
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 shrink-0">
              <StatCard
                label="System Risk Average"
                value={`${(systemAvgRisk * 100).toFixed(0)}%`}
                subtext={systemAvgRisk >= 0.6 ? "Above comfort threshold" : "Within normal range"}
                accent={stateColor(statusFromScore(systemAvgRisk))}
                icon="◈"
                trend={systemAvgRisk >= 0.6 ? "▲ ELEVATED" : "● STABLE"}
              />
              <StatCard
                label="Critical Zones"
                value={criticalCount.toString()}
                subtext={`of ${sortedAssets.length} monitored interconnections`}
                accent={criticalCount > 0 ? "var(--color-critical)" : "var(--color-safe)"}
                icon="◉"
                trend={criticalCount > 0 ? "▲ ACTION NEEDED" : "● ALL CLEAR"}
              />
              <StatCard
                label="Selected Zone"
                value={selectedZone.replace("_", "-")}
                subtext={selectedZoneLabel}
                accent={selectedChannelHex}
                icon="◎"
                trend={selectedAsset ? `${(selectedAsset.risk_score * 100).toFixed(0)}% RISK` : "LOADING"}
              />
            </div>

            {/* 3D topology */}
            <Panel
              index="02"
              title="Live Grid Topology"
              accent={selectedChannelHex}
              noPad
              className="flex-[1.35] min-h-[360px]"
            >
              <TopologyErrorBoundary>
                <Suspense fallback={<TopologySkeleton />}>
                  <GridTopology3D
                    assets={sortedAssets}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                  />
                </Suspense>
              </TopologyErrorBoundary>
            </Panel>

            {/* Forecast */}
            <div className="shrink-0 h-[180px] sm:h-[200px]">
              <ForecastChart forecast={forecast} selectedZone={selectedZone} />
            </div>
          </section>

          {/* RIGHT INSPECTOR — assets + detail */}
          <aside className="min-w-0 min-h-0 flex flex-col gap-3 sm:gap-4">
            <div className="flex-1 min-h-[260px] lg:min-h-0">
              <AssetTable
                sortedAssets={sortedAssets}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                safeCount={safeCount}
                elevatedCount={elevatedCount}
                criticalCount={criticalCount}
              />
            </div>
            <div className="flex-[1.35] min-h-[320px] lg:min-h-0">
              <RiskDetail
                risk={risk}
                shedSchedule={shedSchedule}
                selectedZone={selectedZone}
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
