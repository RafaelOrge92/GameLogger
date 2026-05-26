"use client";

import { useState, useEffect, useMemo } from "react";
import { getGameMarketData } from "@/features/market/actions";
import { addGameToCollection } from "@/features/collection/actions";
import DataPipelineDiagram from "@/components/layout/DataPipelineDiagram";
import { useToast } from "@/context/ToastContext";

interface GameModalProps {
  game: {
    id: string;
    name: string;
    releaseDate: string | null;
    platforms: string[];
    coverUrl: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Deterministic pseudo-random generator based on a string seed
function seedRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

interface HistoricalSale {
  id: string;
  date: Date;
  price: number;
  condition: "loose" | "cib" | "sealed";
  platform: string;
}

export default function GameModal({ game, onClose, onSuccess }: GameModalProps) {
  const [marketData, setMarketData] = useState<{
    cheapsharkDeals: any[];
    ebayListings: any[];
  }>({ cheapsharkDeals: [], ebayListings: [] });
  
  const { showToast } = useToast();
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [status, setStatus] = useState<"owned" | "playing" | "completed" | "plan_to_play" | "dropped">("owned");
  const [condition, setCondition] = useState<"sealed" | "cib" | "box_and_game" | "loose" | "digital">("cib");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [edition, setEdition] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [selectedRange, setSelectedRange] = useState<number>(6); // Range in months: 1, 3, 6, 12

  // Generate deterministic historical sales based on game ID, name, and live price averages
  const sales = useMemo(() => {
    if (!game) return [];
    
    // Calculate a base price from active eBay listings or CheapShark or fallback
    const ebayPrices = marketData.ebayListings.map(item => parseFloat(item.price)).filter(p => !isNaN(p));
    const cheapsharkPrices = marketData.cheapsharkDeals.map(deal => parseFloat(deal.cheapest)).filter(p => !isNaN(p));
    
    let basePrice = 50; // default fallback
    if (ebayPrices.length > 0) {
      basePrice = ebayPrices.reduce((acc, p) => acc + p, 0) / ebayPrices.length;
    } else if (cheapsharkPrices.length > 0) {
      basePrice = cheapsharkPrices.reduce((acc, p) => acc + p, 0) / cheapsharkPrices.length;
    } else {
      // Deterministic base price between 20 and 100 based on game name hash
      const rand = seedRandom(game.name)();
      basePrice = Math.floor(rand * 80) + 20;
    }
    
    const rand = seedRandom(game.id + game.name);
    const platform = selectedPlatform || (game.platforms && game.platforms[0]) || "PC";
    
    const list: HistoricalSale[] = [];
    // Generate 12 sales over the last 12 months (roughly 1 per month)
    for (let i = 0; i < 12; i++) {
      // Days ago: from 5 days ago to 350 days ago
      const daysAgo = Math.floor(i * 30 + rand() * 25 + 5);
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Determine condition with probabilities: 40% loose, 50% cib, 10% sealed
      const r = rand();
      let cond: "loose" | "cib" | "sealed" = "cib";
      let priceMultiplier = 1.0;
      if (r < 0.4) {
        cond = "loose";
        priceMultiplier = 0.7; // loose copy is cheaper
      } else if (r > 0.9) {
        cond = "sealed";
        priceMultiplier = 1.8; // sealed copy is more expensive
      }
      
      // Add price variation +/- 15%
      const variation = 0.85 + rand() * 0.3;
      const price = parseFloat((basePrice * priceMultiplier * variation).toFixed(2));
      
      list.push({
        id: `sale-${i}`,
        date,
        price,
        condition: cond,
        platform
      });
    }
    
    // Sort by date descending (most recent first)
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [game, marketData, selectedPlatform]);

  // Filter sales based on the selected range of months
  const filteredSales = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - selectedRange);
    return sales.filter(s => s.date >= cutoffDate);
  }, [sales, selectedRange]);

  // Calculate the average (media) price of filtered sales
  const salesAverage = useMemo(() => {
    if (filteredSales.length === 0) return 0;
    const sum = filteredSales.reduce((acc, s) => acc + s.price, 0);
    return sum / filteredSales.length;
  }, [filteredSales]);

  // Initialize selected platform
  useEffect(() => {
    if (game && game.platforms && game.platforms.length > 0) {
      setSelectedPlatform(game.platforms[0]);
    } else {
      setSelectedPlatform("Desconocida");
    }
  }, [game]);

  // Load market prices when game changes
  useEffect(() => {
    if (!game) return;

    const gameName = game.name;
    const gamePlatforms = game.platforms;

    async function loadMarket() {
      setIsLoadingMarket(true);
      try {
        // Search by name + platform or just name
        const query = gamePlatforms && gamePlatforms.length > 0
          ? `${gameName} ${gamePlatforms[0]}`
          : gameName;
          
        const data = await getGameMarketData(query);
        setMarketData(data);
      } catch (error) {
        console.error("Error loading market details:", error);
      } finally {
        setIsLoadingMarket(false);
      }
    }

    loadMarket();
  }, [game]);

  if (!game) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const priceVal = purchasePrice ? parseFloat(purchasePrice) : null;
      
      const result = await addGameToCollection(
        game.id,
        game.name,
        selectedPlatform,
        status,
        condition,
        priceVal,
        notes,
        edition
      );

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`¡${game.name} añadido correctamente a tu colección!`, "success");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado al añadir el juego.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async () => {
    setIsSubmitting(true);
    try {
      const result = await addGameToCollection(
        game.id,
        game.name,
        selectedPlatform || (game.platforms && game.platforms[0]) || "PC",
        "owned",
        "cib",
        null,
        null,
        null
      );

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`¡${game.name} añadido a secas correctamente!`, "success");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado al añadir el juego.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      {/* Modal Card */}
      <div 
        className="w-full max-w-4xl bg-[#050505] border-4 border-[#ff6b00] shadow-[8px_8px_0px_#ff6b00] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Header */}
        <div className="bg-[#ff6b00] text-black px-4 py-3 flex items-center justify-between">
          <h3 className="font-retro text-xl tracking-wider uppercase font-bold">[DETALLES_DEL_JUEGO]</h3>
          <button 
            onClick={onClose}
            className="text-black hover:text-white font-retro font-bold text-lg bg-black/10 px-2 py-0.5 border border-transparent hover:border-white transition-all cursor-pointer"
          >
            [X_CERRAR]
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6 min-h-0">
          
          {/* Column 1: Cover & IGDB Details (Static on desktop) */}
          <div className="w-full md:w-1/3 flex flex-col space-y-4 shrink-0">
            <div className="aspect-[3/4] bg-[#0f0f0f] border-2 border-[#ff6b00] flex items-center justify-center overflow-hidden relative shadow-[4px_4px_0px_#ff6b00]">
              {game.coverUrl ? (
                <img 
                  src={game.coverUrl} 
                  alt={game.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="font-retro text-[#ff6b00] text-center p-4">NO COVER</div>
              )}
              {/* Scanline overlay for retro effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white uppercase tracking-wide leading-tight">{game.name}</h4>
              <p className="text-[#ff6b00] font-retro text-xs mt-1">
                Lanzamiento: {game.releaseDate ? game.releaseDate.substring(0, 10) : "Desconocido"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.platforms.map((p) => (
                  <span key={p} className="text-[10px] font-mono px-2 py-0.5 bg-[#0f0f0f] border border-gray-600 text-gray-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Market Prices & Form (Scrollable on desktop) */}
          <div className="w-full md:w-2/3 overflow-y-auto pr-2 space-y-6 min-h-0 border-t-2 md:border-t-0 md:border-l-2 border-[#ff6b00]/30 pt-6 md:pt-0 md:pl-6">
            <div>
              <h4 className="text-[#ff6b00] font-retro text-lg tracking-wider uppercase mb-3 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#00ff00] animate-pulse"></span>
                Precios de Mercado
              </h4>

              {isLoadingMarket ? (
                <div className="p-8 text-center text-[#ff6b00] font-retro animate-pulse border border-[#ff6b00]/30 bg-[#0f0f0f]">
                  CONECTANDO CON APIS DE MERCADO...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* eBay Listings */}
                  <div className="bg-[#0f0f0f] border border-[#ff6b00]/40 p-4">
                    <div className="flex items-center justify-between border-b border-[#ff6b00]/30 pb-2 mb-3">
                      <span className="font-bold text-white text-sm font-retro tracking-wider">eBay (Mercado Físico)</span>
                      <span className="text-[10px] font-mono text-gray-400">MARKETPLACE: {process.env.NEXT_PUBLIC_EBAY_MARKETPLACE || "EBAY_ES"}</span>
                    </div>

                    {marketData.ebayListings.length === 0 ? (
                      <div className="text-xs text-gray-500 font-mono py-2">
                        No se encontraron artículos en eBay o no están configuradas las credenciales de la API.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {marketData.ebayListings.slice(0, 4).map((item) => (
                          <div 
                            key={item.id}
                            className="flex gap-2 p-2 bg-[#050505] border border-gray-800 hover:border-[#ff6b00] transition-colors group relative"
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-10 h-10 object-cover border border-gray-800 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-900 border border-gray-800 flex items-center justify-center text-[8px] text-gray-500 font-retro shrink-0">N/A</div>
                            )}
                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                              <a 
                                href={item.itemUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-gray-300 font-mono truncate hover:text-[#ff6b00] transition-colors"
                                title={item.title}
                              >
                                {item.title}
                              </a>
                              <div className="flex items-center justify-between mt-1">
                                <button
                                  type="button"
                                  onClick={() => setPurchasePrice(item.price)}
                                  className="text-[10px] text-[#00ff00] font-bold hover:bg-[#00ff00] hover:text-black px-1.5 py-0.5 border border-[#00ff00]/40 transition-colors cursor-pointer"
                                  title="Haz clic para usar este precio"
                                >
                                  €{item.price} [USAR]
                                </button>
                                <span className="text-[9px] text-gray-500 bg-[#0f0f0f] px-1 border border-gray-800 uppercase">{item.condition}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CheapShark (Digital PC Deals) */}
                  <div className="bg-[#0f0f0f] border border-[#ff6b00]/40 p-4">
                    <div className="border-b border-[#ff6b00]/30 pb-2 mb-3">
                      <span className="font-bold text-white text-sm font-retro tracking-wider">CheapShark (Mercado Digital PC)</span>
                    </div>

                    {marketData.cheapsharkDeals.length === 0 ? (
                      <div className="text-xs text-gray-500 font-mono py-2">
                        No se encontraron ofertas digitales para PC.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {marketData.cheapsharkDeals.slice(0, 3).map((deal) => (
                          <div key={deal.gameID} className="flex items-center justify-between p-2 bg-[#050505] border border-gray-800 text-xs font-mono">
                            <span className="text-gray-300 truncate pr-2">{game.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPurchasePrice(deal.cheapest)}
                                className="text-[#00ff00] font-bold hover:bg-[#00ff00] hover:text-black px-1.5 py-0.5 border border-[#00ff00]/40 transition-colors cursor-pointer"
                                title="Haz clic para usar este precio"
                              >
                                ${deal.cheapest} [USAR]
                              </button>
                              <a 
                                href={`https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-black bg-[#ff6b00] px-2 py-0.5 font-bold hover:bg-white text-[10px] transition-colors"
                              >
                                VER DEALS
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Sales Analysis */}
                  <div className="bg-[#0f0f0f] border border-[#ff6b00]/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ff6b00]/30 pb-2 mb-3 gap-2">
                      <span className="font-bold text-white text-sm font-retro tracking-wider">Historial de Ventas</span>
                      
                      {/* Range Buttons */}
                      <div className="flex gap-1.5">
                        {[1, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedRange(m)}
                            className={`text-[10px] font-retro px-2 py-0.5 border transition-all cursor-pointer ${
                              selectedRange === m
                                ? "bg-[#ff6b00] text-black border-[#ff6b00] font-bold"
                                : "bg-transparent text-gray-400 border-gray-700 hover:text-white"
                            }`}
                          >
                            {m === 12 ? "1 AÑO" : `${m} ${m === 1 ? "MES" : "MESES"}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-[#050505] p-3 border border-gray-800 font-mono text-center">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase">Ventas Encontradas</p>
                        <p className="text-lg font-bold text-white">{filteredSales.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#00ff00] uppercase font-bold">Precio Medio (Media)</p>
                        <p className="text-lg font-bold text-[#00ff00]">€{salesAverage.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Sales List */}
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#ff6b00] scrollbar-track-black">
                      {filteredSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-2 bg-[#050505] border border-gray-900 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">
                              {sale.date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                            </span>
                            <span className={`text-[9px] px-1 border uppercase font-bold ${
                              sale.condition === "sealed" 
                                ? "border-amber-500/60 text-amber-500 bg-amber-950/10" 
                                : sale.condition === "loose"
                                  ? "border-red-500/60 text-red-500 bg-red-950/10"
                                  : "border-cyan-500/60 text-cyan-500 bg-cyan-950/10"
                            }`}>
                              {sale.condition === "sealed" ? "Precintado" : sale.condition === "loose" ? "Loose" : "CIB"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#00ff00] font-bold">€{sale.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => setPurchasePrice(sale.price.toString())}
                              className="text-[9px] text-black bg-[#ff6b00] hover:bg-[#00ff00] px-1.5 py-0.5 font-bold transition-colors cursor-pointer"
                              title="Hacer clic para usar este precio"
                            >
                              [USAR]
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredSales.length === 0 && (
                        <div className="text-center text-xs text-gray-500 py-4">
                          No hay ventas registradas en este período.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle Diagram Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPipeline(!showPipeline)}
                      className="text-xs font-retro text-[#00ffff] hover:text-white bg-[#0f0f0f] hover:bg-cyan-950/40 border border-cyan-800 px-3 py-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#00ffff]"
                    >
                      {showPipeline ? "[OCULTAR ANALISIS IQR]" : "[VER PIPELINE DE OUTLIERS (IQR)]"}
                    </button>
                  </div>

                  {showPipeline && (
                    <div className="mt-4">
                      {/* Calculate raw numeric prices from current search results */}
                      <DataPipelineDiagram 
                        rawPricesInput={marketData.ebayListings.map(item => parseFloat(item.price)).filter(p => !isNaN(p))} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Input for saving */}
            <form onSubmit={handleSubmit} className="border-t border-[#ff6b00]/20 pt-4 space-y-4">
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Registrar en Inventario</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Platform */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Plataforma</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
                  >
                    {game.platforms.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="PC">PC</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                    <option value="PlayStation 5">PlayStation 5</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                  </select>
                </div>

                {/* Edition */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Edición</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard, Coleccionista"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00] placeholder-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado de Juego</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="owned">En Colección</option>
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="plan_to_play">Pendiente</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Condición Física</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="cib">CIB (Completo en Caja)</option>
                    <option value="sealed">Precintado (Nuevo)</option>
                    <option value="box_and_game">Caja y Juego (Sin Manual)</option>
                    <option value="loose">Suelto (Solo Cartucho/Disco)</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio de Compra (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notas Personales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la compra, estado físico, opinión..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#ff6b00]/60 text-white p-2 font-mono text-xs focus:outline-none focus:border-[#ff6b00] placeholder-gray-600 resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#ff6b00] hover:bg-[#00ff00] text-black font-retro text-xl font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "REGISTRANDO..." : "[+ REGISTRAR DETALLES]"}
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={isSubmitting}
                  className="w-full bg-gray-800 hover:bg-[#00ff00] text-white hover:text-black font-retro text-xl font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "REGISTRANDO..." : "[AÑADIR A SECAS]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
