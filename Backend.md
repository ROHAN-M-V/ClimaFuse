# ClimaFuse — Production Backend Engineering Specification & Architecture Guide

> **Document Purpose**: This document serves as the complete, production-ready engineering blueprint for backend developers tasked with building the real-world server, ingestion pipelines, database schemas, and API layer for ClimaFuse.
>
> **Notice**: No frontend code has been altered. This guide outlines the exact contracts, endpoints, schemas, and pipeline architectures required to transition ClimaFuse from its current high-fidelity client-side mock implementation to a production AI-NWP meteorological platform.

---

## 1. Executive Summary & System Overview

ClimaFuse is a high-precision, technical meteorological intelligence platform that fuses:
1. **ECMWF IFS (HRES)**: Deterministic physics-based Numerical Weather Prediction (Physics NWP).
2. **ECMWF AIFS**: Graph Neural Network deep learning meteorological model (AI/ML NWP).
3. **NCMRWF Unified**: High-resolution Indian regional numerical weather prediction model.
4. **IMD Automatic Weather Stations (AWS)**: Ground truth observation telemetry from 840+ stations across India.

Ground-truth calibration and multi-model convergence are dynamically computed via **Adaptive Bayesian Model Averaging (BMA)**, where attribution weights modulate continuously by region, season, and lead time ($0\text{h} \rightarrow 14\text{d}$).

```
                                 CLIMAFUSE END-TO-END DATA FLOW
                                 
   +---------------------------------------------------------------------------------+
   |                             RAW DATA INGESTION SOURCES                          |
   |                                                                                 |
   |  [ECMWF Open Data API]     [ECMWF AIFS Model]    [NCMRWF Indian Grid]   [IMD AWS / CAP Feeds]
   |     GRIB2 (00Z/12Z)          GRIB2/NetCDF          GRIB2 Regional         JSON/XML Bulletins
   +-----------+-----------------------+----------------------+----------------------+
               |                       |                      |                      |
               +-----------------------+----------+-----------+                      |
                                                  |                                  |
                                       [Inference & Preprocessing]                   |
                                       - ecCodes / cfgrib / xarray                   |
                                       - Spatial Regridding (0.05° EPS)              |
                                       - Diurnal Temperature / Heat Index            |
                                                  |                                  |
                                                  v                                  v
                                       [BMA Statistical Engine]            [Station Ingestion]
                                       - Rolling 30-day EM Algorithm       - Quality Control (QC)
                                       - Regional Weights Matrix           - Spatial Interpolation
                                       - Confidence Bounds (90% Interval)  - Radiosonde Parsing
                                                  |                                  |
                                                  +-----------------+----------------+
                                                                    |
                                                                    v
   +---------------------------------------------------------------------------------+
   |                              PERSISTENCE & CACHE LAYER                          |
   |                                                                                 |
   |  [TimescaleDB / ClickHouse]        [PostGIS / PostgreSQL]             [Redis 7]
   |   - Hourly station telemetry         - Station geographical metadata    - 0.05° GeoJSON mesh
   |   - Model timeseries forecasts       - 12 Microclimatic regions         - Active BMA weights
   |   - Radiosonde sounding records      - District boundary geometries     - Synoptic cycle cache
   +------------------------------------------------+--------------------------------+
                                                    |
                                                    v
   +---------------------------------------------------------------------------------+
   |                                FASTAPI / GO BACKEND GATEWAY                     |
   |                                                                                 |
   |  - RESTful API (v1)              - GeoJSON / Vector Tiles (MVT)     - SSE / WebSocket
   |  - CSV/NetCDF Exporters          - Rate Limiting & Auth             - Synoptic Scheduler
   +------------------------------------------------+--------------------------------+
                                                    | HTTP / HTTPS / WSS
                                                    v
   +---------------------------------------------------------------------------------+
   |                           CLIMAFUSE FRONTEND CLIENT (React)                     |
   |                                                                                 |
   |  - MapLibre GL JS Heatmaps       - Workstation Telemetry Panels     - Radiosonde Charts
   +---------------------------------------------------------------------------------+
```

---

## 2. Changes Required in Current Frontend Codebase

When the backend is developed, the frontend will be connected to live endpoints. Below is the precise roadmap of modifications needed in the frontend:

### 2.1. Environment Configuration (`.env`)
The frontend already defines `VITE_API_BASE_URL` in `.env.example`. The backend developer should ensure the frontend `.env.production` and `.env.local` specify:
```env
VITE_API_BASE_URL=https://api.climafuse.gov.in/api/v1
VITE_WS_BASE_URL=wss://api.climafuse.gov.in/ws/v1
VITE_MAPTILER_KEY=your_production_key_here
```

### 2.2. HTTP Client & Interceptors Layer (`src/api/client.js`)
Currently, mock objects are imported statically. A unified Axios client must be introduced:
- Configure base URL: `baseURL: import.meta.env.VITE_API_BASE_URL`.
- Default headers: `Content-Type: application/json`, `Accept: application/json`.
- Automatic retry on 502/503/504 errors using exponential backoff.
- Response interceptor unwrapping `response.data`.

### 2.3. Migrating Mock Modules to API Service Calls
The table below specifies how each mock data file maps to real backend service functions:

| Mock File | Current State | Target Backend Service File | Real API Endpoint |
| :--- | :--- | :--- | :--- |
| [`src/api/cities.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/cities.js) | Static 10 reference stations with hardcoded hourly temps and alerts | `src/api/stationsService.js` | `GET /api/v1/stations`<br>`GET /api/v1/stations/{id}` |
| [`src/api/atmosphericData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/atmosphericData.js) | 40+ static microclimatic observation points | `src/api/telemetryService.js` | `GET /api/v1/telemetry/mesh?overlay={layer}&cycle={cycle}` |
| [`src/api/modelWeightsData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/modelWeightsData.js) | Static BMA weight catalog, lead time series, and 12-region benchmark matrix | `src/api/modelsService.js` | `GET /api/v1/models/weights`<br>`GET /api/v1/models/benchmark-matrix` |
| [`src/api/stationAnalysisData.js`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/api/stationAnalysisData.js) | Hardcoded 24h diurnal series, BMA confidence intervals, and radiosondes | `src/api/stationAnalysisService.js` | `GET /api/v1/stations/{id}/analytics`<br>`GET /api/v1/stations/{id}/radiosonde` |
| `exportStationCSV()` | Client-side mock CSV blob builder | Browser download trigger | `GET /api/v1/stations/{id}/export?format=csv` |

### 2.4. React Router Data Loaders & Query Caching
1. **React Router Loaders** ([`src/App.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/App.jsx)):
   - Attach route `loader` functions to `/dashboard` and `/station/:cityId` using React Router v6.4+ Data APIs.
   - Use `defer` and `<Suspense>` to stream heavy timeseries and high-resolution spatial mesh data without blocking initial layout paints.
2. **State & Caching Strategy** (React Query / SWR):
   - Wrap data fetching with TanStack Query (`@tanstack/react-query`) with `staleTime: 5 * 60 * 1000` (5 minutes), as NWP cycles only update every 6 hours (00Z, 06Z, 12Z, 18Z), while AWS stations update every 15–30 minutes.

### 2.5. UI Loading Skeletons & Offline Degradation
- Add dark glassmorphism skeleton loaders (`animate-pulse bg-[#181818]`) in:
  - [`NationalOverviewPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/NationalOverviewPanel.jsx) while fetching bulletins.
  - [`StationCharts.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationCharts.jsx) while streaming diurnal timeseries.
  - [`StationRadiosonde.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationRadiosonde.jsx) while parsing isobaric sounding tables.

---

## 3. Comprehensive REST API Specifications

All endpoints use standard JSON responses wrapped in a consistent envelope:
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "synopticCycle": "2026-09-30T18:00:00Z",
    "cached": true,
    "executionTimeMs": 14
  }
}
```

---

### Module 1: IMD Stations & Reference Network

#### 1.1 List Reference & AWS Stations
- **Endpoint**: `GET /api/v1/stations`
- **Description**: Returns all IMD Automatic Weather Stations (10 primary reference stations or all 840+ mesh stations).
- **Query Parameters**:
  - `type`: `reference` (default 10 curated stations) | `all` (840+ mesh nodes).
  - `alertTier`: Filter by `Red` | `Orange` | `Yellow` | `Green`.
  - `region`: Filter by Indian region (e.g., `North India`, `Western Ghats`).
  - `search`: Search query string for station name, WMO ID, or district.
- **Sample Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "delhi",
      "name": "New Delhi",
      "state": "National Capital Territory (NCR)",
      "awsId": "AWS: 42182",
      "wmoId": "42182",
      "lat": 28.6139,
      "lon": 77.2090,
      "coords": "28.6139° N, 77.2090° E",
      "elevation": "216m ASL",
      "temp": 29.4,
      "feelsLike": 34.8,
      "condition": "Hazy Sunshine",
      "icon": "wb_sunny",
      "alertTier": "Orange",
      "alertDesc": "Severe Inversion & Particulate Trapping",
      "alertDuration": "ACTIVE (Next 18h)",
      "alertColor": "#f97316",
      "high": "33.0°",
      "low": "19.2°",
      "delta": "Δ -1.1° vs EPS",
      "visibility": "2,400m",
      "wind": "11.2 km/h",
      "windDir": "NW",
      "humidity": "68%",
      "dewPoint": "22°",
      "pop": "8%",
      "rainRate": "0.0 mm/h",
      "aqi": 312,
      "aqiStatus": "VERY POOR",
      "aqiColor": "#ef4444",
      "hourly": [
        { "time": "06Z", "temp": "29°", "icon": "wb_sunny", "highlight": true },
        { "time": "10Z", "temp": "33°", "icon": "sunny", "color": "#f97316" },
        { "time": "14Z", "temp": "28°", "icon": "partly_cloudy_day" },
        { "time": "18Z", "temp": "24°", "icon": "bedtime" },
        { "time": "22Z", "temp": "21°", "icon": "foggy" },
        { "time": "02Z", "temp": "20°", "icon": "foggy" }
      ],
      "blend": {
        "ec": 42,
        "ai": 35,
        "ncmrwf": 23,
        "reliability": "94.8%"
      }
    }
  ]
}
```

#### 1.2 Get Station Telemetry Detail
- **Endpoint**: `GET /api/v1/stations/{stationId}`
- **Description**: Returns detailed real-time surface observations, sensor status, and battery/solar voltage of the IMD AWS node.

---

### Module 2: Atmospheric Telemetry & Geospatial Mesh

#### 2.1 Get Subcontinental Telemetry Summary
- **Endpoint**: `GET /api/v1/telemetry/subcontinental-summary`
- **Description**: Powers the right-hand dashboard header card in [`NationalOverviewPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/NationalOverviewPanel.jsx).
- **Query Parameters**:
  - `overlay`: `temperature` | `rainfall` | `heatmap` (Heat Index).
  - `cycle`: Synoptic cycle timestamp (optional, defaults to current live cycle).
- **Sample Response**:
```json
{
  "status": "success",
  "data": {
    "overlay": "temperature",
    "title": "Subcontinental Thermal",
    "label": "Thermal",
    "icon": "thermostat",
    "unit": "°C",
    "mean": "28.4°C",
    "peak": {
      "val": "36.8°C",
      "location": "Jaisalmer (Thar)"
    },
    "min": {
      "val": "11.2°C",
      "location": "Leh (Ladakh)"
    },
    "gradient": "Strong diurnal flux (+18.4°C swing) in NW arid zone; maritime stability along peninsular coastline.",
    "highlights": [
      { "label": "Thar & Kutch Basin", "val": "34°–37°C", "status": "Elevated" },
      { "label": "Indo-Gangetic Plain", "val": "27°–31°C", "status": "Seasonal" },
      { "label": "Himalayan Arc", "val": "11°–18°C", "status": "Cold Sink" }
    ],
    "scaleMin": "10°C",
    "scaleMax": "40°C+"
  }
}
```

#### 2.2 Get Atmospheric Mesh Observation Nodes (GeoJSON)
- **Endpoint**: `GET /api/v1/telemetry/mesh`
- **Description**: Supplies observation coordinates and values to [`MapComponent.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/MapComponent.jsx) to generate MapLibre GL JS native heatmap layers.
- **Output Format**: GeoJSON `FeatureCollection` where each point represents an interpolated synoptic node or AWS station.
- **Sample Response**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [70.9083, 26.9157] },
      "properties": {
        "id": "jaisalmer",
        "name": "Jaisalmer",
        "region": "Thar Core Basin",
        "temp": 36.8,
        "precipitation": 0.0,
        "humidity": 22,
        "heatIndex": 35.8
      }
    }
  ]
}
```

#### 2.3 Mapbox Vector Tile (MVT) Endpoint (High-Resolution EPS Grid)
- **Endpoint**: `GET /api/v1/telemetry/tiles/{layer}/{z}/{x}/{y}.pbf`
- **Description**: Optional high-performance tile server for 0.05° EPS VERONA grid data across India. Allows MapLibre GL to render millions of continuous meteorological grid cells at 60 FPS without memory bottlenecks.

---

### Module 3: Model Weight Allocation & BMA Analytics

#### 3.1 Get Regional Model Weights
- **Endpoint**: `GET /api/v1/models/weights`
- **Description**: Returns BMA model weight distribution across IFS, AIFS, and NCMRWF.
- **Query Parameters**:
  - `regime`: `thermal` | `precipitation` | `heatIndex`.
  - `leadTime`: `24h` | `3d` | `7d` | `14d`.
  - `region`: (Optional) Region ID e.g., `maharashtra`, `indoGangetic`, `himalayan`.
- **Sample Response**:
```json
{
  "status": "success",
  "data": {
    "regionId": "maharashtra",
    "regionName": "Maharashtra (Konkan & Western Ghats)",
    "regime": "thermal",
    "leadTime": "24h",
    "dominantModel": "ECMWF IFS (Physics)",
    "dominantColor": "#38bdf8",
    "weights": {
      "ec": 44,
      "ai": 40,
      "ncmrwf": 16,
      "crpsGain": "+18.6%"
    },
    "synopticNote": "Steep orographic lifting along Western Ghats escarpment requires hydrostatic mass conservation; IFS physics heavily prioritized."
  }
}
```

#### 3.2 Get Model Weights Lead Time Series
- **Endpoint**: `GET /api/v1/models/weights/timeseries`
- **Description**: Powers the multi-line lead-time curve in [`ModelWeightAnalysisPanel.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/ModelWeightAnalysisPanel.jsx).
- **Sample Response**:
```json
{
  "status": "success",
  "data": [
    { "step": "0-6h", "label": "0-6h", "ec": 0.52, "ai": 0.32, "ncmrwf": 0.16 },
    { "step": "6-24h", "label": "6-24h", "ec": 0.44, "ai": 0.40, "ncmrwf": 0.16 },
    { "step": "1-3d", "label": "1-3d", "ec": 0.38, "ai": 0.46, "ncmrwf": 0.16 },
    { "step": "3-7d", "label": "3-7d", "ec": 0.34, "ai": 0.50, "ncmrwf": 0.16 },
    { "step": "7-14d", "label": "7-14d", "ec": 0.36, "ai": 0.46, "ncmrwf": 0.18 }
  ]
}
```

#### 3.3 Get Regional Benchmark & CRPS Matrix
- **Endpoint**: `GET /api/v1/models/benchmark-matrix`
- **Description**: Provides the 12-region evaluation table (BMA vs raw NWP CRPS score gain, RMSE reduction, and reliability).

---

### Module 4: Station Full Analytics & Radiosonde Soundings

#### 4.1 Station Analytics & Diurnal Forecast
- **Endpoint**: `GET /api/v1/stations/{stationId}/analytics`
- **Description**: Supplies data for [`StationAnalysisPage.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/Pages/StationAnalysisPage.jsx) including 24-hour diurnal curves, 90% BMA confidence envelopes, and verification scorecards.
- **Sample Response**:
```json
{
  "status": "success",
  "data": {
    "stationId": "delhi",
    "name": "New Delhi",
    "subdistrict": "Safdarjung Observatory",
    "wmoId": "42182",
    "elevation": "216m ASL",
    "blend": {
      "ifs": 42,
      "aifs": 58,
      "ncmrwf": 18,
      "crps": "0.42 °C",
      "spread": "0.98",
      "emIterations": 42
    },
    "currentTemp": 31.4,
    "feelsLike": 34.8,
    "summaryCards": {
      "temp": { "value": "31.4", "unit": "°C", "min": "22.1°C", "max": "33.8°C", "note": "Within 90% BMA interval", "badge": "Optimal", "badgeColor": "#4edea3" },
      "heatIndex": { "value": "34.8", "unit": "°C", "threshold": "Caution: 35.0°C", "note": "+1.2°C midday amplification", "badge": "Elevated", "badgeColor": "#fbbf24" },
      "rain": { "value": "0.0", "unit": "mm", "observed24h": "0.0 mm", "note": "Nil convective activity", "badge": "Dry", "badgeColor": "#8e9192" },
      "wind": { "value": "12.4", "unit": "km/h", "gusts": "19 km/h · NW (310°)", "note": "Boundary layer deceleration", "badge": "Decelerating", "badgeColor": "#4edea3" },
      "humidity": { "value": "54", "unit": "%", "dewPoint": "Dew: 18.2°C", "note": "Diurnal swing 42% - 71%", "badge": "Stable", "badgeColor": "#8e9192" }
    },
    "diagnosticNote": "AI-GNN given greater weight (58%) due to superior boundary-layer inversion capture over the Indo-Gangetic Plain.",
    "biasReductionNote": "Bias Reduction: ClimaFuse BMA achieved lowest diurnal bias (+0.3°C vs IMD vs +1.8°C NWP overshoot)",
    "scorecard": [
      { "param": "Peak Temperature", "obs": "33.8°C", "bma": "33.5°C", "bmaDelta": "(-0.3)", "ifs": "35.6°C", "ifsDelta": "(+1.8)", "aifs": "33.2°C", "aifsDelta": "(-0.6)", "bestFit": "ClimaFuse" }
    ],
    "timeseries": [
      { "time": "00:00", "obs": 23.4, "bma": 23.2, "ifs": 22.4, "aifs": 23.8, "bmaLow": 21.8, "bmaHigh": 24.6, "hiObs": 24.2, "hiBma": 24.0, "hiIfs": 23.1, "hiAifs": 24.6, "rainBma": 0, "rainObs": 0 },
      { "time": "02:00", "obs": 22.8, "bma": 22.6, "ifs": 21.6, "aifs": 23.0, "bmaLow": 21.2, "bmaHigh": 23.9, "hiObs": 23.5, "hiBma": 23.3, "hiIfs": 22.2, "hiAifs": 23.8, "rainBma": 0, "rainObs": 0 }
    ]
  }
}
```

#### 4.2 Radiosonde Vertical Sounding Profile
- **Endpoint**: `GET /api/v1/stations/{stationId}/radiosonde`
- **Description**: Feeds the vertical atmospheric column sounding table in [`StationRadiosonde.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/StationRadiosonde.jsx).
- **Sample Response**:
```json
{
  "status": "success",
  "data": {
    "stationId": "delhi",
    "observationTime": "2026-09-30T12:00:00Z",
    "soundingLevels": [
      { "pressure": "1000 hPa", "height": "216m (Surface)", "temp": "31.4°C", "dewPoint": "18.2°C", "wind": "12 kts · 310°", "layer": "Boundary Layer" },
      { "pressure": "925 hPa", "height": "780m", "temp": "26.8°C", "dewPoint": "16.4°C", "wind": "15 kts · 315°", "layer": "Inversion Cap" },
      { "pressure": "850 hPa", "height": "1,520m", "temp": "21.2°C", "dewPoint": "11.8°C", "wind": "18 kts · 320°", "layer": "Lower Troposphere" },
      { "pressure": "700 hPa", "height": "3,150m", "temp": "9.6°C", "dewPoint": "1.2°C", "wind": "22 kts · 305°", "layer": "Mid Troposphere" },
      { "pressure": "500 hPa", "height": "5,840m", "temp": "-5.8°C", "dewPoint": "-14.6°C", "wind": "35 kts · 285°", "layer": "Steering Level" },
      { "pressure": "300 hPa", "height": "9,620m", "temp": "-32.4°C", "dewPoint": "-44.0°C", "wind": "58 kts · 270°", "layer": "Subtropical Jet" },
      { "pressure": "200 hPa", "height": "12,380m", "temp": "-54.2°C", "dewPoint": "-68.5°C", "wind": "82 kts · 265°", "layer": "Tropopause" }
    ],
    "derivedIndices": {
      "cape": "1,840 J/kg",
      "cin": "-32 J/kg",
      "liftedIndex": "-4.2 K",
      "freezingLevel": "4,620m ASL"
    }
  }
}
```

#### 4.3 Export Station Telemetry CSV
- **Endpoint**: `GET /api/v1/stations/{stationId}/export`
- **Query Parameters**: `format=csv|netcdf|json`, `range=24h|7d|30d`.
- **Response**: Streams binary CSV / NetCDF file with `Content-Disposition: attachment; filename="climafuse_telemetry_{stationId}.csv"`.

---

### Module 5: IMD Weather Warnings & CAP Alerts

#### 5.1 Active All-India Warning Bulletins
- **Endpoint**: `GET /api/v1/alerts/active`
- **Description**: Returns operational IMD 4-tier alerts (Red, Orange, Yellow, Green) for all stations and districts.
- **Sample Response**:
```json
{
  "status": "success",
  "data": {
    "counts": { "red": 1, "orange": 3, "yellow": 3, "green": 3 },
    "severeCount": 4,
    "bulletins": [
      {
        "stationId": "mumbai",
        "stationName": "Mumbai",
        "state": "Maharashtra",
        "alertTier": "Red",
        "alertColor": "#ef4444",
        "title": "Severe Convective Cell & Coastal Surge",
        "description": "Squall lines approaching Konkan coast with localized inundation exceeding 100mm/24h.",
        "effectiveFrom": "2026-09-30T12:00:00Z",
        "expiresAt": "2026-09-30T18:00:00Z"
      }
    ]
  }
}
```

---

### Module 6: Synoptic Cycle & Operational Clock

#### 6.1 Synoptic Cycle Health & Status
- **Endpoint**: `GET /api/v1/synoptic/status`
- **Description**: Powers the top-bar operational pill in [`DashboardTopBar.jsx`](file:///c:/Users/neera/OneDrive/Desktop/ClimaFuse/Climafuse/src/components/DashboardTopBar.jsx) showing live synoptic run time (00:00, 06:00, 12:00, 18:00 UTC), blend reliability (e.g. 96.4%), and pipeline health.

---

### Module 7: Real-Time Event Streaming (SSE / WebSocket)

#### 7.1 Server-Sent Events (SSE) Live Feed
- **Endpoint**: `GET /api/v1/telemetry/stream`
- **Description**: Unidirectional event stream broadcasting:
  - Event `station_ping`: Live sensor readings every 60 seconds.
  - Event `alert_trigger`: Immediate push notification if an IMD Red/Orange bulletin is issued.
  - Event `synoptic_cycle_ready`: Notifies clients when a new 6-hourly NWP run has converged.

---

## 4. Recommended Backend Technology Stack

| Component | Recommended Technology | Technical Rationale |
| :--- | :--- | :--- |
| **Language & Framework** | **Python (FastAPI)** | High performance (`asyncio`), native integration with scientific Python libraries (`xarray`, `cfgrib`, `ecCodes`, `numpy`, `scipy`, `pandas`, `PyTorch`). |
| **Spatial Database** | **PostgreSQL + PostGIS** | Standard for geospatial queries, station proximity, district boundaries, and administrative polygon overlays. |
| **Time-Series Database** | **TimescaleDB** or **ClickHouse** | Hypertable partitioning for millions of hourly weather readings, rollups, and sub-millisecond diurnal queries. |
| **In-Memory Cache & Pub/Sub** | **Redis 7** | Sub-millisecond caching of 0.05° EPS GeoJSON grids and SSE pub/sub event broadcasting. |
| **Background Job Processing** | **Celery / Redis** or **Temporal** | Reliable scheduling and orchestration of 4x daily model ingestion workflows (GRIB2 parsing, regridding, BMA fitting). |
| **Blob / Object Storage** | **MinIO** or **AWS S3** | Ingestion landing zone for raw ECMWF IFS / AIFS / NCMRWF GRIB2 files and generated NetCDF exports. |

---

## 5. Ingestion Pipelines & Meteorological Data Feeds

The backend developer must configure three distinct automated ingestion workers:

### 5.1 Pipeline A: ECMWF IFS & AIFS Ingestion (Every 6h: 00Z, 06Z, 12Z, 18Z)
1. **Trigger**: Cron / Celery beat triggers 3.5 hours after synoptic cycle close (ECMWF distribution delay).
2. **Download**:
   - ECMWF Open Data client (`ecmwf-opendata` Python package) retrieves IFS HRES surface parameters: 2m temperature (`2t`), 10m wind vector (`10u`, `10v`), total precipitation (`tp`), mean sea level pressure (`msl`).
   - Retrieve ECMWF AIFS ML output GRIB files.
3. **Processing**:
   - Decode using `ecCodes` and load into `xarray` via `cfgrib`.
   - Subset to Indian bounding box: `lat: [4.0, 39.0], lon: [58.0, 102.0]`.
   - Bilinear regridding to 0.05° EPS grid (~5.5 km resolution).

### 5.2 Pipeline B: IMD AWS Ground Truth Ingestion (Every 15 Minutes)
1. **Source**: IMD AWS Portal / MOSDAC (ISRO) REST/SFTP endpoints.
2. **Parsing & Quality Control (QC)**:
   - Range checks: Temperature $-5^\circ\text{C}$ to $+55^\circ\text{C}$, Pressure $800\text{ hPa}$ to $1050\text{ hPa}$.
   - Temporal step-check: Flags jumps $> 5^\circ\text{C}/\text{hour}$ as sensor anomalies.
3. **Database Insertion**: Upsert validated telemetry into TimescaleDB `aws_observations` hypertable.

### 5.3 Pipeline C: Upper-Air Radiosonde Soundings (Every 12h: 00Z, 12Z)
1. **Source**: IMD Upper-Air Sounding network (Safdarjung, Santacruz, etc.) or NOAA IGRA v2.
2. **Data Model**: Parse vertical levels ($1000, 925, 850, 700, 500, 300, 200\text{ hPa}$).
3. **Thermodynamic Diagnostics**: Calculate convective available potential energy (CAPE), convective inhibition (CIN), and Lifted Index using `MetPy`.

---

## 6. Bayesian Model Averaging (BMA) Statistical Engine

The core intellectual property of ClimaFuse is its adaptive BMA fusion engine:

### 6.1 Formulation
For a weather variable $y$ (e.g., surface temperature), the ensemble forecast probability density function is:
$$p(y \mid f_1, f_2, f_3) = \sum_{k=1}^{3} w_k \cdot g(y \mid f_k, \sigma_k^2)$$
Where:
- $k \in \{\text{ECMWF IFS (Physics)}, \text{ECMWF AIFS (AI)}, \text{NCMRWF Unified}\}$
- $w_k \ge 0, \sum w_k = 1$ are the adaptive regional weights.
- $g(\cdot)$ is Gaussian for temperature/heat index, and a Gamma mixture for precipitation.

### 6.2 Training Workflow (Worker Algorithm)
1. Run daily at 01:00 UTC using a **rolling 30-day training window**.
2. Compare past 30 days of model forecasts against IMD AWS ground truth.
3. Execute **Expectation-Maximization (EM)** algorithm to maximize log-likelihood.
4. Store resulting model weights $w_k(\text{region}, \text{season}, \text{lead\_time})$ in PostgreSQL and cache in Redis.

---

## 7. Database Schemas (PostgreSQL / TimescaleDB DDL)

Below are the production DDL scripts required to initialize the database:

```sql
-- Enable PostGIS and TimescaleDB
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. Reference & AWS Stations Metadata Table
CREATE TABLE stations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    subdistrict VARCHAR(128),
    wmo_id VARCHAR(32),
    aws_id VARCHAR(32),
    elevation VARCHAR(32),
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_reference BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stations_geom ON stations USING GIST(geom);

-- 2. Real-Time Telemetry Hypertable (TimescaleDB)
CREATE TABLE station_telemetry (
    time TIMESTAMPTZ NOT NULL,
    station_id VARCHAR(64) REFERENCES stations(id),
    temp NUMERIC(4, 1),
    feels_like NUMERIC(4, 1),
    humidity NUMERIC(4, 1),
    dew_point NUMERIC(4, 1),
    pressure NUMERIC(6, 1),
    wind_speed NUMERIC(4, 1),
    wind_direction VARCHAR(8),
    precipitation_rate NUMERIC(5, 2),
    precipitation_accum_24h NUMERIC(6, 2),
    visibility_m INT,
    aqi INT,
    alert_tier VARCHAR(16) CHECK (alert_tier IN ('Red', 'Orange', 'Yellow', 'Green'))
);
SELECT create_hypertable('station_telemetry', 'time');
CREATE INDEX idx_station_telemetry_station_time ON station_telemetry (station_id, time DESC);

-- 3. Radiosonde Upper-Air Soundings
CREATE TABLE radiosonde_soundings (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(64) REFERENCES stations(id),
    observation_time TIMESTAMPTZ NOT NULL,
    pressure_hpa INT NOT NULL,
    height_m INT NOT NULL,
    temp_c NUMERIC(4, 1) NOT NULL,
    dewpoint_c NUMERIC(4, 1) NOT NULL,
    wind_speed_kts INT NOT NULL,
    wind_direction_deg INT NOT NULL,
    layer_name VARCHAR(64)
);
CREATE INDEX idx_radiosonde_station_time ON radiosonde_soundings(station_id, observation_time DESC);

-- 4. BMA Model Regional Weights Table
CREATE TABLE model_weights (
    id SERIAL PRIMARY KEY,
    region_id VARCHAR(64) NOT NULL,
    regime VARCHAR(32) CHECK (regime IN ('thermal', 'precipitation', 'heatIndex')),
    lead_time VARCHAR(16) NOT NULL,
    weight_ifs NUMERIC(4, 2) NOT NULL,
    weight_aifs NUMERIC(4, 2) NOT NULL,
    weight_ncmrwf NUMERIC(4, 2) NOT NULL,
    crps_gain_pct NUMERIC(4, 1),
    dominant_model VARCHAR(64),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (region_id, regime, lead_time)
);
```

---

## 8. Security, Caching & Deployment Strategy

### 8.1 CORS Policy
Allow origins:
- `http://localhost:5173` (Vite dev server)
- `https://climafuse.vercel.app` (Staging/Production Vercel deployment)
- `https://*.climafuse.gov.in`

### 8.2 Caching Matrix
| Asset / Endpoint | Cache Tier | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/telemetry/mesh` | Redis + CDN | 15 mins | New AWS ingestion cycle |
| `GET /api/v1/models/weights` | Redis | 6 hours | New NWP cycle (00Z, 06Z, 12Z, 18Z) |
| `GET /api/v1/stations/{id}/radiosonde`| Redis | 12 hours | 00Z / 12Z Sounding launch |
| Static GeoJSON Boundary | CDN Edge | 30 days | Immutable |

### 8.3 Containerization
Provide standard `docker-compose.yml` defining:
1. `api`: FastAPI Python 3.11 service with Uvicorn workers.
2. `worker`: Celery worker for GRIB2 decoding and BMA EM engine.
3. `timescaledb`: PostgreSQL 16 + TimescaleDB + PostGIS.
4. `redis`: Redis 7 alpine.
5. `minio`: S3-compatible local bucket for GRIB files.
