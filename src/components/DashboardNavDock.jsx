import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardNavDock({ activeTab = 'map', setActiveTab }) {
  const navigate = useNavigate();

  const handleTabClick = (tabKey, path) => {
    if (setActiveTab) {
      setActiveTab(tabKey);
    } else {
      navigate(path);
    }
  };

  return (
    <aside
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-[#121212]/95 backdrop-blur-md border-2 border-[#4edea3] rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-3 shadow-2xl shadow-black/80"
      style={{ top: '48%' }}
      aria-label="Dashboard Dock Navigation"
    >
      <nav aria-label="Main Navigation" className="flex flex-col items-center space-y-2">
        {/* Brand Icon */}
        <Link
          to="/"
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[#1c1b1b] transition-colors"
          title="ClimaFuse Home"
        >
          <img src="/weather.png" alt="ClimaFuse" className="w-6 h-6 object-contain rounded-full shadow-sm ring-1 ring-[#4edea3]/30" />
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            ClimaFuse Home
          </span>
        </Link>

        <div className="w-6 h-px bg-[#4edea3]/30 mb-1" />

        {/* Tab 1: Dashboard / Map */}
        <button
          onClick={() => handleTabClick('map', '/dashboard')}
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-[#2a2a2a] text-white border border-[#353534] shadow-sm'
              : 'text-[#a3a3a3] hover:text-white hover:bg-[#1c1b1b]'
          }`}
          title="Live Map Dashboard"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            Live Map Dashboard
          </span>
        </button>

        {/* Tab 2: IMD Alerts */}
        <button
          onClick={() => handleTabClick('alerts', '/dashboard?tab=alerts')}
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-[#2a2a2a] text-white border border-[#353534]'
              : 'text-[#a3a3a3] hover:text-white hover:bg-[#1c1b1b]'
          }`}
          title="IMD Severe Alerts"
        >
          <span className="material-symbols-outlined text-[20px] text-[#f97316]">warning</span>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            Active Alerts (2 Zones)
          </span>
        </button>

        {/* Tab 3: Model Comparison */}
        <button
          onClick={() => handleTabClick('comparison', '/dashboard?tab=comparison')}
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'comparison'
              ? 'bg-[#2a2a2a] text-white border border-[#353534]'
              : 'text-[#a3a3a3] hover:text-white hover:bg-[#1c1b1b]'
          }`}
          title="Model Consensus & Comparison"
        >
          <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            Model Analysis
          </span>
        </button>

        {/* Tab 4: Station Analysis & Radiosonde */}
        <Link
          to="/station/delhi"
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            activeTab === 'station'
              ? 'bg-[#2a2a2a] text-white border border-[#353534]'
              : 'text-[#a3a3a3] hover:text-white hover:bg-[#1c1b1b]'
          }`}
          title="Full Station Analysis & Radiosonde"
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'station' ? 'text-[#4edea3]' : ''}`}>
            travel_explore
          </span>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            Station Analysis
          </span>
        </Link>

        <div className="w-6 h-px bg-[#4edea3]/30 my-1" />

        {/* Tab 5: About / Return to Landing Page */}
        <Link
          to="/"
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-[#a3a3a3] hover:text-white hover:bg-[#1c1b1b] transition-colors"
          title="Return to Overview"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#353534] text-white font-mono text-[0.6875rem] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#444748] shadow-lg z-50">
            Platform Overview
          </span>
        </Link>
      </nav>
    </aside>
  );
}
