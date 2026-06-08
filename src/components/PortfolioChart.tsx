"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioPoint {
  date: string;
  label: string;
  inversion: number;
  valorActual: number;
  valorMedio: number;
}

interface PortfolioSummary {
  inversionTotal: number;
  valorActualActual: number;
  valorMedioActual: number;
  gananciaAbsoluta: number;
  gananciaPct: number;
}

interface PortfolioData {
  chartData: PortfolioPoint[];
  summary: PortfolioSummary;
}

interface PortfolioChartProps {
  platformFilter?: string;
  regionFilter?: string;
}

type Range = "30d" | "60d" | "90d";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const labelMap: Record<string, string> = {
    inversion: "Mi Inversión",
    valorActual: "Valor Actual (Máx.)",
    valorMedio: "Valor Medio (Cond.)",
  };

  return (
    <div
      style={{
        backgroundColor: "#212427",
        border: "1px solid #374151",
        borderRadius: "10px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: "200px",
      }}
    >
      <p
        style={{
          color: "#9ca3af",
          fontSize: "11px",
          fontWeight: "700",
          marginBottom: "10px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              color: entry.color,
              fontSize: "11px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            {labelMap[entry.dataKey] ?? entry.name}
          </span>
          <span
            style={{
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
            }}
          >
            €{entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────

interface LegendPayloadItem {
  value: string;
  color: string;
  dataKey?: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  const labelMap: Record<string, string> = {
    inversion: "Mi Inversión",
    valorActual: "Valor Actual (Máx.)",
    valorMedio: "Valor Medio (Cond.)",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        paddingRight: "8px",
        paddingBottom: "4px",
      }}
    >
      {payload.map((entry) => (
        <div
          key={entry.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "2px",
              backgroundColor: entry.color,
              borderRadius: "1px",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#9ca3af",
              fontSize: "10px",
              fontWeight: "600",
              letterSpacing: "0.03em",
            }}
          >
            {labelMap[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  color: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "flat";
}

function StatCard({
  label,
  value,
  subValue,
  color,
  glowColor,
  borderColor,
  bgColor,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle glow orb */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: glowColor,
          filter: "blur(30px)",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color, opacity: 0.85 }}>{icon}</span>
        <span
          style={{
            color: "#6b7280",
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span
          style={{
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: "900",
            fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              color:
                trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#9ca3af",
            }}
          >
            {trend === "up" ? (
              <ArrowUpRight size={14} />
            ) : trend === "down" ? (
              <ArrowDownRight size={14} />
            ) : (
              <Minus size={14} />
            )}
          </span>
        )}
      </div>
      {subValue && (
        <span
          style={{
            color: "#4b5563",
            fontSize: "10px",
            fontWeight: "500",
          }}
        >
          {subValue}
        </span>
      )}
    </div>
  );
}

// ─── Range Selector Button ────────────────────────────────────────────────────

interface RangeBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function RangeBtn({ active, onClick, children }: RangeBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        border: active ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
        backgroundColor: active ? "rgba(16,185,129,0.08)" : "transparent",
        color: active ? "#10b981" : "#6b7280",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PortfolioChart({ platformFilter = "", regionFilter = "" }: PortfolioChartProps) {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (platformFilter) params.append("platform", platformFilter);
      if (regionFilter) params.append("region", regionFilter);

      const res = await fetch(`/api/analytics/portfolio?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("[PortfolioChart] fetch error:", err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [range, platformFilter, regionFilter]);

  useEffect(() => {
    if (isMounted) {
      fetchData();
    }
  }, [fetchData, isMounted]);

  if (!isMounted || isLoading) {
    return <PortfolioSkeleton />;
  }

  const empty = !data || !data.chartData || data.chartData.length === 0;
  const { summary, chartData } = data ?? {
    summary: {
      inversionTotal: 0,
      valorActualActual: 0,
      valorMedioActual: 0,
      gananciaAbsoluta: 0,
      gananciaPct: 0,
    },
    chartData: [],
  };

  const trend: "up" | "down" | "flat" =
    summary.gananciaAbsoluta > 0
      ? "up"
      : summary.gananciaAbsoluta < 0
      ? "down"
      : "flat";

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out] w-full">

      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={16} color="#10b981" />
          </div>
          <div>
            <h3
              style={{
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Simulador de Portafolio
            </h3>
            <p
              style={{
                color: "#4b5563",
                fontSize: "10px",
                fontWeight: "500",
                marginTop: "1px",
              }}
            >
              Inversión real vs. precio máximo vs. media por condición
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#0f0f10",
            padding: "3px",
            borderRadius: "8px",
            border: "1px solid #1f2937",
            gap: "2px",
          }}
        >
          <RangeBtn active={range === "30d"} onClick={() => setRange("30d")}>
            1 Mes
          </RangeBtn>
          <RangeBtn active={range === "60d"} onClick={() => setRange("60d")}>
            2 Meses
          </RangeBtn>
          <RangeBtn active={range === "90d"} onClick={() => setRange("90d")}>
            3 Meses
          </RangeBtn>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Inversión"
          value={`€${summary.inversionTotal.toFixed(2)}`}
          subValue="Coste de adquisición"
          color="#9ca3af"
          glowColor="#6b7280"
          borderColor="rgba(107,114,128,0.2)"
          bgColor="rgba(107,114,128,0.04)"
          icon={<DollarSign size={12} />}
        />
        <StatCard
          label="Valor Actual (Máx)"
          value={`€${summary.valorActualActual.toFixed(2)}`}
          subValue="Precio más alto del mercado"
          color="#10b981"
          glowColor="#10b981"
          borderColor="rgba(16,185,129,0.2)"
          bgColor="rgba(16,185,129,0.04)"
          icon={<TrendingUp size={12} />}
          trend={trend}
        />
        <StatCard
          label="Valor Medio"
          value={`€${summary.valorMedioActual.toFixed(2)}`}
          subValue="Precio medio por condición"
          color="#8b5cf6"
          glowColor="#8b5cf6"
          borderColor="rgba(139,92,246,0.2)"
          bgColor="rgba(139,92,246,0.04)"
          icon={<Activity size={12} />}
        />
        <StatCard
          label="Rentabilidad"
          value={`${summary.gananciaPct >= 0 ? "+" : ""}${summary.gananciaPct.toFixed(1)}%`}
          subValue={`${summary.gananciaAbsoluta >= 0 ? "+" : ""}€${summary.gananciaAbsoluta.toFixed(2)}`}
          color={trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#9ca3af"}
          glowColor={trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#6b7280"}
          borderColor={
            trend === "up"
              ? "rgba(16,185,129,0.2)"
              : trend === "down"
              ? "rgba(244,63,94,0.2)"
              : "rgba(107,114,128,0.2)"
          }
          bgColor={
            trend === "up"
              ? "rgba(16,185,129,0.04)"
              : trend === "down"
              ? "rgba(244,63,94,0.04)"
              : "rgba(107,114,128,0.04)"
          }
          icon={
            trend === "up" ? (
              <ArrowUpRight size={12} />
            ) : trend === "down" ? (
              <ArrowDownRight size={12} />
            ) : (
              <Minus size={12} />
            )
          }
          trend={trend}
        />
      </div>

      {/* ── Chart ── */}
      {empty ? (
        <div
          style={{
            border: "1px dashed #1f2937",
            borderRadius: "12px",
            backgroundColor: "rgba(15,15,16,0.2)",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "220px",
            gap: "8px",
          }}
        >
          <Activity size={28} color="#374151" />
          <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: "600" }}>
            Sin datos para el período seleccionado
          </p>
          <p style={{ color: "#374151", fontSize: "11px" }}>
            Registra juegos con precio de compra para ver tu simulador de portafolio.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#18191b",
            borderRadius: "12px",
            border: "1px solid #1f2937",
            padding: "16px 8px 8px 0",
          }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 20, left: -10, bottom: 0 }}
            >
              {/* Subtle grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              {/* X Axis */}
              <XAxis
                dataKey="label"
                stroke="transparent"
                tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval={range === "30d" ? 4 : range === "60d" ? 6 : 8}
              />

              {/* Y Axis */}
              <YAxis
                stroke="transparent"
                tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  val >= 1000
                    ? `€${(val / 1000).toFixed(1)}k`
                    : `€${val}`
                }
                width={52}
              />

              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.06)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Legend top-right */}
              <Legend
                verticalAlign="top"
                content={<CustomLegend />}
              />

              {/* Line 1 — Inversión (grey/white, baseline cost) */}
              <Line
                type="monotone"
                dataKey="inversion"
                name="inversion"
                stroke="#9ca3af"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#9ca3af", strokeWidth: 0 }}
                strokeDasharray="6 3"
              />

              {/* Line 2 — Valor Actual Máximo (emerald green) */}
              <Line
                type="monotone"
                dataKey="valorActual"
                name="valorActual"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
              />

              {/* Line 3 — Valor Medio por Condición (electric violet) */}
              <Line
                type="monotone"
                dataKey="valorMedio"
                name="valorMedio"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#8b5cf6", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Legend helper text ── */}
      {!empty && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            paddingTop: "2px",
          }}
        >
          {[
            {
              color: "#9ca3af",
              dash: true,
              label: "Inversión total acumulada (coste real de compra)",
            },
            {
              color: "#10b981",
              dash: false,
              label: "Valor máximo: precio más alto registrado en el mercado",
            },
            {
              color: "#8b5cf6",
              dash: false,
              label: "Valor medio: precio promedio según estado de conservación",
            },
          ].map(({ color, dash, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="20" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={dash ? "5 3" : undefined}
                />
              </svg>
              <span
                style={{
                  color: "#4b5563",
                  fontSize: "9px",
                  fontWeight: "500",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PortfolioSkeleton() {
  return (
    <div className="space-y-5 w-full animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-3 w-36 bg-gray-800 rounded" />
            <div className="h-2 w-52 bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-8 w-40 bg-gray-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="h-72 bg-gray-800/60 rounded-xl" />
    </div>
  );
}
