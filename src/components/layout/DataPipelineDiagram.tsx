"use client";

import { cleanPricesIQR, PriceStatsResult } from "@/features/market/utils/priceStats";

interface DataPipelineDiagramProps {
  rawPricesInput: number[];
}

export default function DataPipelineDiagram({ rawPricesInput }: DataPipelineDiagramProps) {
  // Use example data from the prompt if the input array is too small to calculate statistical IQR meaningfully (need at least 4 items)
  const isUsingExample = !rawPricesInput || rawPricesInput.length < 4;
  const prices = isUsingExample ? [12, 85, 90, 95, 100, 110, 120, 350] : rawPricesInput;
  
  const stats: PriceStatsResult = cleanPricesIQR(prices);

  return (
    <div className="bg-[#0c0c0c] border-2 border-[#ff6b00] p-6 shadow-[6px_6px_0px_#ff6b00] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ff6b00]/30 pb-3">
        <h4 className="text-white font-retro text-md tracking-wider uppercase flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#00ffff] animate-pulse"></span>
          Pipeline de Detección de Outliers (IQR)
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0f0f0f] border border-cyan-800 text-[#00ffff] uppercase mt-2 sm:mt-0">
          {isUsingExample ? "Datos de Ejemplo (Prompt)" : "Datos de eBay en Vivo"}
        </span>
      </div>

      <div className="flex flex-col space-y-4">
        
        {/* Step 1: Input Raw Data */}
        <div className="relative">
          <div className="bg-[#050505] border border-cyan-500/50 p-3 rounded-none relative">
            <span className="absolute -top-2.5 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-[#00ffff] uppercase font-bold">1. Entrada [Raw Data]</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs font-mono text-gray-500 font-bold mr-1">ARRAY:</span>
              {prices.map((p, idx) => (
                <span key={idx} className="text-xs font-mono px-1.5 py-0.5 bg-[#0f0f0f] border border-gray-700 text-gray-300">
                  {p.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center h-4">
            <div className="w-0.5 h-full bg-cyan-500"></div>
          </div>
        </div>

        {/* Step 2: Process - Parse & Sort */}
        <div className="relative">
          <div className="bg-[#050505] border border-cyan-500/50 p-3 rounded-none relative">
            <span className="absolute -top-2.5 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-[#00ffff] uppercase font-bold">2. Procesamiento [Parse & Ordenación]</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs font-mono text-gray-500 font-bold mr-1">ORDENADO:</span>
              {stats.originalPrices.map((p, idx) => (
                <span key={idx} className="text-xs font-mono px-1.5 py-0.5 bg-[#0f0f0f] border border-gray-800 text-cyan-400">
                  {p.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center h-4">
            <div className="w-0.5 h-full bg-cyan-500"></div>
          </div>
        </div>

        {/* Step 3 & 4: Math Calculations (Q1, Q3, IQR & Bounds) */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 3: Mathematics */}
            <div className="bg-[#050505] border border-amber-500/50 p-3 rounded-none relative">
              <span className="absolute -top-2.5 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-amber-500 uppercase font-bold">3. Cálculo de Percentiles</span>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs text-gray-300">
                <div className="bg-[#0f0f0f] p-1.5 border border-gray-800 text-center">
                  <p className="text-[9px] text-gray-500">Q1 (25%)</p>
                  <p className="font-bold text-white">{stats.q1.toFixed(2)}</p>
                </div>
                <div className="bg-[#0f0f0f] p-1.5 border border-gray-800 text-center">
                  <p className="text-[9px] text-gray-500">Q3 (75%)</p>
                  <p className="font-bold text-white">{stats.q3.toFixed(2)}</p>
                </div>
                <div className="bg-[#0f0f0f] p-1.5 border border-gray-800 text-center">
                  <p className="text-[9px] text-gray-500">IQR (Q3-Q1)</p>
                  <p className="font-bold text-amber-500">{stats.iqr.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Box 4: Threshold Bounds */}
            <div className="bg-[#050505] border border-amber-500/50 p-3 rounded-none relative">
              <span className="absolute -top-2.5 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-amber-500 uppercase font-bold">4. Límites Estadísticos (IQR * 1.5)</span>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs text-gray-300">
                <div className="bg-[#0f0f0f] p-1.5 border border-gray-800 text-center">
                  <p className="text-[9px] text-gray-500">Límite Inferior (Q1 - 1.5*IQR)</p>
                  <p className="font-bold text-amber-500">{stats.lowerBound.toFixed(2)}</p>
                </div>
                <div className="bg-[#0f0f0f] p-1.5 border border-gray-800 text-center">
                  <p className="text-[9px] text-gray-500">Límite Superior (Q3 + 1.5*IQR)</p>
                  <p className="font-bold text-amber-500">{stats.upperBound.toFixed(2)}</p>
                </div>
              </div>
            </div>

          </div>
          {/* Arrow */}
          <div className="flex justify-center h-4">
            <div className="w-0.5 h-full bg-amber-500"></div>
          </div>
        </div>

        {/* Step 5: Filter step (Evaluations) */}
        <div className="relative">
          <div className="bg-[#050505] border-2 border-dashed border-red-500/40 p-4 rounded-none relative">
            <span className="absolute -top-3 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-red-500 uppercase font-bold">5. Filtro Estadístico [Evaluación de Límites]</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              {/* Keep in Cleaned Array */}
              <div className="bg-[#0f0f0f] p-2.5 border border-cyan-500/30">
                <h5 className="text-[10px] font-mono text-[#00ffff] uppercase font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#00ffff] rounded-full"></span>
                  Mantener en Array Limpio (Dentro de Límites)
                </h5>
                <div className="flex flex-wrap gap-1">
                  {stats.cleanedPrices.map((p, idx) => (
                    <span key={idx} className="text-xs font-mono px-1.5 py-0.5 bg-cyan-950/20 border border-cyan-800 text-[#00ffff]">
                      {p.toFixed(2)}
                    </span>
                  ))}
                  {stats.cleanedPrices.length === 0 && (
                    <span className="text-[10px] font-mono text-gray-600">Ninguno</span>
                  )}
                </div>
              </div>

              {/* Drop Outliers */}
              <div className="bg-[#0f0f0f] p-2.5 border border-red-500/30">
                <h5 className="text-[10px] font-mono text-red-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Descartar como Outlier (Fuera de Límites)
                </h5>
                <div className="flex flex-wrap gap-1">
                  {stats.outliers.map((p, idx) => (
                    <span key={idx} className="text-xs font-mono px-1.5 py-0.5 bg-red-950/20 border border-red-800 text-red-400 line-through">
                      {p.toFixed(2)}
                    </span>
                  ))}
                  {stats.outliers.length === 0 && (
                    <span className="text-[10px] font-mono text-gray-600">No se detectaron outliers</span>
                  )}
                </div>
              </div>
            </div>

          </div>
          {/* Arrow */}
          <div className="flex justify-center h-4">
            <div className="w-0.5 h-full bg-[#00ffff]"></div>
          </div>
        </div>

        {/* Step 6: Final Output Metrics */}
        <div className="bg-[#050505] border-2 border-[#00ffff] p-4 rounded-none relative">
          <span className="absolute -top-3 left-3 px-2 bg-[#0c0c0c] text-[10px] font-mono text-[#00ffff] uppercase font-bold">6. Métricas Finales de Salida</span>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-1 font-mono text-center">
            <div className="bg-cyan-950/10 p-2.5 border border-cyan-500/30">
              <p className="text-[9px] text-gray-500 uppercase">Mínimo Sugerido</p>
              <p className="text-base sm:text-lg font-bold text-white">€{stats.min.toFixed(2)}</p>
            </div>
            <div className="bg-cyan-950/20 p-2.5 border border-[#00ffff]">
              <p className="text-[9px] text-[#00ffff] uppercase font-bold">Precio Promedio</p>
              <p className="text-base sm:text-xl font-bold text-[#00ffff]">€{stats.average.toFixed(2)}</p>
            </div>
            <div className="bg-cyan-950/10 p-2.5 border border-cyan-500/30">
              <p className="text-[9px] text-gray-500 uppercase">Máximo Sugerido</p>
              <p className="text-base sm:text-lg font-bold text-white">€{stats.max.toFixed(2)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
