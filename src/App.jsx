import React, { Suspense } from "react";
import { useGridData } from "./hooks/useGridData.js";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { TickRuler } from "./components/TickRuler.jsx";
import { ErrorBanner } from "./components/ErrorBanner.jsx";
import { AssetTable } from "./components/AssetTable.jsx";
import { RiskDetail } from "./components/RiskDetail.jsx";
import { ValidationPanel } from "./components/ValidationPanel.jsx";
import { SignalRail } from "./components/SignalRail.jsx";
import { ForecastChart } from "./components/ForecastChart.jsx";
import { MobileNav } from "./components/MobileNav.jsx";
import { ZoneChips } from "./components/ZoneChips.jsx";
import { Panel } from "./components/Panel.jsx";
import { StatCard } from "./components/StatCard.jsx";
import { Icon } from "./components/Icon.jsx";
import {
  AssetTableSkeleton,
  ChartSkeleton,
  DetailSkeleton,
  StatCardSkeleton,
} from "./components/Skeleton.jsx";
import { ZONE_CHANNEL_COLOR, ZONE_COORDS, ZONE_LABELS } from "./config/zones.js";
import {
  FONT_MONO,
  STAGGER_MS,
  stateColor,
  hexFromChannel,
  statusFromScore,
} from "./config/tokens.js";

const GridTopology3D = React.lazy(() => import("./three/GridTopology3D.jsx"));

function TopologySkeleton() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      role="status"
    >
      <div
        className="w-8 h-8 rounded-pill border-2 border-cyan/20 border-t-cyan animate-spin"
        aria-hidden="true"
      />
      <div
        className="text-txt-muted text-2xs tracking-label uppercase"
        style={{ fontFamily: FONT_MONO }}
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
        <div className="w-full h-full flex flex-col items-center justify-center text-txt-muted text-xs gap-2 p-6 text-center">
          <span className="text-cyan" aria-hidden="true">
            <Icon name="bolt" size={26} strokeWidth={1.4} />
          </span>
          <div className="font-bold text-sm text-txt" style={{ fontFamily: FONT_MONO }}>
            3D TOPOLOGY UNAVAILABLE
          </div>
          <div className="max-w-[36ch]">
            WebGL error. All data panels remain fully functional.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const {
    sortedAssets,
    health,
    selectedZone,
    setSelectedZone,
    forecast,
    forecastMeta,
    risk,
    shedSchedule,
    error,
    systemAvgRisk,
    criticalCount,
    lastUpdated,
    validation,
  } = useGridData();

  // Below the lg breakpoint the two-column stage has already collapsed to one
  // column, so the phone gets its own reading order instead of the desktop's.
  const isPhone = useMediaQuery("(max-width: 1023px)");

  const selectedAsset = sortedAssets.find((a) => a.zone === selectedZone);
  const selectedChannelHex = hexFromChannel(ZONE_CHANNEL_COLOR[selectedZone]);
  const selectedZoneLabel = ZONE_LABELS[selectedZone];

  const elevatedCount = sortedAssets.filter((a) => a.status === "elevated").length;
  const safeCount = sortedAssets.filter((a) => a.status === "normal").length;

  const loadingAssets = sortedAssets.length === 0;
  const loadingDetail = forecast.length === 0;

  // The forecast plot is the only real series available for a KPI sparkline, so
  // it is captioned as P50 load rather than implied to be risk history.
  const loadTrajectory = forecast.map((p) => p.p50).filter((v) => Number.isFinite(v));

  const kpiStrip = (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
      {loadingAssets ? (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <div className="col-span-2 lg:col-span-1">
            <StatCardSkeleton />
          </div>
        </>
      ) : (
        <>
          <StatCard
            label="System Risk Average"
            value={`${(systemAvgRisk * 100).toFixed(0)}%`}
            subtext={
              systemAvgRisk >= 0.6
                ? "Above comfort threshold"
                : "Within normal range"
            }
            accent={stateColor(statusFromScore(systemAvgRisk))}
            icon="gauge"
            trend={systemAvgRisk >= 0.6 ? "ELEVATED" : "STABLE"}
            trendIcon={systemAvgRisk >= 0.6 ? "arrowUp" : "check"}
            delay={0}
          />
          <StatCard
            label="Critical Zones"
            value={criticalCount.toString()}
            subtext={`${safeCount} normal · ${elevatedCount} elevated · ${criticalCount} crit`}
            accent={criticalCount > 0 ? "var(--color-critical)" : "var(--color-safe)"}
            icon={criticalCount > 0 ? "alert" : "shield"}
            trend={criticalCount > 0 ? "ACTION NEEDED" : "ALL CLEAR"}
            trendIcon={criticalCount > 0 ? "bolt" : "check"}
            delay={STAGGER_MS}
          />
          <div className="col-span-2 lg:col-span-1">
            <StatCard
              label="Selected Zone"
              value={selectedZone.replace("_", "-")}
              subtext={selectedZoneLabel}
              accent={selectedChannelHex}
              icon="target"
              trend={
                selectedAsset
                  ? `${(selectedAsset.risk_score * 100).toFixed(0)}% RISK`
                  : "LOADING"
              }
              trendIcon="activity"
              spark={loadTrajectory}
              sparkLabel={loadTrajectory.length > 1 ? "P50 LOAD 24H" : undefined}
              delay={STAGGER_MS * 2}
            />
          </div>
        </>
      )}
    </div>
  );

  const feedRail = (
    <SignalRail
      health={health}
      forecastMeta={forecastMeta}
      risk={risk}
      delay={STAGGER_MS * 2}
    />
  );

  const topologyPanel = (
    <Panel
      index={isPhone ? "03" : "02"}
      title="Live Grid Topology"
      accent={selectedChannelHex}
      noPad
      delay={STAGGER_MS * 3}
      meta={
        <span className="flex items-center gap-1.5 text-txt-muted tracking-label">
          <Icon name="refresh" size={12} />
          <span className="hidden sm:inline">DRAG TO ORBIT</span>
          <span className="sm:hidden">DRAG</span>
          <span className="hidden lg:inline">· SCROLL TO ZOOM</span>
        </span>
      }
      className="h-[280px] sm:h-[340px] lg:h-[clamp(360px,46vh,560px)] shrink-0"
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
  );

  const forecastPanel = (
    <div className="min-h-[340px] flex-1 lg:min-h-[400px]">
      {loadingDetail ? (
        <ChartSkeleton zone={selectedZone} index={isPhone ? "02" : "04"} />
      ) : (
        <ForecastChart
          forecast={forecast}
          forecastMeta={forecastMeta}
          selectedZone={selectedZone}
          delay={STAGGER_MS * 4}
          index={isPhone ? "02" : "04"}
        />
      )}
    </div>
  );

  const validationPanel = (
    <div className="min-h-[300px] shrink-0">
      <ValidationPanel validation={validation} delay={STAGGER_MS * 5} />
    </div>
  );

  const assetPanel = (
    <div className="min-h-[260px] shrink-0">
      {loadingAssets ? (
        <AssetTableSkeleton index={isPhone ? "04" : "01"} />
      ) : (
        <AssetTable
          sortedAssets={sortedAssets}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          safeCount={safeCount}
          elevatedCount={elevatedCount}
          criticalCount={criticalCount}
          location={ZONE_COORDS[selectedZone]}
          index={isPhone ? "04" : "01"}
        />
      )}
    </div>
  );

  const detailPanel = (
    <div className="min-h-[320px] flex-1">
      {loadingDetail ? (
        <DetailSkeleton
          index={isPhone ? "01" : "03"}
          title={`Zone Inspector — ${selectedZone.replace("_", "-")}`}
          accent={selectedChannelHex}
          lines={7}
        />
      ) : (
        <RiskDetail
          risk={risk}
          shedSchedule={shedSchedule}
          selectedZone={selectedZone}
          delay={STAGGER_MS}
          index={isPhone ? "01" : "03"}
        />
      )}
    </div>
  );

  return (
    <div
      className="gs-root w-full min-h-dvh bg-field text-txt flex flex-col overflow-x-clip max-lg:pb-[calc(74px+env(safe-area-inset-bottom))]"
    >
      <a href="#dashboard" className="skip-link">
        Skip to dashboard
      </a>
      <Header
        criticalCount={criticalCount}
        systemAvgRisk={systemAvgRisk}
        lastUpdated={lastUpdated}
        assetCount={sortedAssets.length}
      />
      <TickRuler />
      <ErrorBanner error={error} />

      <main
        id="dashboard"
        aria-label="Grid risk dashboard"
        className="flex-1 min-h-0 p-3 sm:p-4 max-lg:overflow-visible lg:overflow-y-auto"
      >
        {isPhone ? (
          <div className="flex flex-col gap-3 min-w-0">
            <ZoneChips
              sortedAssets={sortedAssets}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
            />
            {kpiStrip}
            <div id="m-risk" className="scroll-mt-[88px] min-w-0">
              {detailPanel}
            </div>
            <div id="m-load" className="scroll-mt-[88px] min-w-0">
              {forecastPanel}
            </div>
            <div id="m-feeds" className="scroll-mt-[88px] min-w-0">
              {feedRail}
            </div>
            <div
              id="m-grid"
              className="scroll-mt-[88px] min-w-0 flex flex-col gap-3"
            >
              {topologyPanel}
              {assetPanel}
            </div>
            {validationPanel}
          </div>
        ) : (
          <div className="min-h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-3 sm:gap-4">
            {/* LEFT STAGE — visualization + KPIs */}
            <section aria-label="System overview" className="min-w-0 min-h-0 flex flex-col gap-3 sm:gap-4">
              {kpiStrip}
              {feedRail}
              {topologyPanel}
              {forecastPanel}
              {/* Validation closes the left stage so both columns end together */}
              {validationPanel}
            </section>

            {/* RIGHT INSPECTOR — assets + detail */}
            <aside aria-label="Zone inspector" className="min-w-0 min-h-0 flex flex-col gap-3 sm:gap-4">
              {assetPanel}
              {detailPanel}
            </aside>
          </div>
        )}
      </main>

      <Footer />
      {isPhone && <MobileNav />}
    </div>
  );
}
