"use client";

import { useState, useEffect } from "react";
import PortfolioChart from "./PortfolioChart";
import { BarChart3, Search } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const PIE_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#fbbf24", "#f43f5e", "#ec4899", "#3b82f6"];
const BACKLOG_COLORS = ["#34d399", "#8b5cf6", "#06b6d4", "#f43f5e", "#fb923c"];

export default function TabsDashboard() {
  const [activeTab, setActiveTab] = useState("evolucion");
  const [filtroPlataforma, setFiltroPlataforma] = useState("");
  const [filtroRegion, setFiltroRegion] = useState("");
  const [rangoEvolucion, setRangoEvolucion] = useState("1y");
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const tabs = [
    { id: "evolucion", label: "Evolución" },
    { id: "comparativa", label: "Comparativa" },
    { id: "region", label: "Región" },
    { id: "sistemas", label: "Sistemas" },
    { id: "estado", label: "Estado" },
    { id: "backlog", label: "Backlog" },
  ];

  // Client-side mount check to prevent SSR hydration issues with Recharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeRange = rangoEvolucion;

  // Fetch stats when filters or range changes
  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filtroPlataforma) queryParams.append("platform", filtroPlataforma);
        if (filtroRegion) queryParams.append("region", filtroRegion);
        if (activeRange) queryParams.append("range", activeRange);

        const response = await fetch(`/api/dashboard/stats?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setStatsData(data);
        } else {
          console.error("Failed to fetch dashboard stats");
          setStatsData(getEmptyData());
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStatsData(getEmptyData());
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isMounted) {
      fetchStats();
    }
  }, [filtroPlataforma, filtroRegion, activeRange, isMounted]);

  if (!isMounted) {
    return <SkeletonLoader />;
  }

  if (isLoading) {
    return <SkeletonLoader />;
  }

  const isEmpty = !statsData || 
    (statsData.evolucion?.length === 0 && 
     statsData.region?.length === 0 && 
     statsData.sistemas?.length === 0 && 
     statsData.estado?.length === 0 && 
     statsData.backlog?.length === 0);

  return (
    <div className="bg-[#18191b] rounded-xl border border-gray-800 p-5 md:p-6 w-full shadow-2xl transition-all duration-300">
      
      {/* Upper Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-[#0f0f10]/60 rounded-lg border border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Filtros:</span>
        </div>
        
        {/* Platform Dropdown */}
        <select
          value={filtroPlataforma}
          onChange={(e) => setFiltroPlataforma(e.target.value)}
          className="bg-[#18191b] border border-gray-800 text-gray-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          <option value="">Todas las Plataformas</option>
          <option value="SNES">Super Nintendo (SNES)</option>
          <option value="Nintendo 64">Nintendo 64</option>
          <option value="PlayStation">PlayStation</option>
          <option value="GameCube">GameCube</option>
          <option value="Mega Drive">Sega Mega Drive</option>
          <option value="Game Boy">Game Boy</option>
        </select>

        {/* Region Dropdown */}
        <select
          value={filtroRegion}
          onChange={(e) => setFiltroRegion(e.target.value)}
          className="bg-[#18191b] border border-gray-800 text-gray-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          <option value="">Todas las Regiones</option>
          <option value="PAL-ES">PAL-ES</option>
          <option value="PAL-UK">PAL-UK</option>
          <option value="NTSC-U">NTSC-U</option>
          <option value="NTSC-J">NTSC-J</option>
        </select>

        {/* Clear Filters Button */}
        {(filtroPlataforma || filtroRegion) && (
          <button
            onClick={() => {
              setFiltroPlataforma("");
              setFiltroRegion("");
            }}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Header and Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Analíticas de Colección</span>
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
      <div className="pt-6 min-h-[340px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="border border-dashed border-gray-800 rounded-xl bg-[#0f0f10]/20 p-8 text-center flex flex-col items-center justify-center min-h-[260px] animate-[fadeIn_0.3s_ease-out]">
            <Search className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-sm font-semibold text-gray-300">No hay datos para los filtros seleccionados</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Prueba a registrar juegos o modifica los selectores superiores para ver tus estadísticas.</p>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col justify-between">
            
            {/* Pestaña: Evolución */}
            {activeTab === "evolucion" && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] w-full">
                {/* Stats recap */}
                {statsData.evolucion?.length > 0 && (
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Valor Estimado de Cartera</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          €{statsData.evolucion[statsData.evolucion.length - 1].valorTotal.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          Inversión: €{statsData.evolucion[statsData.evolucion.length - 1].inversionTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Range Selector Button Group */}
                    <div className="flex bg-[#0f0f10] p-0.5 rounded border border-gray-800/80">
                      <button
                        onClick={() => setRangoEvolucion("30d")}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          rangoEvolucion === "30d"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                        }`}
                      >
                        30 días
                      </button>
                      <button
                        onClick={() => setRangoEvolucion("1y")}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          rangoEvolucion === "1y"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                        }`}
                      >
                        1 Año
                      </button>
                    </div>
                  </div>
                )}
                {/* Recharts AreaChart */}
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={statsData.evolucion} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInversion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="fecha" stroke="#4b5563" fontSize={10} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18191b", borderColor: "#374151", borderRadius: "8px" }}
                        labelStyle={{ color: "#9ca3af", fontWeight: "bold", fontSize: "11px" }}
                        itemStyle={{ fontSize: "12px" }}
                        formatter={(value: any, name: any) => [
                          `€${parseFloat(value).toFixed(2)}`,
                          name === "valorTotal" ? "Valor de Mercado" : "Inversión Total"
                        ]}
                      />
                      <Area type="monotone" dataKey="valorTotal" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValor)" />
                      <Area type="monotone" dataKey="inversionTotal" stroke="#6b7280" strokeWidth={1.5} fillOpacity={1} fill="url(#colorInversion)" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pestaña: Comparativa — Portfolio Performance Simulator */}
            {activeTab === "comparativa" && (
              <PortfolioChart
                platformFilter={filtroPlataforma}
                regionFilter={filtroRegion}
              />
            )}

            {/* Pestaña: Región */}
            {activeTab === "region" && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Recharts PieChart (Donut) */}
                  <div className="md:col-span-2 flex justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statsData.region}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statsData.region.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18191b", borderColor: "#374151", borderRadius: "8px" }}
                          itemStyle={{ color: "#fff", fontSize: "12px" }}
                          formatter={(value: any) => [value, "Juegos"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Colored Legend */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-none">
                    {statsData.region.map((item: any, index: number) => (
                      <div key={item.name} className="flex items-center justify-between p-2 bg-[#0f0f10] border border-gray-800/80 rounded-md">
                        <span className="text-xs text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-white">{item.value} {item.value === 1 ? "juego" : "juegos"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña: Sistemas */}
            {activeTab === "sistemas" && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] w-full">
                {/* Recharts Horizontal BarChart */}
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={statsData.sistemas}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                      <XAxis type="number" stroke="#4b5563" fontSize={10} tickLine={false} tickFormatter={(val) => `€${val}`} />
                      <YAxis dataKey="sistema" type="category" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18191b", borderColor: "#374151", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "12px" }}
                        formatter={(value: any, name: any) => {
                          if (name === "valor") return [`€${parseFloat(value).toFixed(2)}`, "Valor de Mercado"];
                          return [value, "Juegos"];
                        }}
                      />
                      <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pestaña: Estado */}
            {activeTab === "estado" && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Recharts RadarChart */}
                  <div className="md:col-span-2 flex justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={statsData.estado}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                        <PolarRadiusAxis stroke="#374151" angle={30} domain={[0, 100]} fontSize={8} />
                        <Radar name="Proporción" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Summary list */}
                  <div className="space-y-3">
                    {statsData.estado.map((item: any) => (
                      <div key={item.subject} className="p-3 bg-[#0f0f10] border border-gray-800 rounded-lg text-center md:text-left">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{item.subject}</p>
                        <p className="text-xl font-extrabold text-white mt-0.5">{item.A}%</p>
                        <p className="text-[10px] text-gray-500">Porcentaje de conservación</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña: Backlog */}
            {activeTab === "backlog" && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Backlog Donut Chart */}
                  <div className="md:col-span-2 flex justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statsData.backlog}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statsData.backlog.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={BACKLOG_COLORS[index % BACKLOG_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18191b", borderColor: "#374151", borderRadius: "8px" }}
                          itemStyle={{ color: "#fff", fontSize: "12px" }}
                          formatter={(value: any) => [value, "Juegos"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-none">
                    {statsData.backlog.map((item: any, index: number) => (
                      <div key={item.name} className="flex items-center justify-between p-2 bg-[#0f0f10] border border-gray-800/80 rounded-md">
                        <span className="text-xs text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: BACKLOG_COLORS[index % BACKLOG_COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-white">{item.value} {item.value === 1 ? "juego" : "juegos"}</span>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

function getEmptyData() {
  return {
    evolucion: [],
    region: [],
    sistemas: [],
    estado: [],
    backlog: [],
    comparativa: {
      precioActual: 0,
      precioMedio: 0,
      precioMaximo: 0
    }
  };
}

function SkeletonLoader() {
  return (
    <div className="bg-[#18191b] rounded-xl border border-gray-800 p-5 md:p-6 w-full shadow-2xl animate-pulse space-y-6">
      {/* Filters bar skeleton */}
      <div className="h-12 w-full bg-[#0f0f10]/60 rounded-lg border border-gray-800/60"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-800 rounded"></div>
          <div className="h-3 w-60 bg-gray-800 rounded"></div>
        </div>
        <div className="h-8 w-60 bg-gray-800 rounded"></div>
      </div>
      
      <div className="pt-6 min-h-[340px] flex flex-col justify-between space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-16 w-32 bg-gray-800 rounded-lg"></div>
          <div className="h-16 w-48 bg-gray-800 rounded-lg"></div>
        </div>
        <div className="h-48 w-full bg-gray-800/60 rounded-xl"></div>
      </div>
    </div>
  );
}
