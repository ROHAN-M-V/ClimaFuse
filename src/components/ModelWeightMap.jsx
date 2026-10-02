import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  WEIGHT_REGIMES,
  LEAD_TIMES,
  getModelWeightsGeoJSON,
  MODEL_WEIGHT_NODES,
  REGIONS_CATALOG,
} from '../api/modelWeightsData';
import { BASEMAPS } from './MapComponent';
import { INDIA_GEOJSON } from '../api/indiaBoundary';

// Ensure MapLibre worker is resolved in Vite builds
setWorkerUrl(workerUrl);

/**
 * ModelWeightMap
 *
 * Subcontinental geospatial workstation for visualising Bayesian Model
 * Averaging (BMA) weight distribution across India's microclimates.
 * Occupies the prominent ~60% left column in the Model Analysis workstation.
 *
 * Features:
 * - 3 Weight Map Types: Thermal, Precipitation, Heat Index
 * - 3 Basemaps: Physical Relief, Topographic, Satellite
 * - 4 Model Views: Consensus Blend, ECMWF IFS (Physics), ECMWF AIFS (Neural), NCMRWF (Regional)
 * - Synced Lead Times: 24h, 3d, 7d, 14d
 * - Bi-directional region selection synced with right analysis panel
 * - Complete single-view framing of India landmass from Ladakh to Kanyakumari
 */
export default function ModelWeightMap({
  activeRegime = 'thermal',
  onRegimeChange,
  activeModel = 'blend',
  onModelChange,
  selectedRegion = 'maharashtra',
  onSelectRegion,
  leadTime = '24h',
  onLeadTimeChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [currentBasemap, setCurrentBasemap] = useState('physical');
  const [currentRegime, setCurrentRegime] = useState(activeRegime);
  const [currentModel, setCurrentModel] = useState(activeModel);
  const [currentLeadTime, setCurrentLeadTime] = useState(leadTime);
  const [selectedNode, setSelectedNode] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ lat: '22.80', lng: '79.20' });

  // Sync external props
  useEffect(() => {
    if (activeRegime) setCurrentRegime(activeRegime);
  }, [activeRegime]);

  useEffect(() => {
    if (activeModel) setCurrentModel(activeModel);
  }, [activeModel]);

  useEffect(() => {
    if (leadTime) setCurrentLeadTime(leadTime);
  }, [leadTime]);

  // When selectedRegion changes externally, find a representative node
  useEffect(() => {
    if (selectedRegion) {
      const match = MODEL_WEIGHT_NODES.find((n) => n.regionId === selectedRegion);
      if (match) setSelectedNode(match);
    }
  }, [selectedRegion]);

  const activeMeta = WEIGHT_REGIMES[currentRegime] || WEIGHT_REGIMES.thermal;

  // Bounding box strictly encompassing all of India (Ladakh to Kanyakumari, Kutch to Arunachal)
  const INDIA_FRAME_BOUNDS = [
    [67.0, 6.2],   // Southwest corner [lng, lat]
    [97.8, 37.5],  // Northeast corner [lng, lat]
  ];

  // Helper to fit entire India inside frame cleanly without scrolling/panning
  const fitIndiaInFrame = (mapInstance, animated = false) => {
    if (!mapInstance) return;
    try {
      mapInstance.fitBounds(INDIA_FRAME_BOUNDS, {
        padding: {
          top: 40,
          bottom: 50,
          left: 20,
          right: 20,
        },
        maxZoom: 4.5,
        linear: true,
        duration: animated ? 450 : 0,
      });
    } catch (err) {
      console.warn('fitBounds error:', err);
    }
  };

  // Helper to attach India boundary and Model Weight layers
  const attachWeightLayers = (map, basemapKey, regimeKey, modelKey, leadKey) => {
    if (!map || !map.isStyleLoaded()) return;

    // 1. India GeoJSON boundary from in-memory dataset
    if (!map.getSource('india-boundary')) {
      map.addSource('india-boundary', {
        type: 'geojson',
        data: INDIA_GEOJSON,
      });
    }

    if (!map.getLayer('india-land-fill')) {
      map.addLayer({
        id: 'india-land-fill',
        type: 'fill',
        source: 'india-boundary',
        paint: {
          'fill-color': '#4edea3',
          'fill-opacity': 0.04,
          'fill-antialias': true,
        },
      });
    }

    if (!map.getLayer('india-outline')) {
      map.addLayer({
        id: 'india-outline',
        type: 'line',
        source: 'india-boundary',
        paint: {
          'line-color': basemapKey === 'satellite' ? '#38bdf8' : '#0284c7',
          'line-width': 1.8,
          'line-opacity': 0.85,
        },
      });
    }

    // 2. Model Weights Dataset Source
    const geojsonData = getModelWeightsGeoJSON(regimeKey, modelKey, leadKey);
    if (!map.getSource('model-weights-source')) {
      map.addSource('model-weights-source', {
        type: 'geojson',
        data: geojsonData,
      });
    } else {
      map.getSource('model-weights-source').setData(geojsonData);
    }

    // 3. Weight Heatmap Layer
    if (!map.getLayer('weight-heatmap')) {
      map.addLayer({
        id: 'weight-heatmap',
        type: 'heatmap',
        source: 'model-weights-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            15, 0.15,
            35, 0.45,
            55, 0.75,
            75, 1.0,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.85,
            5, 1.25,
            7, 1.8,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.18, 'rgba(56, 189, 248, 0.55)', // Sky Blue (IFS dominant)
            0.42, 'rgba(16, 185, 129, 0.72)', // Emerald (AIFS dominant)
            0.68, 'rgba(251, 191, 36, 0.82)', // Amber (High weight)
            0.88, 'rgba(249, 115, 22, 0.88)', // Orange (Very high)
            1.0, 'rgba(239, 68, 68, 0.95)',   // Red / Dominant Peak
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 48,
            5, 85,
            7, 145,
          ],
          'heatmap-opacity': 0.72,
        },
      });
    }

    // 4. Circle Layer for Observation Stations
    if (!map.getLayer('weight-stations')) {
      map.addLayer({
        id: 'weight-stations',
        type: 'circle',
        source: 'model-weights-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 4,
            6, 7,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'dominant'], 'ECMWF IFS'], '#38bdf8',
            ['==', ['get', 'dominant'], 'ECMWF AIFS'], '#4edea3',
            '#fbbf24',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000',
          'circle-opacity': 0.9,
        },
      });
    }
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const indiaBounds = [
      [55.0, 2.0],
      [106.0, 41.0],
    ];

    const selectedBasemap = BASEMAPS[currentBasemap] || BASEMAPS.physical;
    const initialStyle = selectedBasemap.getStyle();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [82.0, 21.8],
      zoom: 3.5,
      minZoom: 2.5,
      maxZoom: 8.5,
      maxBounds: indiaBounds,
      attributionControl: false,
    });

    mapRef.current = map;

    const handleRefit = () => {
      if (mapRef.current) {
        mapRef.current.resize();
        fitIndiaInFrame(mapRef.current, false);
      }
    };

    map.on('load', () => {
      attachWeightLayers(map, currentBasemap, currentRegime, currentModel, currentLeadTime);
      renderDOMMarkers(map, currentRegime, currentModel, currentLeadTime, selectedRegion);
      handleRefit();
      setTimeout(handleRefit, 100);
      setTimeout(handleRefit, 350);
    });

    map.on('style.load', () => {
      attachWeightLayers(map, currentBasemap, currentRegime, currentModel, currentLeadTime);
      renderDOMMarkers(map, currentRegime, currentModel, currentLeadTime, selectedRegion);
    });

    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: e.lngLat.lat.toFixed(2),
        lng: e.lngLat.lng.toFixed(2),
      });
    });

    // ResizeObserver ensures that anytime container size changes, map re-fits cleanly
    const resizeObserver = new ResizeObserver(() => {
      handleRefit();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  const isInitialBasemapMount = useRef(true);

  // Update style when basemap changes (skipping initial mount)
  useEffect(() => {
    if (isInitialBasemapMount.current) {
      isInitialBasemapMount.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;

    const basemap = BASEMAPS[currentBasemap] || BASEMAPS.physical;
    map.setStyle(basemap.getStyle());

    map.once('style.load', () => {
      attachWeightLayers(map, currentBasemap, currentRegime, currentModel, currentLeadTime);
      renderDOMMarkers(map, currentRegime, currentModel, currentLeadTime, selectedRegion);
    });
  }, [currentBasemap]);

  // Update dataset when regime, model, lead time, or region selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      const source = map.getSource('model-weights-source');
      if (source) {
        source.setData(getModelWeightsGeoJSON(currentRegime, currentModel, currentLeadTime));
      } else {
        attachWeightLayers(map, currentBasemap, currentRegime, currentModel, currentLeadTime);
      }
      renderDOMMarkers(map, currentRegime, currentModel, currentLeadTime, selectedRegion);
    } else {
      map.once('load', () => {
        attachWeightLayers(map, currentBasemap, currentRegime, currentModel, currentLeadTime);
        renderDOMMarkers(map, currentRegime, currentModel, currentLeadTime, selectedRegion);
      });
    }
  }, [currentRegime, currentModel, currentLeadTime, selectedRegion]);

  // Render clickable DOM station markers with microclimatic badges
  const renderDOMMarkers = (map, regimeKey, modelKey, leadKey, activeRegId) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Lead time multiplier
    let leadMult = { ec: 1.0, ai: 1.0, ncmrwf: 1.0 };
    if (leadKey === '3d') leadMult = { ec: 0.94, ai: 1.08, ncmrwf: 0.98 };
    else if (leadKey === '7d') leadMult = { ec: 0.88, ai: 1.15, ncmrwf: 0.97 };
    else if (leadKey === '14d') leadMult = { ec: 0.84, ai: 1.18, ncmrwf: 0.98 };

    MODEL_WEIGHT_NODES.forEach((node) => {
      const regimeData = node[regimeKey] || node.thermal;
      let ecW = Math.round(regimeData.ec * leadMult.ec);
      let aiW = Math.round(regimeData.ai * leadMult.ai);
      let ncmrwfW = Math.round(regimeData.ncmrwf * leadMult.ncmrwf);
      const total = ecW + aiW + ncmrwfW;
      ecW = Math.round((ecW / total) * 100);
      aiW = Math.round((aiW / total) * 100);
      ncmrwfW = 100 - ecW - aiW;

      let displayWeight = ecW;
      let pipColor = '#38bdf8';

      if (modelKey === 'ai') {
        displayWeight = aiW;
        pipColor = '#4edea3';
      } else if (modelKey === 'ncmrwf') {
        displayWeight = ncmrwfW;
        pipColor = '#fbbf24';
      } else if (modelKey === 'ec') {
        displayWeight = ecW;
        pipColor = '#38bdf8';
      } else {
        // blend mode: use highest weight
        if (aiW > ecW && aiW > ncmrwfW) {
          pipColor = '#4edea3';
          displayWeight = aiW;
        } else if (ncmrwfW > ecW && ncmrwfW > aiW) {
          pipColor = '#fbbf24';
          displayWeight = ncmrwfW;
        } else {
          pipColor = '#38bdf8';
          displayWeight = ecW;
        }
      }

      const isRegionActive = node.regionId === activeRegId;
      const isSelected = selectedNode?.id === node.id || isRegionActive;

      const el = document.createElement('div');
      el.className = `group cursor-pointer transition-all duration-200 ${
        isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
      }`;

      el.innerHTML = `
        <div class="relative flex items-center space-x-1.5 px-2 py-0.5 rounded-full backdrop-blur-md shadow-xl transition-all ${
          isSelected
            ? 'bg-[#181818] border-2 border-[#4edea3] ring-2 ring-[#4edea3]/30 shadow-[#4edea3]/20'
            : 'bg-[#111111]/90 border border-[#353534] hover:border-white'
        }">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${pipColor};"></span>
          <span class="font-mono text-[9px] font-semibold text-white leading-tight">${node.name}</span>
          <span class="font-mono text-[9px] text-[#a3a3a3] leading-tight">${displayWeight}%</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedNode(node);
        if (node.regionId && onSelectRegion) {
          onSelectRegion(node.regionId);
        }
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  const handleRegimeChange = (regimeId) => {
    setCurrentRegime(regimeId);
    if (onRegimeChange) onRegimeChange(regimeId);
  };

  const handleModelChange = (modelId) => {
    setCurrentModel(modelId);
    if (onModelChange) onModelChange(modelId);
  };

  return (
    <div className="relative w-full h-full flex-1 rounded-2xl overflow-hidden bg-[#0e0e0e] border border-[#262626]/70 shadow-2xl flex flex-col">
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Top Left: Geospatial HUD Telemetry Badge & Fit India Button */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
        <div className="pointer-events-none flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] font-mono text-[10px] text-[#a3a3a3] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="text-white font-medium">BMA Allocation</span>
          <span className="text-[#444748]">|</span>
          <span className="text-[#4edea3]">{activeMeta.label.split(' ')[0]}</span>
          <span className="text-[#444748]">|</span>
          <span className="text-white">Lead: {currentLeadTime.toUpperCase()}</span>
          <span className="hidden sm:inline text-[#444748]">|</span>
          <span className="hidden sm:inline text-[#e5e2e1]">{cursorCoords.lat}°N, {cursorCoords.lng}°E</span>
        </div>
        <button
          onClick={() => fitIndiaInFrame(mapRef.current, true)}
          title="Reset and capture whole of India in single frame"
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] hover:border-[#4edea3]/60 text-white font-mono text-[10px] hover:bg-[#1a1a1a] transition-all cursor-pointer shadow-lg"
        >
          <span className="material-symbols-outlined text-[14px] text-[#4edea3]">crop_free</span>
          <span className="font-semibold">Fit India</span>
        </button>
      </div>

      {/* Top Right: Basemap Selector Pills */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center p-0.5 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] shadow-xl space-x-0.5">
        {Object.values(BASEMAPS).map((b) => (
          <button
            key={b.id}
            onClick={() => setCurrentBasemap(b.id)}
            title={b.description}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-sans text-[10px] transition-all cursor-pointer ${
              currentBasemap === b.id
                ? 'bg-white text-[#0a0a0a] font-semibold shadow-sm'
                : 'text-[#a3a3a3] hover:text-white hover:bg-[#201f1f] font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">{b.icon}</span>
            <span className="hidden sm:inline">{b.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Bottom Left: Weight Regimes (Thermal, Precipitation, Heat Index) & Model Focus */}
      <div className="absolute bottom-2.5 left-2.5 z-20 flex flex-col gap-1.5">
        {/* The 3 Weight Types */}
        <div className="flex items-center p-0.5 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] shadow-xl space-x-0.5">
          {[
            { id: 'thermal', label: 'Thermal', icon: 'thermostat' },
            { id: 'precipitation', label: 'Rainfall', icon: 'rainy' },
            { id: 'heatIndex', label: 'Heat Index', icon: 'whatshot' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => handleRegimeChange(type.id)}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-sans text-[10px] transition-all cursor-pointer ${
                currentRegime === type.id
                  ? 'bg-white text-[#0a0a0a] font-semibold shadow-sm'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#201f1f] font-normal'
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Model Focus Selector */}
        <div className="flex items-center p-0.5 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] shadow-xl space-x-0.5 font-mono text-[9px]">
          {[
            { id: 'blend', label: 'Consensus Blend', color: 'text-white' },
            { id: 'ec', label: 'ECMWF IFS', color: 'text-[#38bdf8]' },
            { id: 'ai', label: 'ECMWF AIFS', color: 'text-[#4edea3]' },
            { id: 'ncmrwf', label: 'NCMRWF', color: 'text-[#fbbf24]' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => handleModelChange(m.id)}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                currentModel === m.id
                  ? 'bg-[#252525] border border-white/30 text-white font-bold'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              <span className={m.color}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Right: Active Bayesian Weight Scale Legend */}
      <div className="absolute bottom-2.5 right-2.5 z-20 hidden md:flex items-center space-x-2 px-3 py-1 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] font-mono text-[9px] text-[#a3a3a3] shadow-xl">
        <span className="text-white font-medium">{activeMeta.label.split(' ')[0]} Density:</span>
        <span className="text-[#38bdf8] font-semibold">{activeMeta.legendMin}</span>
        <div
          className={`w-24 h-1.5 rounded-full bg-gradient-to-r ${activeMeta.gradientCss} border border-white/20`}
        />
        <span className="text-[#ef4444] font-semibold">{activeMeta.legendMax}</span>
      </div>
    </div>
  );
}
