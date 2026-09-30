# ClimaFuse — Development Plan & Roadmap

## 1. Project Overview
ClimaFuse is a high-precision, technical meteorological intelligence platform that fuses ECMWF physics-based numerical weather prediction (IFS) with deep learning neural models (AIFS) via adaptive Bayesian Model Averaging (BMA) — weights vary by region, season, and lead time instead of being fixed. Ground truth calibration is driven by 800+ India Meteorological Department (IMD) Automatic Weather Stations (AWS).

---

## 2. Stack
- **Framework**: React (Vite)
- **Routing**: React Router v6.4+ — Data APIs (`createBrowserRouter`, `RouterProvider`, supporting loaders, defer(not required in v7 so not here), Await, Suspense)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin, `@import "tailwindcss"` in `src/index.css`)
- **Geospatial / Map**: MapLibre GL JS — static India GeoJSON boundary, no tile provider/API key required
- **Data Visualization**: Recharts — all timeseries and model comparison charts
- **Utilities**: date-fns (date handling), react-day-picker (calendar UI), lucide-react & Material Symbols (icons), axios (configured for API endpoints)
- **Design Source**: Stitch (Project `projects/17717170675868708570`)

---

## 3. Implementation Status

### Phase 1: Foundation, Styling & Landing Page [COMPLETED]
- [x] Project scaffolded (Vite + React)
- [x] Tailwind v4 configured (`vite.config.js` plugin + `@import` in `index.css`)
- [x] MapLibre installed + CSS imported
- [x] react-day-picker installed + CSS imported
- [x] Landing page design generated & extracted from Stitch (`d7d14eb7a1e84dc6a999c091d9bf58ae`)
- [x] Landing page implemented in [`src/Pages/LandingPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/LandingPage.jsx) with clean symmetrical viewport spacing (removed left vertical nav, balanced container layout)
- [x] Updated all "View Live Dashboard" and "Access Portal" buttons to route directly to `/dashboard` via React Router `<Link>` (resolved previous in-page anchor scroll)
- [x] Removed dark/light toggle feature entirely across application (removed from dashboard dock and CSS overrides; standardizing on austere technical dark theme)
- [x] Subcomponents in `src/components/`:
  - [`TopUtilityPill.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/TopUtilityPill.jsx): Floating status badge with pulsing live indicator and dashboard quick-link
  - [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx): Architectural physical relief map of India with radar sweep and IMD AWS station nodes
  - [`BentoGrid.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/BentoGrid.jsx): 5 operational capability cards with dynamic attribution bar and IMD alert tiers
- [x] React Router v6.4+ Data APIs configured in [`src/App.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/App.jsx) (`createBrowserRouter`, `RouterProvider`)

### Phase 2: Live Map Dashboard & Subcontinental Geospatial Telemetry [COMPLETED]
- [x] Extract Dashboard design from Stitch (`0f29241ba77a493f8e6a04fd78de92e9`)
- [x] India GeoJSON boundary placed at [`/public/india.geojson`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/public/india.geojson)
- [x] Mock station API created at [`/src/api/cities.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/cities.js) with 10 fixed reference stations
- [x] Atmospheric telemetry dataset created at [`/src/api/atmosphericData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/atmosphericData.js) with 40+ observation points across India's microclimates
- [x] MapLibre GL JS physical map component implemented in [`src/components/MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx):
  - Physical Relief Map (Image 2 style) using ESRI World Physical Map raster tiles (hypsometric elevation tints, Himalayas, Deccan Plateau, Western/Eastern Ghats, rivers) — ZERO API key required
  - Multi-basemap switcher (Physical Relief, Topographic, Satellite Imagery) — removed unauthenticated Carto dark tiles
  - Optional MapTiler vector topo integration (`VITE_MAPTILER_KEY` via `.env.example`)
  - Crisp India boundary vector overlay (`/india.geojson`)
  - Native MapLibre `type: 'heatmap'` layers for Thermal (10°C–40°C), Precipitation (0–120+ mm), and Heat Index (20°C–48°C) with floating HUD gradient scale legends
  - Constrained bounds (`[[58.0, 4.0], [102.0, 39.0]]`) centered on India
  - 10 clickable custom city markers showing weather glyphs, temperature, and IMD severity pips (Green/Yellow/Orange/Red)
  - HUD telemetry badge with real-time cursor coordinates
- [x] Streamlined [`DashboardTopBar.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/DashboardTopBar.jsx):
  - Removed duplicate tab buttons (handled by vertical dock)
  - Added interactive Date & Time dropdown calendar with `react-day-picker` and synoptic cycle selection (00:00, 06:00, 12:00, 18:00 UTC)
  - Positioned above map column only, allowing [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) to take the full upper vertical space available
- [x] Replaced landing page map with dynamic `MapComponent variant="landing"`:
  - Preserved exact container sizing (`w-full aspect-[4/5] max-w-md mx-auto rounded-2xl`)
  - Retained radar wavefront scanline, live station beacons, and header/footer telemetry badges
- [x] Corrected station coordinates in [`/src/api/cities.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/cities.js) (shifted Chennai, Mumbai, Kolkata inland onto landmass, resolving ocean placement)
- [x] Fixed MapLibre `load` event lifecycle in [`src/components/MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx) to reliably render Thermal, Precipitation, and Heat Index heatmaps with glowing observation points and gradient scale legend
- [x] Resolved MapLibre GL v6 Web Worker deployment issue by importing `maplibre-gl-worker.mjs?worker&url` and registering `setWorkerUrl(workerUrl)` across entrypoints, fixing `Worker failed to load (text/html strict MIME)` and ensuring all GeoJSON heatmap & vector layers render cleanly
- [x] Migrated national boundary GeoJSON to in-memory module [`src/api/indiaBoundary.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/indiaBoundary.js) (`INDIA_GEOJSON`) to eliminate asynchronous network fetch race conditions in production
- [x] Eliminated initial mount `setStyle()` race conditions in [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx) and [`ModelWeightMap.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightMap.jsx) preventing `Unable to perform style diff: Style is not done loading` warnings
- [x] Expanded [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) with barometric pressure, UV index, generous spacing, and flush bottom CTA button to fully utilize vertical height without empty space
- [x] Multi-tab views for Model Comparison, Active IMD Bulletins, and Synoptic Insights
- [x] Implemented All-India Subcontinental Overview & IMD Warning Command Center in [`src/components/NationalOverviewPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/NationalOverviewPanel.jsx):
  - Right panel displays subcontinental map telemetry by default instead of a single city
  - Synoptic telemetry readouts for Thermal (28.4°C mean), Precipitation (34.2mm mean, 165mm peak), and Heat Index (41.2°C peak), automatically synced to map HUD controls (eliminating redundant layer switch buttons in right panel)
  - Full-India IMD Warning Bulletins aggregating alert tiers (1 Red, 3 Orange, 3 Yellow, 3 Green) across the 10 reference stations with severity filters and expanded view fitting 5 station cards simultaneously with smooth internal scrolling
  - Seamless navigation: clicking any city card in the list or any city marker on the map immediately opens that station's detailed telemetry in [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx)
  - Dedicated `← All-India Overview` header button in [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) to smoothly return to the national overview at any time

### Phase 3: Model Comparison & Verification Analytics [COMPLETED]
- [x] Geospatial Model Weight Allocation Map implemented in [`src/components/ModelWeightMap.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightMap.jsx):
  - **Prominent 60% Left Workstation Allocation**: Occupies ~60% of the screen width (`flex-1 w-full h-full min-h-0`) alongside the 40% analysis panel, matching the core dashboard split shown in Image 2.
  - **Complete Single-View Extent**: Entire landmass of India from Ladakh Siachen crown down to Kanyakumari cape, and Gujarat to Arunachal Pradesh, captured completely in a single frame without map panning or page scrolling.
  - Automated `fitBounds` with calibrated `[[67.0, 6.2], [97.8, 37.5]]`, initial `center: [82.0, 21.8]`, and zoom `3.5` with compact HUD elements and padding `{ top: 40, bottom: 50, left: 20, right: 20 }`.
  - One-click `Fit India` framing button in the top HUD to quickly reset and lock the All-India view.
  - Active `ResizeObserver` lifecycle management with timeout refit ticks for reliable container mounting.
  - Renders BMA model weights across all 3 regimes: Thermal Weights, Precipitation Weights, and Heat Index Weights.
  - Supports 3 basemaps: Physical Relief, Topographic, Satellite.
  - Interactive model filter: Consensus Blend, ECMWF IFS (Physics), ECMWF AIFS (Neural GNN), NCMRWF Unified (Regional).
  - Bi-directional region synchronization: Clicking any station marker selects its region in the right panel and highlights its node on the map.
  - Comprehensive subcontinental coverage across 25+ microclimatic stations and 12 regions.
- [x] Dedicated 40% Model Weight Analysis Panel implemented in [`src/components/ModelWeightAnalysisPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightAnalysisPanel.jsx):
  - **Lead Time Selector**: Interactive pills for `24 Hours`, `3 Days`, `7 Days`, and `14 Days` dynamically modulating model weight attribution.
  - **Model Weight Composition (Selected Region)**: Styled region dropdown selector with custom SVG Donut Chart displaying the 3-model split (ECMWF IFS, ECMWF AIFS, NCMRWF Unified) and CRPS skill score gain.
  - **Model Weights by Lead Time (Recharts)**: Multi-line timeseries curve across lead times (`0-6h`, `6-24h`, `1-3d`, `3-7d`, `7-14d`) rendered in ClimaFuse's austere dark SaaS design system with dark glassmorphism tooltips.
  - **Dominant Attribution & Terrain Physics Rationale**: Technical microclimatic explanation and dominant weight range gradient bar.
  - **Full Matrix & Benchmark Modal**: Modal drawer inspecting the 12-region attribution matrix and lead-time CRPS skill score benchmark table.
- [x] Empirical BMA weights and regional catalog dataset expanded in [`src/api/modelWeightsData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/modelWeightsData.js).
- [x] Recharts time-series comparison curves implemented for regional model weight evolution across lead times.

### Phase 4: Full Station Analysis & Radiosonde Workstation [COMPLETED]
- [x] Full Station Analysis design extracted from Stitch (`projects/17717170675868708570/screens/a8a9c22504744aeda4d23adbec74427b`).
- [x] Dedicated Page created in [`src/Pages/StationAnalysisPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/StationAnalysisPage.jsx) with React Router dynamic route `/station/:cityId` and `/station` fallback.
- [x] Connected "View Full Station Analytics & Radiosonde" CTA button in [`StationTelemetryPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTelemetryPanel.jsx) to link directly to the corresponding station.
- [x] Full meteorological dataset for all 10 cities created in [`src/api/stationAnalysisData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/stationAnalysisData.js) (24-hour diurnal curves, confidence intervals, biometeorological stress, radiosonde soundings, CSV export).
- [x] Header & Breadcrumb City Selector in [`src/components/StationTopBar.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationTopBar.jsx) allowing seamless switching between all 10 IMD reference stations.
- [x] Summary Banner in [`src/components/StationSummaryBanner.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationSummaryBanner.jsx) with WMO station coordinates, ASL elevation, BMA blend, real-time snapshot, and horizon toggles.
- [x] 5-Parameter Telemetry Grid in [`src/components/StationParameterGrid.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationParameterGrid.jsx) (Surface Air Temp, Apparent Heat Index, Accumulated Rain, Surface Vector Wind, Relative Humidity).
- [x] Multi-Model Timeseries Plots in [`src/components/StationCharts.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationCharts.jsx):
  - 2m Temperature Curve with 90% BMA confidence interval polygon, ECMWF IFS (Physics), ECMWF AIFS (AI/ML), ClimaFuse BMA Mixture, and IMD Observed nodes with interactive crosshairs and tooltips.
  - Heat Index & Biometeorological Stress plot with 35.0°C danger zone shading and threshold lines.
  - Hourly Precipitation & Hyetograph paired bar charts comparing ClimaFuse vs IMD tipping bucket rain gauge.
- [x] Radiosonde Atmospheric Sounding in [`src/components/StationRadiosonde.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationRadiosonde.jsx) (isobaric vertical levels 1000 hPa to 200 hPa, freezing level, CAPE, and Lifted Index).
- [x] Synoptic Reasoning & Accuracy Scorecard in [`src/components/StationReasoningAndScorecard.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationReasoningAndScorecard.jsx) (two-tone BMA proportion bar, meteorologist diagnostic note, convergence metrics, IMD advisory banner, and ground truth scorecard matrix).
- [x] CSV telemetry export generator with single-click download.
- [x] Streamlined left dock on Station Analysis page: removed duplicate dashboard icon button below the brand 'CF' button and removed duplicate left dock download button in favor of the primary topbar 'Export CSV' action.
- [x] High-contrast white boundary (`border-2 border-white shadow-2xl shadow-black/80`) implemented across all left navigation docks ([`DashboardNavDock.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/DashboardNavDock.jsx), [`StationAnalysisPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/StationAnalysisPage.jsx), and [`SideNavDock.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/SideNavDock.jsx)) to ensure sharp separation and pop against near-absolute black canvas backdrops.
- [x] Comprehensive documentation generated in [`README.md`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/README.md) and full demonstration/evaluator presentation script created in [`PRESENTATION_SCRIPT.md`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/PRESENTATION_SCRIPT.md).
- [x] Vercel production deployment configuration implemented in [`vercel.json`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/vercel.json) with client-side SPA routing rewrites (`/(.*) -> /index.html`), immutable asset caching, and resilient relative GeoJSON asset resolutions.

### Phase 5: IMD Alerts & Data Feeds [UPCOMING]
- [ ] IMD 4-tier alert threshold trigger system (Green, Yellow, Orange, Red)
- [ ] Data feed download endpoints (NetCDF4, GeoTIFF, CSV)

