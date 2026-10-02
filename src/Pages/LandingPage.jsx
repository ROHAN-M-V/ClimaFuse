import React from 'react';
import { Link } from 'react-router-dom';
import TopUtilityPill from '../components/TopUtilityPill';
import MapComponent from '../components/MapComponent';
import BentoGrid from '../components/BentoGrid';

export default function LandingPage() {
  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] antialiased selection:bg-[#222222] selection:text-white transition-colors duration-200 min-h-screen">
      {/* TOP RIGHT FLOATING UTILITY PILL */}
      <TopUtilityPill />

      {/* MAIN VIEWPORT CANVAS */}
      <main className="px-6 md:px-12 lg:px-16 w-full overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="pt-28 pb-20 max-w-7xl mx-auto border-b border-[#262626]/40" id="product">
          {/* Breadcrumb Capsule */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-mono text-[0.6875rem] text-[#a3a3a3] uppercase tracking-widest">
              ADAPTIVE BAYESIAN MODEL AVERAGING // INDIA REGION
            </span>
          </div>

          {/* Grid: Left Copy & Right Telemetry Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Copy & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white tracking-tight leading-[1.08] mb-6">
                One forecast.<br />
                <span className="text-[#a3a3a3]">Built from the best of both models.</span>
              </h1>
              <p className="font-sans text-base sm:text-lg text-[#a3a3a3] max-w-xl leading-relaxed mb-8">
                ClimaFuse seamlessly blends ECMWF physics-based numerical weather prediction (IFS) with deep neural weather models (AIFS) using real-time historical accuracy — dynamically adapting across monsoon regimes, coastal boundaries, and Himalayan topography.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/dashboard"
                  className="px-6 py-2.5 rounded-full bg-white text-[#0a0a0a] font-sans text-[0.9375rem] font-semibold hover:bg-[#e2e2e2] transition-all duration-150 shadow-md flex items-center gap-2"
                >
                  <span>View Live Dashboard</span>
                  <span className="material-symbols-outlined text-base">arrow_outward</span>
                </Link>
                <a
                  className="px-5 py-2.5 rounded-full bg-[#181818] border border-[#262626] text-white font-sans text-[0.9375rem] hover:bg-[#222222] hover:border-[#8e9192] transition-all duration-150 flex items-center gap-1.5"
                  href="#how-it-works"
                >
                  <span>How it works</span>
                  <span className="material-symbols-outlined text-base">south</span>
                </a>
              </div>

              {/* Micro Spec Grid */}
              <div className="mt-12 pt-6 border-t border-[#262626]/60 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="font-mono text-[0.6875rem] text-[#a3a3a3] mb-1 uppercase tracking-wider">
                    Physics NWP
                  </div>
                  <div className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white">
                    ECMWF IFS
                  </div>
                  <div className="font-sans text-[0.8125rem] text-[#8e9192]">0.1° / 9km High-Res</div>
                </div>
                <div>
                  <div className="font-mono text-[0.6875rem] text-[#a3a3a3] mb-1 uppercase tracking-wider">
                    Deep Learning
                  </div>
                  <div className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white">
                    ECMWF AIFS
                  </div>
                  <div className="font-sans text-[0.8125rem] text-[#8e9192]">GNN / 0.25° Global</div>
                </div>
                <div>
                  <div className="font-mono text-[0.6875rem] text-[#a3a3a3] mb-1 uppercase tracking-wider">
                    Ground Truth
                  </div>
                  <div className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white">
                    IMD AWS
                  </div>
                  <div className="font-sans text-[0.8125rem] text-[#8e9192]">Real-time Telemetry</div>
                </div>
              </div>
            </div>

            {/* Right: MapLibre GL India Physical Relief Map Centerpiece */}
            <div className="lg:col-span-5 relative" id="coverage">
              <MapComponent variant="landing" />
            </div>
          </div>
        </section>

        {/* "HOW IT WORKS" SECTION */}
        <section className="py-24 max-w-7xl mx-auto border-b border-[#262626]/40" id="how-it-works">
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] mb-4">
              <span className="font-mono text-[0.6875rem] text-[#a3a3a3] uppercase tracking-widest">
                METHODOLOGY
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Adaptive Model Fusion in 4 Steps
            </h2>
            <p className="font-sans text-[0.9375rem] text-[#a3a3a3] max-w-2xl mt-2">
              Physics and neural models operate with radically different error distributions. ClimaFuse resolves divergence through dynamic empirical calibration.
            </p>
          </div>

          {/* 4 Connected Steps Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#8e9192]/60 transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[0.8125rem] text-[#8e9192]">01 // INGEST</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-0.5 transition-transform">
                    input
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-2">
                  Dual Input
                </h3>
                <p className="font-sans text-[0.8125rem] text-[#a3a3a3] leading-relaxed">
                  IFS (physics-based) and AIFS (AI model) forecast the same time and place simultaneously across standardized 0.1° grid cells.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#262626]/40 flex items-center justify-between font-mono text-[0.6875rem] text-[#8e9192]">
                <span>ECMWF Open Data</span>
                <span className="text-white">T+0h to T+240h</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#8e9192]/60 transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[0.8125rem] text-[#8e9192]">02 // VERIFY</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-0.5 transition-transform">
                    insights
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-2">
                  Skill Tracking
                </h3>
                <p className="font-sans text-[0.8125rem] text-[#a3a3a3] leading-relaxed">
                  Each model's continuous verification error is scored by microclimate region, season, and lead time against 800+ IMD automatic weather stations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#262626]/40 flex items-center justify-between font-mono text-[0.6875rem] text-[#8e9192]">
                <span>Continuous CRPS</span>
                <span className="text-white">Regional Scoring</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#8e9192]/60 transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[0.8125rem] text-[#8e9192]">03 // FUSION</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-0.5 transition-transform">
                    tune
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-2">
                  Adaptive Blend
                </h3>
                <p className="font-sans text-[0.8125rem] text-[#a3a3a3] leading-relaxed">
                  Bayesian Model Averaging dynamically assigns weights based on empirical verified performance, discarding static ensemble weights.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#262626]/40 flex items-center justify-between font-mono text-[0.6875rem] text-[#8e9192]">
                <span>Posterior PDF</span>
                <span className="text-white">Bayesian Kernels</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#8e9192]/60 transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[0.8125rem] text-[#8e9192]">04 // DISPATCH</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-0.5 transition-transform">
                    verified
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-2">
                  Optimized Forecast
                </h3>
                <p className="font-sans text-[0.8125rem] text-[#a3a3a3] leading-relaxed">
                  One unified, probabilistic prediction with calibrated uncertainty bounds — sharper, less diffusive, and more reliable than either model alone.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#262626]/40 flex items-center justify-between font-mono text-[0.6875rem] text-[#8e9192]">
                <span>Uncertainty Bounds</span>
                <span className="text-white">P10 - P50 - P90</span>
              </div>
            </div>
          </div>
        </section>

        {/* "WHY CLIMAFUSE" SECTION */}
        <section className="py-24 max-w-7xl mx-auto border-b border-[#262626]/40" id="why-climafuse">
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] mb-4">
              <span className="font-mono text-[0.6875rem] text-[#a3a3a3] uppercase tracking-widest">
                ARCHITECTURAL ADVANTAGE
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Engineered to Eliminate Single-Model Blind Spots
            </h2>
          </div>

          {/* 3-Column Editorial Grid with Hairline Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#262626] rounded-2xl overflow-hidden bg-[#111111]">
            {/* Column 1 */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-[#262626] flex flex-col justify-between hover:bg-[#181818]/40 transition-colors">
              <div>
                <div className="font-mono text-[0.6875rem] text-[#8e9192] mb-4">PARADIGM 01</div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-4">
                  Covers each model's blind spot
                </h3>
                <p className="font-sans text-[0.9375rem] text-[#a3a3a3] leading-relaxed">
                  Numerical physics models frequently struggle with rapid convective precipitation triggers in tropical humidity. Purely data-driven neural networks blur fine localized gradients at extended lead times. ClimaFuse's residual weighting dynamically resolves both.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#262626]/50 font-mono text-[0.6875rem] text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">check</span>
                <span>Eliminates AI spatial oversmoothing</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-[#262626] flex flex-col justify-between hover:bg-[#181818]/40 transition-colors">
              <div>
                <div className="font-mono text-[0.6875rem] text-[#8e9192] mb-4">PARADIGM 02</div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-4">
                  Adapts, not fixed
                </h3>
                <p className="font-sans text-[0.9375rem] text-[#a3a3a3] leading-relaxed">
                  Model synthesis weights are dynamically evaluated cycle-by-cycle against real-time ground truth stations. When AI demonstrates superior skill during dry anticyclones, its weight expands; during cyclonic landfall, physics-governed conservation laws take precedence.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#262626]/50 font-mono text-[0.6875rem] text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">check</span>
                <span>Zero hardcoded static coefficients</span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="p-8 flex flex-col justify-between hover:bg-[#181818]/40 transition-colors">
              <div>
                <div className="font-mono text-[0.6875rem] text-[#8e9192] mb-4">PARADIGM 03</div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-semibold text-white mb-4">
                  Built explicitly for India
                </h3>
                <p className="font-sans text-[0.9375rem] text-[#a3a3a3] leading-relaxed">
                  Global general-circulation models fail over the subcontinent without regionalized priors. ClimaFuse is explicitly weighted for South Asian monsoon depressions, Western Ghats steep orographic rainfall, and severe Indo-Gangetic Plain winter boundary layer inversions.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#262626]/50 font-mono text-[0.6875rem] text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">check</span>
                <span>IMD AWS Substation Calibration</span>
              </div>
            </div>
          </div>
        </section>

        {/* "WHAT YOU GET" SECTION */}
        <section className="py-24 max-w-7xl mx-auto" id="outputs">
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] mb-4">
                <span className="font-mono text-[0.6875rem] text-[#a3a3a3] uppercase tracking-widest">
                  OPERATIONAL OUTPUTS
                </span>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Scientific Data Artifacts &amp; Live Synthesis
              </h2>
            </div>
            <div className="font-mono text-[0.6875rem] text-[#8e9192]">
              REFRESH CADENCE: 6-HOUR OPERATIONAL RUNS
            </div>
          </div>

          {/* Bento Grid */}
          <BentoGrid />
        </section>

        {/* BOTTOM CALLOUT BANNER — HACKATHON DEMO PROTOTYPE */}
        <section className="py-16 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-[#181818] p-8 md:p-12 border border-[#262626] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 font-mono text-[0.6875rem] text-[#4edea3] uppercase tracking-wider mb-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                <span>HACKATHON SELECTION ROUND · PROTOTYPE DEMO</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                Explore the ClimaFuse Live Interactive Prototype.
              </h3>
              <p className="font-sans text-[0.9375rem] text-[#a3a3a3] leading-relaxed">
                Built as a proof-of-concept demonstration for the hackathon jury and selection committee. Experience how real-time Bayesian Model Averaging (BMA) blends ECMWF physics (IFS) with neural AI models (AIFS) against IMD ground truth across 840+ Indian weather stations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 relative z-10 shrink-0">
              <Link
                className="px-6 py-3 rounded-full bg-white text-[#0a0a0a] font-sans text-[0.9375rem] font-semibold hover:bg-[#e2e2e2] transition-all cursor-pointer shadow-md flex items-center gap-2 group"
                to="/dashboard"
              >
                <span>Launch Interactive Dashboard</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                className="px-5 py-3 rounded-full bg-[#111111] border border-[#262626] text-white font-sans text-[0.9375rem] hover:bg-[#222222] transition-all cursor-pointer flex items-center gap-2"
                to="/station/delhi"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-400">show_chart</span>
                <span>Inspect Station Analysis</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-12 pb-20 max-w-7xl mx-auto border-t border-[#262626]/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-3">
              <img src="/weather.png" alt="ClimaFuse Icon" className="w-8 h-8 object-contain rounded-full shadow-sm ring-1 ring-white/10" />
              <div>
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>ClimaFuse</span>
                  <span className="font-mono text-[10px] text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/30 px-2 py-0.5 rounded-full font-medium">
                    Hackathon Demo
                  </span>
                </div>
                <div className="font-mono text-[0.6875rem] text-[#8e9192]">
                  AI-NWP Meteorological Synthesis Platform · Selection Round PoC
                </div>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-5 sm:gap-6 font-sans text-[0.8125rem] text-[#a3a3a3]">
              <a className="hover:text-white transition-colors" href="#product">
                Capabilities
              </a>
              <a className="hover:text-white transition-colors" href="#how-it-works">
                Methodology
              </a>
              <a className="hover:text-white transition-colors" href="#coverage">
                Coverage
              </a>
              <a className="hover:text-white transition-colors" href="#outputs">
                Architecture
              </a>
              <Link className="hover:text-white transition-colors text-white font-medium" to="/dashboard">
                Interactive Dashboard
              </Link>
              <Link className="hover:text-amber-300 transition-colors text-amber-400 font-medium" to="/station/delhi">
                Station Deep-Dive
              </Link>
            </nav>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-[#262626]/30 font-mono text-[0.6875rem] text-[#8e9192]">
            <div>
              ClimaFuse · Hackathon Selection Round Prototype · Open-Data Ground Truth via IMD AWS &amp; ECMWF Open Telemetry.
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Evaluation Prototype v1.0
              </span>
              <span>•</span>
              <span>BMA Ensemble v3.1</span>
              <span>•</span>
              <span className="text-white">Non-Commercial PoC</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
