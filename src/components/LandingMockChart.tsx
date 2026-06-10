"use client";

import { useMemo } from "react";
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
        zIndex: 100,
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

export default function LandingMockChart() {
  const chartData = useMemo(() => {
    const data = [];
    const totalPoints = 30;
    
    let inversion = 3200;
    let valorMedio = 3400;
    let valorActual = 3800;

    for (let i = 0; i < totalPoints; i++) {
      if (i % 3 === 0 && i > 0) {
        inversion += Math.floor(Math.sin(i) * 50) + 120;
      }
      
      const wave = Math.sin(i / 1.8) * 120 + Math.cos(i / 3) * 60;
      const trend = i * 45;
      
      valorMedio = Math.floor(3400 + trend + wave);
      valorActual = Math.floor(3800 + trend * 1.15 + wave * 1.25);

      if (valorMedio < inversion) valorMedio = Math.floor(inversion * 1.05);
      if (valorActual < valorMedio) valorActual = Math.floor(valorMedio * 1.08);

      let day = 12 + i;
      let month = "May";
      if (day > 31) {
        day = day - 31;
        month = "Jun";
      }

      data.push({
        label: `${day} ${month}`,
        inversion,
        valorMedio,
        valorActual,
      });
    }

    data[totalPoints - 1] = {
      label: "10 Jun",
      inversion: 4700,
      valorMedio: 4950,
      valorActual: 5280,
    };

    return data;
  }, []);

  return (
    <div className="h-40 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          
          <XAxis
            dataKey="label"
            stroke="transparent"
            tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            interval={5}
          />

          <YAxis
            stroke="transparent"
            tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) =>
              val >= 1000 ? `€${(val / 1000).toFixed(1)}k` : `€${val}`
            }
            width={52}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "rgba(255,255,255,0.06)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Legend
            verticalAlign="top"
            content={<CustomLegend />}
          />

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

          <Line
            type="monotone"
            dataKey="valorActual"
            name="valorActual"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
          />

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
  );
}
