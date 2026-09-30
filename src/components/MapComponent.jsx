import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Link } from 'react-router-dom';
import { getCities } from '../api/cities';
import { getAtmosphericGeoJSON } from '../api/atmosphericData';

/**
 * Available MapLibre basemap sources.
 *
 * Defaults to high-resolution ESRI World Physical Map:
 * - Hypsometric elevation tints (Himalayas, Deccan Plateau, Western & Eastern Ghats, Indo-Gangetic Plain)
 * - Shaded relief showing mountain ridges, river basins, and continental shelf bathymetry
 * - Requires ZERO API keys / zero accounts.
 */
export const BASEMAPS = {
  physical: {
    id: 'physical',
    label: 'Physical Relief',
    icon: 'terrain',
    description: 'Hypsometric elevation & shaded relief of Indian subcontinent',
    getStyle: () => ({
      version: 8,
      sources: {
        'esri-physical': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 8,
          attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
        },
      },
      layers: [
        {
          id: 'esri-physical-layer',
          type: 'raster',
          source: 'esri-physical',
          minzoom: 0,
          maxzoom: 18,
          paint: {
            'raster-contrast': 0.15,
            'raster-saturation': 0.1,
          },
        },
      ],
    }),
  },
  topo: {
    id: 'topo',
    label: 'Topographic',
    icon: 'landscape',
    description: 'Topographic contours, rivers, and elevation details',
    getStyle: () => ({
      version: 8,
      sources: {
        'esri-topo': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 18,
          attribution: 'Tiles &copy; Esri, DeLorme, NAVTEQ',
        },
      },
      layers: [
        {
          id: 'esri-topo-layer',
          type: 'raster',
          source: 'esri-topo',
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    }),
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    icon: 'satellite_alt',
    description: 'High-resolution true color orbital observation',
    getStyle: () => ({
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 18,
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
        },
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    }),
  },
};

// Check for optional MapTiler API Key in environment
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const INDIA_GEOJSON_URL = `${import.meta.env.BASE_URL || '/'}india.geojson`.replace(/\/\//g, '/');
if (MAPTILER_KEY) {
  BASEMAPS.maptilerTopo = {
    id: 'maptilerTopo',
    label: 'MapTiler Topo',
    icon: 'map',
    description: 'Vector-rendered 3D topographic relief with custom contours',
    getStyle: () => `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`,
  };
}

/**
 * MapComponent
 *
 * Supports two display variants:
 * - variant="dashboard": Full-featured meteorological workstation map with layer switcher & HUD
 * - variant="landing": Exact aspect-[4/5] card with radar scanline & compact telemetry beacons
 */
export default function MapComponent({
  variant = 'dashboard',
  selectedCity,
  onCityClick,
  basemapId = 'physical',
  onBasemapChange,
  layerType = 'default',
  onLayerChange,
  choroplethData = null,
  cities = getCities(),
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [currentBasemap, setCurrentBasemap] = useState(basemapId);
  const [currentOverlay, setCurrentOverlay] = useState(layerType);
  const currentOverlayRef = useRef(layerType);
  const popupRef = useRef(null);
  const [cursorCoords, setCursorCoords] = useState({ lat: '22.80', lng: '79.20' });

  const isLanding = variant === 'landing';

  // Keep local basemap in sync if prop changes
  useEffect(() => {
    if (basemapId && BASEMAPS[basemapId]) {
      setCurrentBasemap(basemapId);
    }
  }, [basemapId]);

  // Keep local overlay in sync if prop changes
  useEffect(() => {
    setCurrentOverlay(layerType);
    currentOverlayRef.current = layerType;
  }, [layerType]);

  // Helper to attach India boundary and atmospheric telemetry layers to current style
  const attachOverlays = (map, activeBasemapKey) => {
    if (!map || !map.getStyle()) return;

    // 1. Load India GeoJSON boundary from /public/india.geojson
    try {
      if (!map.getSource('india-boundary')) {
        map.addSource('india-boundary', {
          type: 'geojson',
          data: INDIA_GEOJSON_URL,
        });
      }

      // Semi-transparent base fill
      if (!map.getLayer('india-land-fill')) {
        map.addLayer({
          id: 'india-land-fill',
          type: 'fill',
          source: 'india-boundary',
          paint: {
            'fill-color': '#38bdf8',
            'fill-opacity': currentOverlay === 'default' ? 0.02 : 0.06,
            'fill-antialias': true,
          },
        });
      }

      // Crisp national boundary line
      if (!map.getLayer('india-outline')) {
        map.addLayer({
          id: 'india-outline',
          type: 'line',
          source: 'india-boundary',
          paint: {
            'line-color': activeBasemapKey === 'satellite' ? '#38bdf8' : '#0284c7',
            'line-width': isLanding ? 1.5 : 2,
            'line-opacity': 0.85,
          },
        });
      }
    } catch (error) {
      console.warn('India boundary source notice:', error);
    }

    // 2. Load subcontinental atmospheric observation dataset
    try {
      const atmosphericData = getAtmosphericGeoJSON();
      if (!map.getSource('atmospheric-telemetry')) {
        map.addSource('atmospheric-telemetry', {
          type: 'geojson',
          data: atmosphericData,
        });
      } else {
        map.getSource('atmospheric-telemetry').setData(atmosphericData);
      }
    } catch (error) {
      console.warn('Atmospheric telemetry source notice:', error);
    }

    // 3. Thermal Heatmap Layer (Calibrated to Empirical Station Telemetry)
    if (!map.getLayer('thermal-heatmap')) {
      map.addLayer({
        id: 'thermal-heatmap',
        type: 'heatmap',
        source: 'atmospheric-telemetry',
        layout: {
          visibility: currentOverlay === 'temperature' ? 'visible' : 'none',
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'temp'],
            10, 0.10, // Cool Sky Blue (Himalayas / Leh, 10-18°C)
            18, 0.28, // Soft Teal / Aquamarine (18-23°C, Srinagar, Shimla)
            23, 0.44, // Temperate Green (23-27°C, Bengaluru, Pune)
            28, 0.64, // Golden Yellow (27-31°C, Gangetic Plains, Delhi, Lucknow)
            32, 0.82, // Warm Amber / Soft Orange (32-35°C, Jaipur, Ahmedabad)
            36, 1.00, // Crimson Red (Peak Hot Zones >36°C, Thar Desert, Jaisalmer)
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.95,
            5, 1.15,
            7, 1.45,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0.0, 'rgba(0, 0, 0, 0)',
            0.10, 'rgba(56, 189, 248, 0.50)',  // Cool Sky Blue (10-18°C)
            0.28, 'rgba(45, 212, 191, 0.65)',  // Soft Teal / Aquamarine (18-23°C)
            0.44, 'rgba(74, 222, 128, 0.75)',  // Temperate Green (23-27°C)
            0.64, 'rgba(250, 204, 21, 0.82)',  // Golden Yellow (27-31°C)
            0.82, 'rgba(251, 146, 60, 0.88)',  // Warm Amber / Soft Orange (31-34°C)
            1.00, 'rgba(239, 68, 68, 0.95)',   // Crimson Red (Peak Hot Zones >35°C)
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 56,
            5, 90,
            7, 150,
          ],
          'heatmap-opacity': 0.78,
        },
      });
    }

    // 4. Precipitation Heatmap Layer (Accurate Rainfall Distribution)
    if (!map.getLayer('precipitation-heatmap')) {
      map.addLayer({
        id: 'precipitation-heatmap',
        type: 'heatmap',
        source: 'atmospheric-telemetry',
        layout: {
          visibility: currentOverlay === 'rainfall' ? 'visible' : 'none',
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation'],
            0, 0.0,
            5, 0.12,
            20, 0.32,
            50, 0.60,
            90, 0.82,
            150, 1.0,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.95,
            5, 1.15,
            7, 1.45,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0.0, 'rgba(0, 0, 0, 0)',
            0.10, 'rgba(186, 230, 253, 0.38)', // Trace mist / light drizzle (0-5 mm)
            0.30, 'rgba(56, 189, 248, 0.62)',  // Light blue (5-20 mm)
            0.55, 'rgba(14, 165, 233, 0.78)',  // Ocean blue (20-50 mm)
            0.75, 'rgba(37, 99, 235, 0.88)',   // Deep blue (50-90 mm)
            0.90, 'rgba(79, 70, 229, 0.95)',   // Indigo / Storm peak (90-140 mm, Konkan)
            1.00, 'rgba(168, 85, 247, 0.98)',  // Intense Monsoon Purple (140+ mm, Cherrapunji)
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 52,
            5, 85,
            7, 140,
          ],
          'heatmap-opacity': 0.78,
        },
      });
    }

    // 5. Heat Index Heatmap Layer (Biometeorological Stress)
    if (!map.getLayer('heat-index-heatmap')) {
      map.addLayer({
        id: 'heat-index-heatmap',
        type: 'heatmap',
        source: 'atmospheric-telemetry',
        layout: {
          visibility: currentOverlay === 'heatmap' ? 'visible' : 'none',
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'heatIndex'],
            12, 0.05,
            22, 0.20,
            28, 0.42,
            34, 0.68,
            39, 0.88,
            44, 1.0,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.95,
            5, 1.15,
            7, 1.45,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0.0, 'rgba(0, 0, 0, 0)',
            0.12, 'rgba(52, 211, 153, 0.42)', // Mint Emerald (Safe / Comfortable, <24°C, Bengaluru)
            0.38, 'rgba(250, 204, 21, 0.70)', // Golden Yellow (Caution, 25-32°C, Delhi)
            0.64, 'rgba(251, 146, 60, 0.84)', // Amber Orange (Extreme Caution, 33-37°C, Jaisalmer)
            0.85, 'rgba(239, 68, 68, 0.92)',  // Coral Crimson (Danger, 38-42°C, Mumbai/Chennai)
            1.00, 'rgba(168, 85, 247, 0.98)', // Purple Violet (Extreme Danger, >43°C)
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 56,
            5, 90,
            7, 150,
          ],
          'heatmap-opacity': 0.78,
        },
      });
    }

    // 6. Observation Station Data Points (Data-Driven Illuminated Nodes)
    if (!map.getLayer('atmospheric-points')) {
      map.addLayer({
        id: 'atmospheric-points',
        type: 'circle',
        source: 'atmospheric-telemetry',
        layout: {
          visibility: currentOverlay !== 'default' ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 3.2,
            5, 4.5,
            7, 6.5,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'temp'],
            10, '#38bdf8',
            18, '#2dd4bf',
            23, '#4ade80',
            28, '#facc15',
            32, '#fb923c',
            35, '#ef4444',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0a0a0a',
          'circle-opacity': 0.95,
        },
      });
    }

    // Apply overlay visibility
    applyMeteorologicalLayer(map, currentOverlay);
  };

  // Initialize MapLibre GL map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Subcontinental bounding box [SW, NE]
    const indiaBounds = [
      [55.0, 2.0], // Southwest [lng, lat]
      [106.0, 41.0], // Northeast [lng, lat]
    ];

    const selectedBasemap = BASEMAPS[currentBasemap] || BASEMAPS.physical;
    const initialStyle = selectedBasemap.getStyle();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: isLanding ? [78.96, 22.2] : [80.5, 21.8],
      zoom: isLanding ? 3.7 : 3.85,
      minZoom: isLanding ? 3.2 : 2.8,
      maxZoom: isLanding ? 6.5 : 8.5,
      maxBounds: indiaBounds,
      attributionControl: false,
      scrollZoom: !isLanding,
    });

    mapRef.current = map;

    // CRITICAL FIX: In MapLibre, 'load' fires on initial mount
    map.on('load', () => {
      attachOverlays(map, currentBasemap);
      if (!isLanding && !selectedCity) {
        map.fitBounds(
          [
            [67.0, 6.2],
            [97.8, 37.4],
          ],
          {
            padding: { top: 45, bottom: 50, left: 35, right: 35 },
            maxZoom: 4.2,
            linear: true,
          }
        );
      }
    });

    // Also listen to style.load for subsequent dynamic style changes
    map.on('style.load', () => {
      attachOverlays(map, currentBasemap);
    });

    // Cursor position HUD tracking
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: e.lngLat.lat.toFixed(2),
        lng: e.lngLat.lng.toFixed(2),
      });
    });

    // Interactive telemetry tooltip on observation points
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
      className: 'meteorological-hud-popup',
    });
    popupRef.current = popup;

    map.on('mouseenter', 'atmospheric-points', (e) => {
      if (!e.features || !e.features.length) return;
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      const coords = feature.geometry.coordinates.slice();
      const props = feature.properties;
      const activeL = currentOverlayRef.current;

      let valText = `${props.temp}°C`;
      let valLabel = 'Thermal (2m T)';
      let badgeColor = '#4edea3';

      if (activeL === 'rainfall') {
        valText = `${props.precipitation} mm`;
        valLabel = '24h Precipitation';
        badgeColor = props.precipitation > 80 ? '#a855f7' : props.precipitation > 40 ? '#38bdf8' : '#94a3b8';
      } else if (activeL === 'heatmap') {
        valText = `${props.heatIndex}°C HI`;
        valLabel = 'Heat Index Stress';
        badgeColor = props.heatIndex > 38 ? '#ef4444' : props.heatIndex > 32 ? '#fbbf24' : '#4edea3';
      } else {
        badgeColor = props.temp >= 35 ? '#ef4444' : props.temp >= 31 ? '#fb923c' : props.temp >= 27 ? '#facc15' : props.temp >= 22 ? '#4ade80' : '#38bdf8';
      }

      popup
        .setLngLat(coords)
        .setHTML(`
          <div style="background: rgba(14, 14, 14, 0.95); border: 1px solid #333; padding: 7px 11px; border-radius: 9px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.85); backdrop-filter: blur(8px); min-width: 140px;">
            <div style="font-weight: 700; color: #fff; font-size: 12px; margin-bottom: 1px;">${props.name}</div>
            <div style="font-size: 9.5px; color: #8e9192; margin-bottom: 5px;">${props.region}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid #262626; padding-top: 4px;">
              <span style="font-size: 10px; color: #a3a3a3;">${valLabel}</span>
              <span style="font-weight: 700; color: ${badgeColor}; font-size: 12px;">${valText}</span>
            </div>
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'atmospheric-points', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

    // ResizeObserver ensures container resizing recalculates map canvas cleanly
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      popup.remove();
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  // Switch basemap style when currentBasemap changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basemap = BASEMAPS[currentBasemap] || BASEMAPS.physical;
    const newStyle = basemap.getStyle();

    map.setStyle(newStyle);

    map.once('style.load', () => {
      attachOverlays(map, currentBasemap);
      renderMarkers(map, cities, selectedCity, onCityClick, isLanding);
    });
  }, [currentBasemap]);

  // Update meteorological layer expression when currentOverlay changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!map.getLayer('thermal-heatmap')) {
      if (map.getStyle()) {
        attachOverlays(map, currentBasemap);
      }
    }

    applyMeteorologicalLayer(map, currentOverlay);
  }, [currentOverlay]);

  // Sync DOM Markers for cities
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    renderMarkers(map, cities, selectedCity, onCityClick, isLanding);
  }, [cities, selectedCity, onCityClick, isLanding]);

  // Handler for basemap change button
  const handleBasemapSelect = (key) => {
    setCurrentBasemap(key);
    if (onBasemapChange) {
      onBasemapChange(key);
    }
  };

  // Helper to render MapLibre DOM markers
  const renderMarkers = (map, cityList, currentSelected, clickHandler, landingMode) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Distinct non-overlapping geographic anchor alignments for closely positioned stations
    const CITY_POSITIONS = {
      mumbai: { anchor: 'bottom-right', offset: [-12, -4] },
      pune: { anchor: 'top-left', offset: [12, 4] },
      bengaluru: { anchor: 'bottom-right', offset: [-12, -4] },
      chennai: { anchor: 'bottom-left', offset: [12, -4] },
      jaipur: { anchor: 'bottom-right', offset: [-10, -4] },
      lucknow: { anchor: 'bottom-left', offset: [10, -4] },
      delhi: { anchor: 'bottom', offset: [0, -8] },
      ahmedabad: { anchor: 'bottom-right', offset: [-10, -4] },
      kolkata: { anchor: 'bottom-left', offset: [10, -4] },
      hyderabad: { anchor: 'bottom', offset: [0, -6] },
    };

    cityList.forEach((city) => {
      const isSelected = currentSelected?.id === city.id;
      const el = document.createElement('div');

      if (landingMode) {
        el.className = 'group cursor-pointer transition-transform duration-200 hover:scale-125 z-20';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-4 h-4 rounded-full opacity-60 animate-ping" style="background-color: ${city.alertColor}"></span>
            <span class="relative w-2 h-2 rounded-full border border-black shadow-md" style="background-color: ${city.alertColor}"></span>
            <span class="absolute left-3 top-[-6px] hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-mono text-white whitespace-nowrap border border-white/20 z-30">
              ${city.name} ${city.temp}°
            </span>
          </div>
        `;
      } else {
        el.className = `group cursor-pointer transition-all duration-200 ${
          isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
        }`;

        el.innerHTML = `
          <div class="relative flex items-center space-x-1.5 px-2.5 py-1 rounded-full backdrop-blur-md shadow-xl transition-all whitespace-nowrap ${
            isSelected
              ? 'bg-[#181818] border-2 border-white'
              : 'bg-[#111111]/90 border border-[#353534] hover:border-white'
          }">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${city.alertColor}; ${
              city.alertTier === 'Red'
                ? 'animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;'
                : ''
            }"></span>
            <span class="font-mono text-xs font-semibold text-white">${city.name}</span>
            <span class="font-mono text-[11px] text-[#a3a3a3]">${city.temp}°</span>
            <span class="material-symbols-outlined text-[13px] ${
              isSelected ? 'text-white' : 'text-[#8e9192]'
            }">${city.icon}</span>
          </div>
          <div class="w-2 h-2 rounded-full mx-auto mt-0.5 ${
            isSelected ? 'bg-white ring-2 ring-white/50' : 'bg-[#e5e2e1] ring-1 ring-black/40'
          }"></div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (clickHandler) {
          clickHandler(city);
        }
      });

      const cityPos = CITY_POSITIONS[city.id] || { anchor: 'bottom', offset: [0, -4] };
      const marker = new maplibregl.Marker({
        element: el,
        anchor: landingMode ? 'center' : cityPos.anchor,
        offset: landingMode ? [0, 0] : cityPos.offset,
      })
        .setLngLat([city.lon, city.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // --- RENDER VARIANT: LANDING PAGE ---
  if (isLanding) {
    return (
      <div className="relative w-full aspect-[4/5] max-w-md mx-auto rounded-2xl bg-[#111111] border border-[#262626] flex flex-col justify-between overflow-hidden shadow-2xl">
        <div className="absolute inset-0 radar-sweep pointer-events-none opacity-20 z-10" />

        <div className="relative z-20 flex items-center justify-between border-b border-[#262626]/60 bg-[#111111]/85 backdrop-blur-md px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">radar</span>
            <span className="font-mono text-[0.6875rem] text-white uppercase tracking-wider font-semibold">
              Subcontinental Mesh [IN-NWP]
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="font-mono text-[0.6875rem] text-[#8e9192]">EPS VERONA v4.2</span>
          </div>
        </div>

        <div className="relative flex-1 w-full min-h-0 bg-[#0c141d]">
          <div ref={mapContainerRef} className="w-full h-full" />

          <div className="absolute top-3 left-3 z-20 pointer-events-none px-2.5 py-1 rounded-lg bg-[#0e0e0e]/85 backdrop-blur-md border border-[#262626] font-mono text-[10px] text-[#a3a3a3]">
            <span className="text-white font-medium">Physical Relief</span>
            <span className="mx-1 text-[#444748]">|</span>
            <span className="text-[#4edea3]">MapLibre GL</span>
          </div>
        </div>

        <div className="relative z-20 border-t border-[#262626]/60 bg-[#111111]/85 backdrop-blur-md px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-[#8e9192]">
            <span className="text-white font-medium">842 AWS NODES</span>
            <span>•</span>
            <span className="text-[#a3a3a3]">08°N–37°N</span>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-[#4edea3] hover:text-white transition-colors group"
          >
            <span>OPEN WORKSTATION</span>
            <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER VARIANT: DASHBOARD WORKSTATION ---
  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl bg-[#0e0e0e] border border-[#262626]/70 shadow-2xl flex flex-col">
      {/* MapLibre GL DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Top Left: Geospatial HUD Telemetry Badge & Fit India Button */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="pointer-events-none flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] font-mono text-[11px] text-[#a3a3a3] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="text-white font-medium">MapLibre GL</span>
          <span className="text-[#444748]">|</span>
          <span className="text-[#4edea3]">{BASEMAPS[currentBasemap]?.label || 'Physical Relief'}</span>
          <span className="text-[#444748]">|</span>
          <span className="text-[#e5e2e1]">{cursorCoords.lat}°N, {cursorCoords.lng}°E</span>
        </div>
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.fitBounds(
                [
                  [67.0, 6.2],
                  [97.8, 37.4],
                ],
                {
                  padding: { top: 45, bottom: 50, left: 35, right: 35 },
                  maxZoom: 4.2,
                  linear: true,
                  duration: 500,
                }
              );
            }
          }}
          title="Fit entire India in one frame"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] hover:border-[#4edea3]/60 text-white font-mono text-[11px] hover:bg-[#1a1a1a] transition-all cursor-pointer shadow-lg"
        >
          <span className="material-symbols-outlined text-[15px] text-[#4edea3]">crop_free</span>
          <span className="hidden sm:inline font-semibold">Fit India</span>
        </button>
      </div>

      {/* Top Right: Basemap Selector Pills */}
      <div className="absolute top-4 right-4 z-20 flex items-center p-1 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] shadow-xl space-x-1">
        {Object.values(BASEMAPS).map((b) => (
          <button
            key={b.id}
            onClick={() => handleBasemapSelect(b.id)}
            title={b.description}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-sans text-[11px] transition-all cursor-pointer ${
              currentBasemap === b.id
                ? 'bg-white text-[#0a0a0a] font-semibold shadow-sm'
                : 'text-[#a3a3a3] hover:text-white hover:bg-[#201f1f] font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{b.icon}</span>
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Left: Atmospheric Telemetry Layer Selector */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center p-1 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] shadow-xl space-x-1">
        <span className="font-mono text-[10px] text-[#8e9192] px-2 uppercase tracking-wider">Atmospheric:</span>
        {[
          { id: 'default', label: 'Relief Only', icon: 'layers_clear' },
          { id: 'temperature', label: 'Thermal', icon: 'thermostat' },
          { id: 'rainfall', label: 'Precipitation', icon: 'rainy' },
          { id: 'heatmap', label: 'Heat Index', icon: 'whatshot' },
        ].map((ov) => (
          <button
            key={ov.id}
            onClick={() => {
              setCurrentOverlay(ov.id);
              if (onLayerChange) onLayerChange(ov.id);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-sans text-[11px] transition-all cursor-pointer ${
              currentOverlay === ov.id
                ? 'bg-white text-[#0a0a0a] font-semibold shadow-sm'
                : 'text-[#a3a3a3] hover:text-white hover:bg-[#201f1f] font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">{ov.icon}</span>
            <span>{ov.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Right: Active Telemetry Data Scale Legend */}
      {currentOverlay !== 'default' && (
        <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-[#0e0e0e]/90 backdrop-blur-md border border-[#262626] font-mono text-[10px] text-[#a3a3a3] shadow-xl">
          {currentOverlay === 'temperature' && (
            <>
              <span className="text-white font-medium">Subcontinental Thermal:</span>
              <span className="text-[#3b82f6]">10°C</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-yellow-400 via-orange-500 to-red-500 border border-white/20" />
              <span className="text-[#ef4444]">40°C+</span>
            </>
          )}
          {currentOverlay === 'rainfall' && (
            <>
              <span className="text-white font-medium">Precipitation (24h):</span>
              <span className="text-[#38bdf8]">0 mm</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-700 border border-white/20" />
              <span className="text-[#818cf8]">120+ mm</span>
            </>
          )}
          {currentOverlay === 'heatmap' && (
            <>
              <span className="text-white font-medium">Heat Index:</span>
              <span className="text-[#10b981]">20°C</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 via-red-500 to-purple-600 border border-white/20" />
              <span className="text-[#c084fc]">48°C Ext. Danger</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Updates visibility and properties for atmospheric heatmap layers
 */
function applyMeteorologicalLayer(map, layerType) {
  if (!map || !map.getStyle()) return;

  const thermalLayer = map.getLayer('thermal-heatmap');
  const precipLayer = map.getLayer('precipitation-heatmap');
  const heatIndexLayer = map.getLayer('heat-index-heatmap');
  const pointsLayer = map.getLayer('atmospheric-points');

  if (thermalLayer) {
    map.setLayoutProperty('thermal-heatmap', 'visibility', layerType === 'temperature' ? 'visible' : 'none');
  }
  if (precipLayer) {
    map.setLayoutProperty('precipitation-heatmap', 'visibility', layerType === 'rainfall' ? 'visible' : 'none');
  }
  if (heatIndexLayer) {
    map.setLayoutProperty('heat-index-heatmap', 'visibility', layerType === 'heatmap' ? 'visible' : 'none');
  }
  if (pointsLayer) {
    map.setLayoutProperty('atmospheric-points', 'visibility', layerType !== 'default' ? 'visible' : 'none');
    if (layerType === 'temperature') {
      map.setPaintProperty('atmospheric-points', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'temp'],
        10, '#38bdf8', // 10°C Cool Sky Blue (Leh, Himalayas)
        18, '#2dd4bf', // 18°C Soft Teal (Srinagar, Shimla)
        23, '#4ade80', // 23°C Temperate Green (Bengaluru, Pune)
        28, '#facc15', // 28°C Golden Yellow (Delhi, Lucknow, Kolkata)
        32, '#fb923c', // 32°C Amber Orange (Jaipur, Mumbai)
        35, '#ef4444', // 35°C+ Crimson Red (Ahmedabad, Jaisalmer)
      ]);
    } else if (layerType === 'rainfall') {
      map.setPaintProperty('atmospheric-points', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'precipitation'],
        0, '#64748b',   // Dry (0 mm)
        5, '#38bdf8',   // Light drizzle (5 mm)
        20, '#0284c7',  // Ocean blue (20 mm)
        50, '#1d4ed8',  // Deep blue (50 mm)
        90, '#6366f1',  // Indigo / Storm (90 mm, Konkan)
        140, '#a855f7', // Intense Purple (140+ mm, Cherrapunji)
      ]);
    } else if (layerType === 'heatmap') {
      map.setPaintProperty('atmospheric-points', 'circle-color', [
        'interpolate',
        ['linear'],
        ['get', 'heatIndex'],
        15, '#38bdf8', // Safe Cool Blue (<18°C)
        24, '#4ade80', // Normal Safe Green (18-26°C, Bengaluru)
        31, '#facc15', // Caution Yellow (27-32°C, Delhi)
        36, '#fb923c', // Extreme Caution Orange (33-37°C, Jaisalmer)
        40, '#ef4444', // Danger Crimson Red (38-42°C, Mumbai, Coastal)
        45, '#a855f7', // Extreme Danger Purple (>43°C)
      ]);
    }
  }

  // Base boundary fill opacity
  if (map.getLayer('india-land-fill')) {
    map.setPaintProperty(
      'india-land-fill',
      'fill-opacity',
      layerType === 'default' ? 0.02 : 0.06
    );
  }
}
