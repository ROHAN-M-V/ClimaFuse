import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardNavDock from '../components/DashboardNavDock';
import StationTopBar from '../components/StationTopBar';
import StationSummaryBanner from '../components/StationSummaryBanner';
import StationParameterGrid from '../components/StationParameterGrid';
import StationCharts from '../components/StationCharts';
import StationReasoningAndScorecard from '../components/StationReasoningAndScorecard';
import StationRadiosonde from '../components/StationRadiosonde';
import { getStationAnalysis, exportStationCSV } from '../api/stationAnalysisData';

export default function StationAnalysisPage() {
  const { cityId } = useParams();
  const station = getStationAnalysis(cityId);
  const [activeView, setActiveView] = useState('all'); // 'all', 'charts', 'radiosonde'
  const [forecastCycle, setForecastCycle] = useState('Operational Forecast');

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] antialiased min-h-screen selection:bg-[#2a2a2a] selection:text-white font-sans flex flex-col">
      {/* ────────────────────────────────────────────────────────── */}
      {/* FLOATING VERTICAL ICON-ONLY DOCK (Matches Stitch Design)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <DashboardNavDock activeTab="station" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP HORIZONTAL UTILITY BAR                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <StationTopBar
        station={station}
        currentCycle={forecastCycle}
        onCycleChange={(cycle) => setForecastCycle(cycle)}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT CONTAINER                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="pl-16 sm:pl-20 lg:pl-24 pr-4 sm:pr-6 lg:pr-8 py-6 max-w-[1680px] w-full mx-auto space-y-6 flex-1">
        {/* 1. Page Header & Station Summary Banner */}
        <StationSummaryBanner station={station} />

        {/* 2. Parameter Summary Row (5 Cards) */}
        <StationParameterGrid summaryCards={station.summaryCards} />

        {/* 3. Section Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="inline-flex p-1 rounded-xl bg-[#121212] border border-[#262626] text-xs font-mono">
            <button
              onClick={() => setActiveView('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'all'
                  ? 'bg-[#252525] text-white font-semibold shadow-sm'
                  : 'text-[#8e9192] hover:text-white'
              }`}
            >
              All Station Analytics
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'charts'
                  ? 'bg-[#252525] text-white font-semibold shadow-sm'
                  : 'text-[#8e9192] hover:text-white'
              }`}
            >
              Synoptic Timeseries &amp; Hyetograph
            </button>
            <button
              onClick={() => setActiveView('radiosonde')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'radiosonde'
                  ? 'bg-[#252525] text-white font-semibold shadow-sm'
                  : 'text-[#8e9192] hover:text-white'
              }`}
            >
              Radiosonde Sounding
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#8e9192]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Station ID: <strong className="text-white">{station.wmoId}</strong></span>
            <span className="text-[#383838]">·</span>
            <span>Ground Truth AWS: <strong className="text-[#4edea3]">Calibrated</strong></span>
          </div>
        </div>

        {/* 4. Timeseries Graphs (Temperature, Heat Index, Precipitation) */}
        {(activeView === 'all' || activeView === 'charts') && (
          <StationCharts station={station} />
        )}

        {/* 5. Radiosonde Sounding Profile */}
        {(activeView === 'all' || activeView === 'radiosonde') && (
          <StationRadiosonde station={station} />
        )}

        {/* 6. Two-Column Bottom Section: Reasoning & Accuracy Scorecard */}
        <StationReasoningAndScorecard station={station} />

        {/* 7. Footer Telemetry Anchor */}
        <footer className="pt-6 pb-12 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8e9192] font-mono gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-white font-medium">ClimaFuse Meteorological Intelligence</span>
            <span>·</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px]">
              Hackathon PoC Demo
            </span>
            <span>·</span>
            <span>IMD {station.name} ({station.awsId}) Telemetry Feed</span>
            <span>·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry Simulation
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Cycle Latency: 142ms</span>
            <span>·</span>
            <span>Data standard: WMO BUFR / NetCDF4</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
