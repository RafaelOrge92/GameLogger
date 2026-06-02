"use client";

import { useState } from "react";

const MONTH_LABELS = ["Jun 25", "Ago 25", "Oct 25", "Dic 25", "Feb 26", "Abr 26", "May 26"];

export default function TabsDashboard() {
  const [activeTab, setActiveTab] = useState("evolucion");

  const tabs = [
    { id: "evolucion", label: "Evolución" },
    { id: "region", label: "Región" },
    { id: "sistemas", label: "Sistemas" },
    { id: "estado", label: "Estado" },
  ];

  return (
    <div className="bg-[#18191b] rounded-xl border border-gray-800 p-5 md:p-6 w-full shadow-2xl transition-all duration-300">
      {/* Header and Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>📊</span> Analíticas de Colección
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Echa un vistazo al valor y distribución de tu catálogo</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#0f0f10] p-1 rounded-lg border border-gray-800/60 self-start sm:self-auto overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "text-emerald-400 bg-emerald-950/20 border border-emerald-500/20"
                    : "text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="pt-6 min-h-[340px] flex flex-col justify-between">
        
        {/* Render Tab 'evolucion' */}
        {activeTab === "evolucion" && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Top Stat Bar */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 font-medium">Valor Estimado de Cartera</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">€5.280,00</span>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                    ▲ +12.4% <span className="text-[10px] font-normal text-gray-400 ml-1">vs adquis.</span>
                  </span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Última actualización</p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">Hoy, Hace 2 horas</p>
              </div>
            </div>

            {/* Line / Area Chart Placeholder Container */}
            <div className="relative border border-dashed border-gray-800 rounded-xl bg-[#0f0f10]/40 p-4 h-48 flex flex-col justify-end group overflow-hidden">
              
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Fake SVG Graph */}
              <div className="relative w-full h-28 flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#334155" strokeWidth="0.1" strokeDasharray="2" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.1" strokeDasharray="2" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#334155" strokeWidth="0.1" strokeDasharray="2" />

                  {/* Area */}
                  <path
                    d="M 0 35 Q 15 32, 25 28 T 50 25 T 75 14 T 100 8 L 100 40 L 0 40 Z"
                    fill="url(#glowAreaGrad)"
                  />
                  {/* Curve Path */}
                  <path
                    d="M 0 35 Q 15 32, 25 28 T 50 25 T 75 14 T 100 8"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="stroke-[1.5]"
                  />
                  {/* Pulse Dot */}
                  <circle cx="100" cy="8" r="2" fill="#34d399" className="animate-ping origin-center" />
                  <circle cx="100" cy="8" r="1.5" fill="#10b981" />
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-gray-500 pt-3 mt-1 border-t border-gray-800/80">
                {MONTH_LABELS.map((month, idx) => (
                  <span key={idx}>{month}</span>
                ))}
              </div>

              {/* Watermark Overlay Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0f0f10]/10 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[#18191b] border border-gray-800 text-gray-400 text-xs px-3.5 py-1.5 rounded-lg shadow-xl font-mono">
                  [Marcador: Gráfica de Área Lineal - Evolución del Valor en €]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Render Tab 'region' */}
        {activeTab === "region" && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Legend Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> PAL-ES
                </p>
                <p className="text-lg font-extrabold text-white mt-1">85 juegos</p>
                <p className="text-[10px] text-gray-500">60% del total</p>
              </div>
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> PAL-UK
                </p>
                <p className="text-lg font-extrabold text-white mt-1">28 juegos</p>
                <p className="text-[10px] text-gray-500">20% del total</p>
              </div>
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" /> NTSC-U
                </p>
                <p className="text-lg font-extrabold text-white mt-1">21 juegos</p>
                <p className="text-[10px] text-gray-500">15% del total</p>
              </div>
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> NTSC-J
                </p>
                <p className="text-lg font-extrabold text-white mt-1">8 juegos</p>
                <p className="text-[10px] text-gray-500">5% del total</p>
              </div>
            </div>

            {/* Donut Chart Placeholder */}
            <div className="relative border border-dashed border-gray-800 rounded-xl bg-[#0f0f10]/40 p-6 h-48 flex items-center justify-center group">
              
              {/* Simulated Donut Chart using SVG */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#1f2937" strokeWidth="3" />
                  
                  {/* Segment PAL-ES: 60% (Dasharray: 52.8, Dashoffset: 0) */}
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#10b981" strokeWidth="3.2" 
                    strokeDasharray="52.8 88" strokeDashoffset="0" className="transition-all duration-500" />
                  
                  {/* Segment PAL-UK: 20% (Dasharray: 17.6, Dashoffset: -52.8) */}
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#22d3ee" strokeWidth="3.2" 
                    strokeDasharray="17.6 88" strokeDashoffset="-52.8" className="transition-all duration-500" />

                  {/* Segment NTSC-U: 15% (Dasharray: 13.2, Dashoffset: -70.4) */}
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#8b5cf6" strokeWidth="3.2" 
                    strokeDasharray="13.2 88" strokeDashoffset="-70.4" className="transition-all duration-500" />

                  {/* Segment NTSC-J: 5% (Dasharray: 4.4, Dashoffset: -83.6) */}
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="3.2" 
                    strokeDasharray="4.4 88" strokeDashoffset="-83.6" className="transition-all duration-500" />
                </svg>
                
                {/* Center Stats Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-white">142</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Juegos</span>
                </div>
              </div>

              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0f0f10]/10 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[#18191b] border border-gray-800 text-gray-400 text-xs px-3.5 py-1.5 rounded-lg shadow-xl font-mono">
                  [Marcador: Gráfica de Tarta - Distribución PAL vs NTSC]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Render Tab 'sistemas' */}
        {activeTab === "sistemas" && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
            {/* Horizontal Bar Chart Mockup */}
            <div className="relative border border-dashed border-gray-800 rounded-xl bg-[#0f0f10]/40 p-5 min-h-[220px] flex flex-col justify-center gap-4 group">
              {[
                { name: "Super Nintendo (SNES)", value: "€2.450,00", pct: 46, color: "from-emerald-500 to-teal-400" },
                { name: "PlayStation (PS1)", value: "€1.240,00", pct: 23, color: "from-cyan-500 to-blue-400" },
                { name: "Nintendo 64 (N64)", value: "€980,00", pct: 18, color: "from-violet-500 to-purple-400" },
                { name: "Sega Genesis (MD)", value: "€610,00", pct: 13, color: "from-amber-500 to-orange-400" },
              ].map((sys, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-300">{sys.name}</span>
                    <span className="text-white font-bold">{sys.value} <span className="text-[10px] text-gray-500">({sys.pct}%)</span></span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full h-2.5 bg-[#18191b] rounded-full overflow-hidden border border-gray-800/80">
                    {/* Glowing Bar Fill */}
                    <div 
                      className={`h-full bg-gradient-to-r ${sys.color} rounded-full transition-all duration-700 ease-out`} 
                      style={{ width: `${sys.pct}%` }} 
                    />
                  </div>
                </div>
              ))}

              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0f0f10]/10 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[#18191b] border border-gray-800 text-gray-400 text-xs px-3.5 py-1.5 rounded-lg shadow-xl font-mono">
                  [Marcador: Gráfica de Barras Horizontales - Valor por Consola]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Render Tab 'estado' */}
        {activeTab === "estado" && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Condition Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg text-center">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Sealed</p>
                <p className="text-xl font-extrabold text-white mt-1">12</p>
                <p className="text-[10px] text-gray-500">Precintado</p>
              </div>
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg text-center">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">CIB</p>
                <p className="text-xl font-extrabold text-white mt-1">98</p>
                <p className="text-[10px] text-gray-500">Completo</p>
              </div>
              <div className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg text-center">
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Loose</p>
                <p className="text-xl font-extrabold text-white mt-1">32</p>
                <p className="text-[10px] text-gray-500">Cartucho/Disco</p>
              </div>
            </div>

            {/* Radar Mockup Container */}
            <div className="relative border border-dashed border-gray-800 rounded-xl bg-[#0f0f10]/40 p-4 h-48 flex items-center justify-center group">
              
              {/* Simulated Radar Chart using SVG */}
              <div className="w-32 h-32 text-gray-700">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Pentagonal Outer Grid */}
                  <polygon points="50,5 92.8,36.2 76.5,86.8 23.5,86.8 7.2,36.2" fill="none" stroke="#374151" strokeWidth="0.5" />
                  <polygon points="50,20 82.1,43.4 69.9,81.4 30.1,81.4 17.9,43.4" fill="none" stroke="#1f2937" strokeWidth="0.5" />
                  <polygon points="50,35 71.4,50.5 63.3,75.9 36.7,75.9 28.6,50.5" fill="none" stroke="#111827" strokeWidth="0.5" strokeDasharray="1 1" />
                  
                  {/* Grid Axis Lines */}
                  <line x1="50" y1="50" x2="50" y2="5" stroke="#374151" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="92.8" y2="36.2" stroke="#374151" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="76.5" y2="86.8" stroke="#374151" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="23.5" y2="86.8" stroke="#374151" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="7.2" y2="36.2" stroke="#374151" strokeWidth="0.5" />

                  {/* Filled Radar Area */}
                  <polygon 
                    points="50,32 86.4,38.3 52.7,53.7 47.4,53.7 24.3,41.7" 
                    fill="#34d399" 
                    fillOpacity="0.25" 
                    stroke="#10b981" 
                    strokeWidth="1.2" 
                  />

                  {/* Radar Vertices Dots */}
                  <circle cx="50" cy="32" r="1.5" fill="#f59e0b" />
                  <circle cx="86.4" cy="38.3" r="1.5" fill="#10b981" />
                  <circle cx="24.3" cy="41.7" r="1.5" fill="#06b6d4" />
                </svg>
              </div>

              {/* Labels on vertices */}
              <div className="absolute top-2 text-[8px] font-bold text-amber-400 tracking-wider">SEALED (12%)</div>
              <div className="absolute right-4 bottom-12 text-[8px] font-bold text-emerald-400 tracking-wider">CIB (69%)</div>
              <div className="absolute left-4 bottom-12 text-[8px] font-bold text-cyan-400 tracking-wider">LOOSE (19%)</div>

              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0f0f10]/10 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[#18191b] border border-gray-800 text-gray-400 text-xs px-3.5 py-1.5 rounded-lg shadow-xl font-mono">
                  [Marcador: Gráfica de Radar - Ratio de copias Loose vs CIB vs Sealed]
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
