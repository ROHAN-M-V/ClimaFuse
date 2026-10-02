import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'maplibre-gl/dist/maplibre-gl.css';
import 'react-day-picker/dist/style.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Fix MapLibre GL v6 worker loading in Vite production builds & deployments
setWorkerUrl(workerUrl);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
