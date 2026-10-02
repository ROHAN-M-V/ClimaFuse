# AGENTS.md — ClimaFuse Engineering & Design Guidelines

This document outlines architecture patterns, design system guidelines, and operational procedures for autonomous coding agents contributing to ClimaFuse.

---

## 1. Design System & Aesthetics (Stitch Project Reference)
All UI interfaces in ClimaFuse adhere to the design system established in Stitch Project `projects/17717170675868708570`.

### Key Aesthetic Principles:
1. **Austere Technical SaaS Aesthetic**:
   - Near-absolute dark mode background (`#0A0A0A`).
   - Cards/Surfaces: `#111111`, `#121212`, `#181818`, `#222222`.
   - Structural hairlines: `#262626` (subtle) and `#383838` / `#444748` (active/borders).
2. **The Zero-Chrome Color Rule**:
   - Structural chrome (navbars, cards, sidebars, panel backgrounds) must remain strictly monochromatic (`#0A0A0A` through `#FFFFFF`).
   - Color is reserved exclusively for semantic operational telemetry:
     - **IMD Alert Tiers**:
       - Green (`#10B981`): Level 1 — No Warning / Normal
       - Yellow (`#FBBF24`): Level 2 — Watch / Be Updated
       - Orange (`#F97316`): Level 3 — Alert / Be Prepared
       - Red (`#EF4444`): Level 4 — Warning / Take Action
     - **System Status / Live indicator**: Emerald / Mint (`#4EDEA3`).
3. **Typography**:
   - **Headlines & Display**: `Plus Jakarta Sans` with tight negative letter spacing (`-0.025em` to `-0.04em`).
   - **Body & Editorial**: `Inter` for spatial metrics and telemetry readouts.
   - **Data, Coordinates & Timestamps**: `JetBrains Mono` with tabular numerals (`font-mono`).
   - **Icons**: `Material Symbols Outlined` (stroke width 300, opsz 20).

---

## 2. Directory Structure & Conventions
```
Climafuse/
├── public/
│   └── india.geojson       # Local GeoJSON boundary for India landmass
├── src/
│   ├── api/                # Mock APIs & data models (e.g. cities.js)
│   ├── Pages/              # Full page views (e.g. LandingPage.jsx, DashboardPage.jsx)
│   ├── components/         # Reusable modular subcomponents (MapComponent, SideNavDock, etc.)
│   ├── assets/             # Static SVGs, images, and brand assets
│   ├── App.jsx             # Top-level application routing (createBrowserRouter / RouterProvider)
│   ├── index.css           # Tailwind v4 imports, @theme color tokens, keyframe animations
│   └── main.jsx            # Application entrypoint
├── index.html              # HTML shell loading Google Fonts & Material Symbols
├── vite.config.js          # Vite config with @tailwindcss/vite plugin
├── PLAN.md                 # Project roadmap and milestone tracker
└── AGENTS.md               # Agent guidelines and design system specifications
```

---

## 3. Component Architecture Rules
- **Routing**: Always use React Router v6.4+ Data APIs (`createBrowserRouter` & `<RouterProvider router={router} />`) in [`src/App.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/App.jsx). This architecture supports data loaders, defer, and Suspense for future weather API streaming.
- **Pages**: Store main page components in `src/Pages/` (e.g. [`src/Pages/LandingPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/LandingPage.jsx), [`src/Pages/DashboardPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/DashboardPage.jsx)).
- **Subcomponents**: Extract modular sections into `src/components/` (e.g., [`SideNavDock.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/SideNavDock.jsx), [`TopUtilityPill.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/TopUtilityPill.jsx), [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx), [`BentoGrid.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/BentoGrid.jsx)).
- **Geospatial Map Architecture**:
  - `MapComponent.jsx` handles MapLibre GL rendering with multi-basemap capabilities.
  - **MapLibre GL v6 Worker Resolution**: MapLibre v6 uses ES modules with Web Workers. In Vite, always import the worker using `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` and invoke `setWorkerUrl(workerUrl)` at entrypoints ([`src/main.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/main.jsx), [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx), [`ModelWeightMap.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightMap.jsx)). This prevents the fatal "Worker failed to load / strict MIME type text/html" error on deep routes in deployment.
  - **In-Memory National Boundary**: Use in-memory [`src/api/indiaBoundary.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/indiaBoundary.js) (`INDIA_GEOJSON`) for GeoJSON sources rather than relative fetch strings (`/india.geojson`) to prevent asynchronous 404s or network race conditions during tile processing.
  - **Style Load Lifecycle Guard**: Never invoke `map.setStyle()` on initial component mount when `new maplibregl.Map({ style: initialStyle })` has just started loading (guard with `isInitialBasemapMount.current`). Always check `map.isStyleLoaded()` before attaching vector or heatmap layers.
  - **Zero-Key Physical Relief Default**: Always defaults to open ESRI World Physical Map tiles (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}`) for hypsometric terrain, mountain relief, and hydrological networks with ZERO required API keys.
  - **Optional Custom Tiles**: Supports `VITE_MAPTILER_KEY` if provided in `.env`.
  - **Landing Page Sizing Constraint**: When rendered on `LandingPage.jsx` (`variant="landing"`), the container must strictly preserve `w-full aspect-[4/5] max-w-md mx-auto rounded-2xl` with zero dimension shift.
- **Dashboard Right Workstation Architecture**:
  - The right column (`w-full lg:w-[420px] shrink-0 h-full`) operates with a dual-mode pattern:
    1. **Default Mode (`selectedCity === null`)**: Renders [`NationalOverviewPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/NationalOverviewPanel.jsx) showing the All-India subcontinental mesh overview, synced atmospheric telemetry for the active map layer (Thermal, Precipitation, Heat Index), and All-India IMD Warning Bulletins sized to comfortably show 5 reference station cards simultaneously with internal scrolling.
    2. **Station Telemetry Mode (`selectedCity !== null`)**: Renders [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) with high-density AWS station readouts, barometric pressure, UV index, 24h diurnal meteogram strip, and AI consensus blend.
  - **Single Source of Truth Layer Control**: Atmospheric layer toggles reside exclusively on the map's bottom HUD in [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx), eliminating redundant buttons in the right panel. [`NationalOverviewPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/NationalOverviewPanel.jsx) automatically syncs to display the active layer's telemetry readouts.
  - **Seamless Navigation**: Users can click any city card in the warning bulletins list or any marker on the map to inspect station telemetry, and click `← All-India Overview` or `onResetMap` in the top bar to return to the national overview.
- **Model Analysis & Convergence Architecture**:
  - Located at `activeTab === 'comparison'` in [`DashboardPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/DashboardPage.jsx).
  - Implements the exact **60% - 40% workstation split** matching the core dashboard architecture (`flex-1` map column on left, `w-full lg:w-[420px] xl:w-[450px] 2xl:w-[480px]` panel on right).
  - **Left 60% Column**: Features [`ModelWeightMap.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightMap.jsx) expanding to the full available viewport height and width (`flex-1 w-full h-full min-h-0`) with MapLibre GL JS BMA weight heatmaps.
  - **Single-Frame All-India Standard**: Captures the entire landmass of India from Jammu & Kashmir / Ladakh down to Kanyakumari / Kerala in one single frame without map panning or page scrolling. Enforced via automated `map.fitBounds([[67.0, 6.2], [97.8, 37.5]])` with `{ top: 40, bottom: 50, left: 20, right: 20 }`, initial `center: [82.0, 21.8]`, `zoom: 3.5`, `ResizeObserver`, and a HUD `Fit India` button.
  - **Right 40% Column**: Houses [`ModelWeightAnalysisPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightAnalysisPanel.jsx):
    1. **Lead Time Selection**: Pills for `24 Hours`, `3 Days`, `7 Days`, and `14 Days` dynamically recalculating model weights.
    2. **Model Weight Composition (Selected Region)**: Dropdown region selector + custom SVG Donut Chart showing the 3-model breakdown (IFS, AIFS, NCMRWF) and CRPS skill gain.
    3. **Model Weights by Lead Time**: Recharts timeseries line chart across lead times (`0-6h`, `6-24h`, `1-3d`, `3-7d`, `7-14d`) in ClimaFuse's austere dark SaaS styling.
    4. **Dominant Attribution & Terrain Physics Rationale**: Scientific mechanism and dominant weight scale bar.
    5. **Inspectable Full Matrix Modal**: Popover drawer to view the complete 12-region attribution matrix and lead-time CRPS benchmarks.
  - Supports 3 weight regimes: **Thermal Weights**, **Precipitation Weights**, and **Heat Index Weights**, combined with 3 basemaps (Physical Relief, Topographic, Satellite) and 4 model focus modes (Consensus Blend, ECMWF IFS, ECMWF AIFS, NCMRWF).
- **Full Station Analysis & Radiosonde Architecture**:
  - Located at `/station/:cityId` (e.g. `/station/delhi`, `/station/mumbai`) and handled by [`src/Pages/StationAnalysisPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/StationAnalysisPage.jsx).
  - Linked directly from the bottom CTA button in [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) (`View Full Station Analytics & Radiosonde`).
  - Supports all 10 IMD reference stations with dynamic data loaded via [`src/api/stationAnalysisData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/stationAnalysisData.js).
  - Includes:
    1. **Top Bar & City Dropdown**: Quick-switch dropdown menu to jump between any of the 10 stations without returning to the map.
    2. **Station Summary Banner**: WMO ID, coordinates, elevation ASL, BMA blend, current condition preview, and timeseries horizon switcher.
    3. **5-Parameter Grid**: Surface air temp, apparent heat index, accumulated rain, wind vector, and relative humidity.
    4. **3 High-Fidelity SVG Charts**:
       - 2m Temperature with 90% BMA confidence interval polygon, NWP IFS, AI AIFS, ClimaFuse BMA, and IMD Observed nodes with interactive cursor crosshairs and tooltips.
       - Heat Index & Biometeorological Stress curve with 35.0°C danger zone shading and threshold lines.
       - Hourly Precipitation & Hyetograph paired bar comparison.
    5. **Radiosonde Sounding Profile**: Vertical isobaric levels (1000 hPa to 200 hPa), freezing level, CAPE, and Lifted Index.
    6. **Synoptic Reasoning & Scorecard**: BMA two-tone proportion bar, meteorologist diagnostic commentary, convergence metrics, IMD advisory card, and accuracy scorecard table.
    8. **Austere Floating Nav Dock with Signature Green Boundary**: Framed by a solid 2px emerald/mint green boundary (`border-2 border-[#4edea3] shadow-2xl shadow-black/80`) across all workstations ([DashboardNavDock.jsx](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/DashboardNavDock.jsx) and [StationAnalysisPage.jsx](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/StationAnalysisPage.jsx)) to ensure crisp visual containment and unified branding against dark canvas backdrops (`#0A0A0A`). Retains strictly non-redundant controls: the top brand anchor routes to the Live Map Dashboard, followed by Severe Alerts, Model Comparison, active Station Analysis, and Platform Overview.
- **Strict Austere Dark Mode Standard**: ClimaFuse is permanently locked to its austere technical dark aesthetic (`#0A0A0A`). Dark/light toggles and light-mode overrides have been eliminated across the landing page and dashboard workstation to preserve operational contrast.
- **Smooth Anchors**: Maintain anchor navigation IDs: `#product`, `#how-it-works`, `#why-climafuse`, `#outputs`, `#coverage`.

---

## 4. Verification & Testing
- To test production build:
  ```bash
  cmd /c npm run build
  ```
- To run development server:
  ```bash
  cmd /c npx vite --port 5173
  ```
- Ensure any added libraries match dependencies installed in `package.json` (`lucide-react`, `recharts`, `maplibre-gl`, `react-router-dom`, `date-fns`).
