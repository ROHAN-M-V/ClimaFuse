import React from 'react';
import { Link } from 'react-router-dom';

export default function SideNavDock() {
  const navItems = [
    { label: 'Overview', icon: 'hub', href: '/' },
    { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { label: 'Coverage Mesh', icon: 'radar', href: '/#coverage' },
    { label: 'Methodology', icon: 'tune', href: '/#how-it-works' },
    { label: 'Architecture', icon: 'splitscreen', href: '/#why-climafuse' },
    { label: 'Operational Outputs', icon: 'grain', href: '/#outputs' },
  ];

  return (
    <aside
      aria-label="Global System Navigation"
      className="fixed left-6 top-6 z-50 hidden sm:flex flex-col items-center rounded-full bg-[#111111]/90 backdrop-blur-xl border-2 border-[#4edea3] shadow-2xl shadow-black/80 p-1.5"
    >
      {/* Brand Insignia */}
      <Link
        to="/"
        className="group relative flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-[#181818] transition-colors duration-150 mb-1"
        aria-label="ClimaFuse Home"
      >
        <img src="/weather.png" alt="ClimaFuse" className="w-6 h-6 object-contain rounded-full shadow-sm ring-1 ring-[#4edea3]/30" />
        <span className="absolute left-14 px-2.5 py-1 rounded bg-[#181818] border border-[#262626] text-[0.6875rem] font-mono text-[#e5e2e1] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
          ClimaFuse Platform
        </span>
      </Link>

      {/* Divider */}
      <div className="w-5 h-px bg-[#4edea3]/30 mb-1.5" />

      {/* Navigation Items */}
      <div className="flex flex-col items-center space-y-1">
        {navItems.map((item) => {
          const isHash = item.href.includes('#');
          return isHash ? (
            <a
              key={item.label}
              href={item.href}
              className="group relative flex items-center justify-center w-10 h-10 rounded-full text-[#a3a3a3] hover:text-white hover:bg-[#181818] transition-colors duration-150"
              aria-label={item.label}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span className="absolute left-14 px-2.5 py-1 rounded bg-[#181818] border border-[#262626] text-[0.6875rem] font-mono text-[#e5e2e1] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                {item.label}
              </span>
            </a>
          ) : (
            <Link
              key={item.label}
              to={item.href}
              className="group relative flex items-center justify-center w-10 h-10 rounded-full text-[#a3a3a3] hover:text-white hover:bg-[#181818] transition-colors duration-150"
              aria-label={item.label}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span className="absolute left-14 px-2.5 py-1 rounded bg-[#181818] border border-[#262626] text-[0.6875rem] font-mono text-[#e5e2e1] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
