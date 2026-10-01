import React, { useState } from 'react';

export default function StationCharts({ station }) {
  const [activeTempIndex, setActiveTempIndex] = useState(null);
  const [activeHeatIndex, setActiveHeatIndex] = useState(null);
  const [activeRainIndex, setActiveRainIndex] = useState(null);

  if (!station || !station.timeseries) return null;

  const data = station.timeseries;
  const numPoints = data.length;

  // Coordinate scales for Temperature Chart (viewBox: 0 0 1000 240)
  // X range: 50 to 980 (width: 930)
  // Y range: 25 (36°C) to 215 (20°C) (height: 190) -> tempMin: 18, tempMax: 38
  const tempMin = 18;
  const tempMax = 38;
  const getX = (i) => 55 + (i / (numPoints - 1)) * 920;
  const getYTemp = (val) => {
    const clamped = Math.max(tempMin, Math.min(tempMax, val));
    return 215 - ((clamped - tempMin) / (tempMax - tempMin)) * 185;
  };

  // SVG Path builders
  const buildPath = (key) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getYTemp(d[key]).toFixed(1)}`).join(' ');
  };

  // Build confidence band polygon points
  const topPoints = data.map((d, i) => `${getX(i).toFixed(1)},${getYTemp(d.bmaHigh).toFixed(1)}`).join(' ');
  const bottomPoints = [...data].reverse().map((d, i) => {
    const origIdx = numPoints - 1 - i;
    return `${getX(origIdx).toFixed(1)},${getYTemp(d.bmaLow).toFixed(1)}`;
  }).join(' ');
  const confidencePolygon = `${topPoints} ${bottomPoints}`;

  // Peak temperature point for annotation
  const peakPoint = [...data].reduce((max, d, idx) => d.bma > max.val ? { val: d.bma, time: d.time, idx } : max, { val: -99, time: '', idx: 0 });

  // Heat Index Y scale (tempMin: 18, tempMax: 42)
  const hiMin = 18;
  const hiMax = 42;
  const getYHi = (val) => {
    const clamped = Math.max(hiMin, Math.min(hiMax, val));
    return 205 - ((clamped - hiMin) / (hiMax - hiMin)) * 180;
  };
  const buildHiPath = (key) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getYHi(d[key]).toFixed(1)}`).join(' ');
  };
  const yThreshold35 = getYHi(35);

  // Precipitation Max
  const maxRain = Math.max(...data.map(d => Math.max(d.rainBma || 0, d.rainObs || 0, 1.5)));

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* GRAPH SECTION 1 — TEMPERATURE                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-lg transition-shadow">
        {/* Graph Header */}
        <div className="bg-[#f8fafc] text-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-lg">show_chart</span>
            <span className="text-slate-900 font-bold tracking-wide uppercase text-xs font-mono">
              Temperature — ClimaFuse vs Models vs Observed
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Unit: Degrees Celsius (°C) · Level: 2m AGL
          </span>
        </div>

        {/* Interactive Timeseries Plot */}
        <div className="p-4 sm:p-6 space-y-4 bg-white">
          <div
            className="relative w-full h-72 sm:h-80 select-none cursor-crosshair bg-white rounded-lg"
            style={{ minHeight: '288px', height: '288px' }}
            onMouseLeave={() => setActiveTempIndex(null)}
          >
            <svg
              className="w-full h-full bg-white"
              preserveAspectRatio="none"
              viewBox="0 0 1000 240"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (mouseX - 55 * (rect.width / 1000)) / (920 * (rect.width / 1000))));
                const idx = Math.round(ratio * (numPoints - 1));
                setActiveTempIndex(idx);
              }}
            >
              {/* Pure white background screen */}
              <rect width="1000" height="240" fill="#ffffff" />

              <defs>
                <linearGradient id="bmaConfidenceGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[36, 32, 28, 24, 20].map((t) => (
                <g key={t}>
                  <line
                    stroke="#e2e8f0"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                    x1="55"
                    x2="975"
                    y1={getYTemp(t)}
                    y2={getYTemp(t)}
                  />
                  <text
                    fill="#475569"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="end"
                    x="45"
                    y={getYTemp(t) + 3}
                  >
                    {t}°C
                  </text>
                </g>
              ))}
              <line stroke="#cbd5e1" strokeWidth="1.5" x1="55" x2="975" y1="215" y2="215" />

              {/* 90% BMA Confidence Interval Band */}
              <polygon
                fill="url(#bmaConfidenceGrad)"
                stroke="#f59e0b"
                strokeWidth="0.5"
                strokeOpacity="0.35"
                points={confidencePolygon}
              />

              {/* NWP Physics Model (ECMWF IFS) - Royal Blue Dashed */}
              <path
                d={buildPath('ifs')}
                fill="none"
                stroke="#2563eb"
                strokeDasharray="6,4"
                strokeWidth="2"
              />

              {/* AI/ML Model (ECMWF AIFS) - Forest Emerald Dotted */}
              <path
                d={buildPath('aifs')}
                fill="none"
                stroke="#059669"
                strokeDasharray="2,3"
                strokeWidth="2"
              />

              {/* ClimaFuse BMA Mixture Line - Solid Amber */}
              <path
                d={buildPath('bma')}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
              />

              {/* IMD Observed Ground Truth Line - Solid Dark Slate Line with Crisp Nodes */}
              <path
                d={buildPath('obs')}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.2"
              />

              {/* Ground Truth Node Markers */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getYTemp(d.obs)}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              ))}

              {/* Key Diurnal Peak Annotation */}
              <g>
                <line
                  stroke="#d97706"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                  x1={getX(peakPoint.idx)}
                  x2={getX(peakPoint.idx)}
                  y1={getYTemp(peakPoint.val)}
                  y2={22}
                />
                <circle cx={getX(peakPoint.idx)} cy={getYTemp(peakPoint.val)} r="4.5" fill="#d97706" />
                <rect
                  x={Math.max(60, Math.min(840, getX(peakPoint.idx) - 65))}
                  y="8"
                  width="130"
                  height="20"
                  rx="5"
                  fill="#fffbeb"
                  stroke="#d97706"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"
                />
                <text
                  fill="#92400e"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  x={Math.max(125, Math.min(905, getX(peakPoint.idx)))}
                  y="22"
                >
                  {peakPoint.time} · {peakPoint.val}°C Peak
                </text>
              </g>

              {/* Interactive Crosshair Indicator */}
              {activeTempIndex !== null && (
                <g>
                  <line
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    x1={getX(activeTempIndex)}
                    x2={getX(activeTempIndex)}
                    y1="25"
                    y2="215"
                  />
                  <circle cx={getX(activeTempIndex)} cy={getYTemp(data[activeTempIndex].bma)} r="5" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={getX(activeTempIndex)} cy={getYTemp(data[activeTempIndex].obs)} r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}

              {/* X-Axis Labels */}
              {data.filter((_, i) => i % 2 === 0 || i === data.length - 1).map((d, i) => (
                <text
                  key={i}
                  fill={d.time === peakPoint.time ? '#b45309' : '#475569'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight={d.time === peakPoint.time ? '700' : '600'}
                  textAnchor="middle"
                  x={getX(data.indexOf(d))}
                  y="232"
                >
                  {d.time}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activeTempIndex !== null && (
              <div
                className="absolute top-2 pointer-events-none z-30 p-2.5 rounded-xl bg-white/95 border border-slate-300 shadow-2xl backdrop-blur-md font-mono text-[11px] space-y-1 text-slate-800"
                style={{
                  left: `${Math.max(10, Math.min(80, (activeTempIndex / (numPoints - 1)) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-slate-900 font-bold pb-1 border-b border-slate-200 flex justify-between gap-3">
                  <span>Time: {data[activeTempIndex].time} IST</span>
                  <span className="text-slate-500 font-normal">2m AGL</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-900">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> IMD Observed:</span>
                  <span className="font-bold">{data[activeTempIndex].obs}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-amber-800">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ClimaFuse BMA:</span>
                  <span className="font-bold">{data[activeTempIndex].bma}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-500 text-[10px]">
                  <span>90% BMA Interval:</span>
                  <span className="font-medium">{data[activeTempIndex].bmaLow}°C – {data[activeTempIndex].bmaHigh}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-blue-700">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-blue-600"></span> ECMWF IFS:</span>
                  <span className="font-semibold">{data[activeTempIndex].ifs}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-emerald-600"></span> ECMWF AIFS:</span>
                  <span className="font-semibold">{data[activeTempIndex].aifs}°C</span>
                </div>
              </div>
            )}
          </div>

          {/* Legend and Analytical Telemetry Annotation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-200 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Observed */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 bg-slate-900 rounded-full inline-block"></span>
                <span className="text-slate-900 font-bold">IMD Observed (Ground Truth)</span>
              </div>
              {/* ClimaFuse BMA */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 bg-amber-500 rounded-full inline-block"></span>
                <span className="text-amber-800 font-bold">ClimaFuse BMA Mixture</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-[10px] text-amber-800 font-semibold">
                  90% Band
                </span>
              </div>
              {/* ECMWF IFS */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-blue-600 inline-block"></span>
                <span className="text-slate-700 font-medium">ECMWF IFS (Physics)</span>
              </div>
              {/* ECMWF AIFS */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-0.5 border-t-2 border-dotted border-emerald-600 inline-block"></span>
                <span className="text-slate-700 font-medium">ECMWF AIFS (AI/ML)</span>
              </div>
            </div>

            {/* Key Diagnostic Annotation */}
            <div className="text-xs text-slate-800 bg-amber-50/90 px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs">
              <span className="text-amber-900 font-bold">Bias Reduction: </span>
              {station.biasReductionNote.replace(/^Bias Reduction:\s*/, '')}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* GRAPH SECTION 2 — HEAT INDEX                              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-lg transition-shadow">
        <div className="bg-[#f8fafc] text-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-lg">local_fire_department</span>
            <span className="text-slate-900 font-bold tracking-wide uppercase text-xs font-mono">
              Heat Index &amp; Biometeorological Stress
            </span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-mono text-amber-900 font-semibold">
              {station.heatIndexNote}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 bg-white">
          <div
            className="relative w-full h-64 select-none cursor-crosshair bg-white rounded-lg"
            style={{ minHeight: '256px', height: '256px' }}
            onMouseLeave={() => setActiveHeatIndex(null)}
          >
            <svg
              className="w-full h-full bg-white"
              preserveAspectRatio="none"
              viewBox="0 0 1000 220"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (mouseX - 55 * (rect.width / 1000)) / (920 * (rect.width / 1000))));
                const idx = Math.round(ratio * (numPoints - 1));
                setActiveHeatIndex(idx);
              }}
            >
              {/* Pure white background screen */}
              <rect width="1000" height="220" fill="#ffffff" />

              {/* Danger Zone Shaded Background (Above 35°C threshold) */}
              <rect
                x="55"
                y="15"
                width="920"
                height={Math.max(10, yThreshold35 - 15)}
                fill="#fee2e2"
                fillOpacity="0.55"
              />

              {/* 35°C Threshold Line */}
              <line
                stroke="#dc2626"
                strokeDasharray="5,4"
                strokeWidth="1.8"
                x1="55"
                x2="975"
                y1={yThreshold35}
                y2={yThreshold35}
              />
              <text
                fill="#b91c1c"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
                x="970"
                y={yThreshold35 - 6}
              >
                Moderate Heat Stress Threshold: 35.0°C
              </text>

              {/* Standard Gridlines */}
              {[40, 35, 30, 25, 20].map((t) => (
                <g key={t}>
                  <line
                    stroke="#e2e8f0"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                    x1="55"
                    x2="975"
                    y1={getYHi(t)}
                    y2={getYHi(t)}
                  />
                  <text
                    fill={t >= 35 ? '#dc2626' : '#475569'}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight={t >= 35 ? '700' : '600'}
                    textAnchor="end"
                    x="45"
                    y={getYHi(t) + 3}
                  >
                    {t}°C
                  </text>
                </g>
              ))}
              <line stroke="#cbd5e1" strokeWidth="1.5" x1="55" x2="975" y1="205" y2="205" />

              {/* Curves */}
              <path d={buildHiPath('hiIfs')} fill="none" stroke="#2563eb" strokeDasharray="6,4" strokeWidth="2" />
              <path d={buildHiPath('hiAifs')} fill="none" stroke="#059669" strokeDasharray="2,3" strokeWidth="2" />
              <path d={buildHiPath('hiBma')} fill="none" stroke="#d97706" strokeWidth="2.5" />
              <path d={buildHiPath('hiObs')} fill="none" stroke="#0f172a" strokeWidth="2.2" />

              {/* Interactive Crosshair Indicator */}
              {activeHeatIndex !== null && (
                <g>
                  <line
                    stroke="#d97706"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    x1={getX(activeHeatIndex)}
                    x2={getX(activeHeatIndex)}
                    y1="15"
                    y2="205"
                  />
                  <circle cx={getX(activeHeatIndex)} cy={getYHi(data[activeHeatIndex].hiBma)} r="5" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={getX(activeHeatIndex)} cy={getYHi(data[activeHeatIndex].hiObs)} r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}

              {/* X Axis */}
              {data.filter((_, i) => i % 2 === 0 || i === data.length - 1).map((d, i) => (
                <text
                  key={i}
                  fill="#475569"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                  x={getX(data.indexOf(d))}
                  y="218"
                >
                  {d.time}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip Overlay for Heat Index */}
            {activeHeatIndex !== null && (
              <div
                className="absolute top-2 pointer-events-none z-30 p-2.5 rounded-xl bg-white/95 border border-slate-300 shadow-2xl backdrop-blur-md font-mono text-[11px] space-y-1 text-slate-800"
                style={{
                  left: `${Math.max(10, Math.min(80, (activeHeatIndex / (numPoints - 1)) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-slate-900 font-bold pb-1 border-b border-slate-200 flex justify-between gap-3">
                  <span>Heat Index @ {data[activeHeatIndex].time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${data[activeHeatIndex].hiBma >= 35 ? 'text-red-700 bg-red-100 border border-red-300' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'}`}>
                    {data[activeHeatIndex].hiBma >= 35 ? 'Caution Zone' : 'Safe Zone'}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-slate-900">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> Observed Heat Index:</span>
                  <span className="font-bold">{data[activeHeatIndex].hiObs}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-amber-800">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ClimaFuse BMA:</span>
                  <span className="font-bold">{data[activeHeatIndex].hiBma}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-blue-700">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-blue-600"></span> ECMWF IFS:</span>
                  <span className="font-semibold">{data[activeHeatIndex].hiIfs}°C</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-emerald-600"></span> ECMWF AIFS:</span>
                  <span className="font-semibold">{data[activeHeatIndex].hiAifs}°C</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-600 pt-2 border-t border-slate-200 gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-red-700 font-semibold">
                <span className="w-3 h-3 bg-red-100 border border-red-500 inline-block rounded-sm"></span>
                Caution Range (&gt;35°C)
              </span>
              <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                <span className="w-3 h-1 bg-amber-500 inline-block rounded-full"></span>
                ClimaFuse Prediction
              </span>
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <span className="w-3 h-1 bg-slate-900 inline-block rounded-full"></span>
                IMD Observed
              </span>
            </div>
            <span className="text-slate-500">Calculated via Rothfusz Regression Formula from 2m T and 2m RH</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* GRAPH SECTION 3 — PRECIPITATION (HYETOGRAPH)              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-lg transition-shadow">
        <div className="bg-[#f8fafc] text-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-lg">bar_chart</span>
            <span className="text-slate-900 font-bold tracking-wide uppercase text-xs font-mono">
              Hourly Precipitation &amp; Hyetograph
            </span>
          </div>
          <div className="font-mono text-xs text-slate-600 font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            {station.rainNote}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 bg-white">
          <div
            className="relative w-full h-44 sm:h-48 select-none bg-white rounded-lg"
            style={{ minHeight: '176px', height: '176px' }}
            onMouseLeave={() => setActiveRainIndex(null)}
          >
            <svg
              className="w-full h-full bg-white"
              preserveAspectRatio="none"
              viewBox="0 0 1000 160"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (mouseX - 55 * (rect.width / 1000)) / (920 * (rect.width / 1000))));
                const idx = Math.round(ratio * (numPoints - 1));
                setActiveRainIndex(idx);
              }}
            >
              {/* Pure white background screen */}
              <rect width="1000" height="160" fill="#ffffff" />

              {/* Gridlines */}
              {[120, 80, 40, 0].map((scaledY, idx) => {
                const yPos = 20 + idx * 40;
                const mmVal = ((maxRain * (3 - idx)) / 3).toFixed(1);
                return (
                  <g key={idx}>
                    <line stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="1" x1="55" x2="975" y1={yPos} y2={yPos} />
                    <text fill="#475569" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="600" textAnchor="end" x="48" y={yPos + 3}>
                      {mmVal} mm
                    </text>
                  </g>
                );
              })}
              <line stroke="#cbd5e1" strokeWidth="1.5" x1="55" x2="975" y1="140" y2="140" />

              {/* Hourly Paired Bars */}
              {data.map((d, i) => {
                const cx = getX(i);
                const bmaHeight = Math.min(120, (d.rainBma / (maxRain || 1)) * 115);
                const obsHeight = Math.min(120, (d.rainObs / (maxRain || 1)) * 115);

                return (
                  <g key={i}>
                    {/* ClimaFuse BMA Bar */}
                    <rect
                      x={cx - 11}
                      y={140 - bmaHeight}
                      width="10"
                      height={Math.max(bmaHeight, d.rainBma > 0 ? 2 : 0)}
                      rx="1.5"
                      fill="#f59e0b"
                      stroke="#d97706"
                      strokeWidth="0.5"
                    />
                    {/* IMD Observed Bar */}
                    <rect
                      x={cx + 1}
                      y={140 - obsHeight}
                      width="10"
                      height={Math.max(obsHeight, d.rainObs > 0 ? 2 : 0)}
                      rx="1.5"
                      fill="#0f172a"
                      fillOpacity="0.12"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    {/* Nil hour baseline tick */}
                    {d.rainBma === 0 && d.rainObs === 0 && (
                      <line x1={cx} x2={cx} y1="138" y2="140" stroke="#94a3b8" strokeWidth="1.5" />
                    )}
                  </g>
                );
              })}

              {/* X Axis Time Labels */}
              {data.filter((_, i) => i % 2 === 0 || i === data.length - 1).map((d, i) => (
                <text
                  key={i}
                  fill="#475569"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                  x={getX(data.indexOf(d))}
                  y="154"
                >
                  {d.time}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip for Precipitation */}
            {activeRainIndex !== null && (
              <div
                className="absolute top-2 pointer-events-none z-30 p-2.5 rounded-xl bg-white/95 border border-slate-300 shadow-2xl backdrop-blur-md font-mono text-[11px] space-y-1 text-slate-800"
                style={{
                  left: `${Math.max(10, Math.min(80, (activeRainIndex / (numPoints - 1)) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-slate-900 font-bold pb-1 border-b border-slate-200">
                  Rainfall @ {data[activeRainIndex].time} IST
                </div>
                <div className="flex justify-between gap-4 text-amber-800">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> ClimaFuse BMA:</span>
                  <span className="font-bold">{data[activeRainIndex].rainBma} mm</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-900">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> IMD Observed:</span>
                  <span className="font-bold">{data[activeRainIndex].rainObs} mm</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-600 pt-2 border-t border-slate-200 gap-2">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2 text-amber-800 font-bold">
                <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block"></span>
                ClimaFuse Hyetograph
              </span>
              <span className="flex items-center gap-2 text-slate-900 font-bold">
                <span className="w-3 h-3 bg-slate-900/10 border-2 border-slate-900 rounded-sm inline-block"></span>
                IMD Tipping Bucket Gauge (Observed)
              </span>
            </div>
            <span className="text-slate-600 font-medium">{station.rainSubNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
