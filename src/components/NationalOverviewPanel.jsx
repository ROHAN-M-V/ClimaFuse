import React, { useState } from 'react';

/**
 * NationalOverviewPanel
 *
 * Subcontinental Meteorological Telemetry & All-India IMD Warning Command Center.
 * Displayed on the right workstation dock when no individual city station is selected.
 *
 * Features:
 * 1. Subcontinental synoptic mesh status & EPS blend reliability.
 * 2. Multi-layer atmospheric telemetry breakdown (Thermal, Precipitation, Heat Index)
 *    with interactive layer activation on the MapLibre map.
 * 3. All-India IMD Warning Bulletins & Alert Tier breakdown across the reference stations.
 * 4. Interactive station cards that seamlessly switch to detailed station telemetry on click.
 */

// Synoptic summary metrics for the three atmospheric map layers
const LAYER_METRICS = {
  temperature: {
    id: 'temperature',
    title: 'Subcontinental Thermal',
    label: 'Thermal',
    icon: 'thermostat',
    unit: '°C',
    mean: '28.4°C',
    peak: { val: '36.8°C', location: 'Jaisalmer (Thar)' },
    min: { val: '11.2°C', location: 'Leh (Ladakh)' },
    gradient: 'Strong diurnal flux (+18.4°C swing) in NW arid zone; maritime stability along peninsular coastline.',
    highlights: [
      { label: 'Thar & Kutch Basin', val: '34°–37°C', status: 'Elevated' },
      { label: 'Indo-Gangetic Plain', val: '27°–31°C', status: 'Seasonal' },
      { label: 'Himalayan Arc', val: '11°–18°C', status: 'Cold Sink' },
    ],
    gradientCss: 'from-blue-500 via-emerald-400 via-yellow-400 via-orange-500 to-red-500',
    scaleMin: '10°C',
    scaleMax: '40°C+',
  },
  rainfall: {
    id: 'rainfall',
    title: '24-Hour Precipitation Inflow',
    label: 'Precipitation',
    icon: 'rainy',
    unit: 'mm',
    mean: '34.2 mm',
    peak: { val: '165.0 mm', location: 'Cherrapunji (Khasi Hills)' },
    min: { val: '0.0 mm', location: 'Thar Core Basin' },
    gradient: 'Intense orographic lifting along Western Ghats escarpment & Bay of Bengal moisture corridor in Northeast.',
    highlights: [
      { label: 'Konkan Escarpment', val: '88–115 mm', status: 'Squall / Red' },
      { label: 'Meghalaya Plateau', val: '110–165 mm', status: 'Heavy Inflow' },
      { label: 'Deccan Rainshadow', val: '<2.0 mm', status: 'Dry Deficit' },
    ],
    gradientCss: 'from-sky-400 via-blue-600 to-indigo-700',
    scaleMin: '0 mm',
    scaleMax: '120+ mm',
  },
  heatmap: {
    id: 'heatmap',
    title: 'Biometeorological Heat Index',
    label: 'Heat Index',
    icon: 'whatshot',
    unit: '°C HI',
    mean: '33.1°C',
    peak: { val: '41.2°C', location: 'Mumbai Coastal Strip' },
    min: { val: '11.0°C', location: 'Leh High Altitude' },
    gradient: 'Extreme caution threshold exceeded in humid littoral zones due to high dew points (>25°C) trapping heat.',
    highlights: [
      { label: 'Mumbai & Konkan', val: '41.2°C HI', status: 'Ext. Caution' },
      { label: 'Chennai Coast', val: '39.8°C HI', status: 'Caution' },
      { label: 'Deccan Uplands', val: '23°–28°C HI', status: 'Comfortable' },
    ],
    gradientCss: 'from-emerald-500 via-yellow-400 via-orange-500 via-red-500 to-purple-600',
    scaleMin: '20°C Normal',
    scaleMax: '48°C Danger',
  },
};

export default function NationalOverviewPanel({
  cities = [],
  onSelectCity,
  activeOverlay = 'temperature',
  onOverlayChange,
}) {
  const [alertFilter, setAlertFilter] = useState('all'); // 'all', 'severe', 'watch', 'nominal'

  // Derive active metric directly from the map HUD selection
  const activeMetricKey = activeOverlay === 'default' ? 'temperature' : activeOverlay;
  const currentMetric = LAYER_METRICS[activeMetricKey] || LAYER_METRICS.temperature;

  // IMD Alert distribution counts
  const alertCounts = {
    red: cities.filter((c) => c.alertTier === 'Red').length,
    orange: cities.filter((c) => c.alertTier === 'Orange').length,
    yellow: cities.filter((c) => c.alertTier === 'Yellow').length,
    green: cities.filter((c) => c.alertTier === 'Green').length,
  };

  // Filter cities by alert severity
  const filteredCities = cities.filter((city) => {
    if (alertFilter === 'severe') return city.alertTier === 'Red' || city.alertTier === 'Orange';
    if (alertFilter === 'watch') return city.alertTier === 'Yellow';
    if (alertFilter === 'nominal') return city.alertTier === 'Green';
    return true; // 'all'
  });

  return (
    <aside
      className="w-full lg:w-[420px] h-full flex flex-col rounded-2xl bg-[#121212]/95 backdrop-blur-2xl border border-[#262626] p-3.5 lg:p-4 shadow-2xl overflow-hidden space-y-2.5"
      aria-label="All-India Meteorological Overview & Warnings"
    >
      {/* 1. Subcontinental Mesh Header */}
      <div className="pb-2 border-b border-[#262626]/60 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold text-white tracking-tight">
                All-India Synoptic Mesh
              </h2>
            </div>
            <p className="font-sans text-[11px] text-[#8e9192] mt-0.5 flex items-center gap-1.5">
              <span>842 IMD AWS Stations</span>
              <span className="text-[#444748] font-mono">·</span>
              <span className="font-mono text-[#4edea3]">0.05° EPS VERONA</span>
            </p>
          </div>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#1b2a22] border border-[#4edea3]/30 text-[#4edea3] font-semibold">
            LIVE MESH
          </span>
        </div>

        {/* Synoptic Model Blend Status */}
        <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#8e9192]">AI-NWP Consensus Blend</span>
          <span className="text-white font-semibold flex items-center gap-1">
            <span className="text-[#4edea3]">96.4%</span>
            <span className="text-[#8e9192] text-[9px]">Reliability</span>
          </span>
        </div>
      </div>

      {/* 2. Active Atmospheric Telemetry (Controlled exclusively via Map HUD) */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-mono text-[10px] text-[#8e9192] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px] text-[#4edea3]">{currentMetric.icon}</span>
            <span>Subcontinental {currentMetric.label} Telemetry</span>
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#181818] border border-[#262626] text-[#4edea3] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
            <span>Map Synced</span>
          </span>
        </div>

        {/* Selected Layer Telemetry Card */}
        <div className="p-2.5 rounded-xl bg-[#181818] border border-[#262626] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#262626]/50 pb-1">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-white">
                  {currentMetric.mean}
                </span>
                <span className="text-[10px] text-[#a3a3a3] font-mono">National Mean</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 font-mono text-[11px]">
                <span className="text-[#8e9192] text-[9px]">Peak:</span>
                <span className="font-bold text-[#f97316]">{currentMetric.peak.val}</span>
              </div>
              <span className="font-mono text-[9px] text-[#8e9192] block truncate max-w-[150px]">
                {currentMetric.peak.location}
              </span>
            </div>
          </div>

          {/* Regional Microclimate Highlights */}
          <div className="grid grid-cols-3 gap-1 text-center font-mono">
            {currentMetric.highlights.map((h, i) => (
              <div key={i} className="p-1 rounded-md bg-[#201f1f] border border-[#262626]">
                <span className="text-[8.5px] text-[#8e9192] block truncate">{h.label}</span>
                <span className="text-[11px] font-bold text-white block mt-0.5">{h.val}</span>
                <span className="text-[8.5px] text-[#4edea3] block">{h.status}</span>
              </div>
            ))}
          </div>

          {/* Layer Gradient Scale Bar */}
          <div className="pt-0.5">
            <div className="flex justify-between items-center text-[9px] font-mono text-[#8e9192] mb-0.5">
              <span>{currentMetric.scaleMin}</span>
              <span className="text-[#a3a3a3]">{currentMetric.label} Gradient</span>
              <span>{currentMetric.scaleMax}</span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full bg-gradient-to-r ${currentMetric.gradientCss} border border-white/20`}
            />
          </div>
        </div>
      </div>

      {/* 3. All-India IMD Warning Bulletins & City Alert Tiers */}
      <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#f97316]">warning</span>
            <span className="font-mono text-[10px] text-[#8e9192] uppercase tracking-wider font-semibold">
              IMD Bulletins ({cities.length} Stations)
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
            {alertCounts.red + alertCounts.orange} SEVERE
          </span>
        </div>

        {/* Severity Distribution Pills */}
        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] shrink-0">
          <div
            onClick={() => setAlertFilter(alertFilter === 'severe' ? 'all' : 'severe')}
            className={`p-1 rounded-lg border cursor-pointer transition-all ${
              alertFilter === 'severe'
                ? 'bg-[#ef4444]/25 border-[#ef4444] text-white shadow-sm'
                : 'bg-[#181818] border-[#ef4444]/40 text-[#ef4444] hover:bg-[#201515]'
            }`}
          >
            <span className="font-bold block text-[10px]">{alertCounts.red} RED</span>
            <span className="text-[8.5px] text-[#8e9192]">Warning</span>
          </div>

          <div
            onClick={() => setAlertFilter(alertFilter === 'severe' ? 'all' : 'severe')}
            className={`p-1 rounded-lg border cursor-pointer transition-all ${
              alertFilter === 'severe'
                ? 'bg-[#f97316]/25 border-[#f97316] text-white shadow-sm'
                : 'bg-[#181818] border-[#f97316]/40 text-[#f97316] hover:bg-[#221810]'
            }`}
          >
            <span className="font-bold block text-[10px]">{alertCounts.orange} ORANGE</span>
            <span className="text-[8.5px] text-[#8e9192]">Alert</span>
          </div>

          <div
            onClick={() => setAlertFilter(alertFilter === 'watch' ? 'all' : 'watch')}
            className={`p-1 rounded-lg border cursor-pointer transition-all ${
              alertFilter === 'watch'
                ? 'bg-[#fbbf24]/25 border-[#fbbf24] text-white shadow-sm'
                : 'bg-[#181818] border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#201d12]'
            }`}
          >
            <span className="font-bold block text-[10px]">{alertCounts.yellow} YELLOW</span>
            <span className="text-[8.5px] text-[#8e9192]">Watch</span>
          </div>

          <div
            onClick={() => setAlertFilter(alertFilter === 'nominal' ? 'all' : 'nominal')}
            className={`p-1 rounded-lg border cursor-pointer transition-all ${
              alertFilter === 'nominal'
                ? 'bg-[#10b981]/25 border-[#10b981] text-white shadow-sm'
                : 'bg-[#181818] border-[#10b981]/40 text-[#10b981] hover:bg-[#122018]'
            }`}
          >
            <span className="font-bold block text-[10px]">{alertCounts.green} GREEN</span>
            <span className="text-[8.5px] text-[#8e9192]">Normal</span>
          </div>
        </div>

        {/* Filter Reset / Count Row */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#8e9192] px-1 shrink-0">
          <span>
            Showing <strong className="text-white">{filteredCities.length}</strong> stations (5 in view)
          </span>
          {alertFilter !== 'all' && (
            <button
              onClick={() => setAlertFilter('all')}
              className="text-[#4edea3] hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Interactive Clickable City Warning Cards List — Fits 5 stations simultaneously */}
        <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#262626]">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              onClick={() => onSelectCity && onSelectCity(city)}
              className="group p-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-white/40 transition-all cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between"
              style={{ minHeight: '56px' }}
              title={`Click to open full station telemetry for ${city.name}`}
            >
              {/* Left Color Severity Pip Strip */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: city.alertColor }}
              />

              {/* Station Card Row 1: Name, AWS, State, Icon, Temp */}
              <div className="flex items-center justify-between pl-1.5">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: city.alertColor,
                      animation:
                        city.alertTier === 'Red' || city.alertTier === 'Orange'
                          ? 'pulse 1.8s infinite'
                          : 'none',
                    }}
                  />
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-white group-hover:text-[#4edea3] transition-colors truncate">
                    {city.name}
                  </span>
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[#252525] text-[#8e9192] shrink-0">
                    {city.awsId}
                  </span>
                  <span className="font-sans text-[10px] text-[#8e9192] truncate hidden sm:inline">
                    · {city.state.split(' ')[0]}
                  </span>
                </div>

                {/* Temp & Icon */}
                <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                  <span className="material-symbols-outlined text-[14px] text-white">
                    {city.icon}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {city.temp}°C
                  </span>
                  <span className="font-mono text-[9px] text-[#8e9192]">
                    {city.delta.split(' ')[1]}
                  </span>
                </div>
              </div>

              {/* Station Card Row 2: Alert Tier, Description snippet, Telemetry arrow */}
              <div className="flex items-center justify-between pl-1.5 pt-1 border-t border-[#262626]/30 mt-1">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span
                    className="font-mono text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded shrink-0"
                    style={{
                      backgroundColor: `${city.alertColor}20`,
                      color: city.alertColor,
                    }}
                  >
                    {city.alertTier}
                  </span>
                  <span className="font-sans text-[10px] text-[#d4d4d4] truncate block">
                    {city.alertDesc}
                  </span>
                </div>

                <div className="shrink-0 flex items-center text-[#8e9192] group-hover:text-white group-hover:translate-x-0.5 transition-all font-mono text-[9px]">
                  <span>View</span>
                  <span className="material-symbols-outlined text-[11px] ml-0.5">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Information & Action Bar */}
      <div className="pt-1.5 border-t border-[#262626]/60 shrink-0">
        <div className="p-2 rounded-xl bg-[#181818]/60 border border-[#262626]/40 flex items-center justify-between text-[10px] font-mono text-[#8e9192]">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px] text-[#4edea3]">touch_app</span>
            <span>Click any station or map node for radiosonde</span>
          </span>
          <span className="text-[#a3a3a3]">10 Cities Active</span>
        </div>
      </div>
    </aside>
  );
}
