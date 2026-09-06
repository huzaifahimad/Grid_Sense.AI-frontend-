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
import { ZONE_CHANNEL_COLOR } from "./config/zones.js";
import { FONT_BODY } from "./config/tokens.js";

const GridTopology3D = React.lazy(
  () => import("./three/GridTopology3D.jsx")
);

function TopologySkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-field">
      <div className="text-txt-faint text-xs font-mono tracking-wider animate-pulse">
        LOADING 3D TOPOLOGY…
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-field text-txt-faint text-xs font-mono tracking-wider gap-2 p-6 text-center">
          <div className="text-[22px] text-cyan">⚡</div>
          <div className="text-txt font-bold">3D TOPOLOGY UNAVAILABLE</div>
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

  const selectedChannelColorHex =
    "#" +
    (ZONE_CHANNEL_COLOR[selectedZone] || 0x35d6e8).toString(16).padStart(6, "0");

  return (
    <div
      className="w-full min-h-screen lg:h-screen bg-field text-txt flex flex-col overflow-hidden lg:overflow-hidden"
      style={{ fontFamily: FONT_BODY }}
    >
      <Header criticalCount={criticalCount} systemAvgRisk={systemAvgRisk} />
      <TickRuler />
      <ErrorBanner error={error} />

      {/* Responsive grid: stacks on mobile, 3-column on desktop */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_330px] lg:grid-rows-[1fr_230px] gap-2.5 p-2.5 bg-field overflow-y-auto lg:overflow-hidden auto-rows-min lg:auto-rows-fr">
        {/* Asset table */}
        <div className="lg:row-span-2 min-h-[200px] lg:min-h-0">
          <AssetTable
            sortedAssets={sortedAssets}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />
        </div>

        {/* 3D topology */}
        <div className="min-h-[300px] lg:min-h-0 lg:row-span-1">
          <Panel
            index="02"
            title="Grid Topology"
            accent={0xffd54a}
            noPad
            style={{ height: "100%" }}
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
        </div>

        {/* Risk detail */}
        <div className="lg:row-span-2 min-h-[300px] lg:min-h-0">
          <RiskDetail
            risk={risk}
            shedSchedule={shedSchedule}
            selectedZone={selectedZone}
          />
        </div>

        {/* Forecast chart */}
        <div className="lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 min-h-[230px] lg:min-h-0">
          <ForecastChart forecast={forecast} selectedZone={selectedZone} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
