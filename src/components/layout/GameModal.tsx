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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      {/* Modal Card */}
      <div
        className="w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] rounded-xl"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hover)', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Detalles del juego</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-lg font-medium cursor-pointer"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-5 gap-5 min-h-0">

          {/* Column 1: Cover & IGDB Details */}
          <div className="w-full md:w-56 flex flex-col space-y-4 shrink-0">
            <div
              className="aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sm text-center p-4" style={{ color: 'var(--text-muted)' }}>Sin portada</div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{game.name}</h4>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {game.releaseDate ? game.releaseDate.substring(0, 4) : "Año desconocido"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {game.platforms.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Market Prices & Form (Scrollable on desktop) */}
          <div className="flex-1 overflow-y-auto space-y-5 min-h-0" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Precios de Mercado</h4>
              </div>

              {isLoadingMarket ? (
                <div
                  className="p-6 text-center text-sm rounded-lg"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                  Cargando precios...
                </div>
              ) : (
                <div className="space-y-3">
                  {/* eBay Listings */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>eBay — Mercado Físico</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{process.env.NEXT_PUBLIC_EBAY_MARKETPLACE || "EBAY_ES"}</span>
                    </div>

                    {marketData.ebayListings.length === 0 ? (
                      <p className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                        No se encontraron artículos en eBay.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {marketData.ebayListings.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-2 p-2 rounded-md"
                            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-9 h-9 object-cover rounded shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded shrink-0 flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>?</div>
                            )}
                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                              <a
                                href={item.itemUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] truncate"
                                style={{ color: 'var(--text-secondary)' }}
                                title={item.title}
                              >
                                {item.title}
                              </a>
                              <div className="flex items-center justify-between mt-1">
                                <button
                                  type="button"
                                  onClick={() => setPurchasePrice(item.price)}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer"
                                  style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
                                >
                                  €{item.price} — usar
                                </button>
                                <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>{item.condition}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CheapShark (Digital PC Deals) */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>CheapShark — Digital PC</span>
                    </div>

                    {marketData.cheapsharkDeals.length === 0 ? (
                      <p className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>No se encontraron ofertas digitales para PC.</p>
                    ) : (
                      <div className="space-y-2">
                        {marketData.cheapsharkDeals.slice(0, 3).map((deal) => (
                          <div key={deal.gameID} className="flex items-center justify-between p-2 rounded-md text-xs" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <span className="truncate pr-2" style={{ color: 'var(--text-secondary)' }}>{game.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPurchasePrice(deal.cheapest)}
                                className="font-semibold px-1.5 py-0.5 rounded cursor-pointer text-[10px]"
                                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
                              >
                                ${deal.cheapest} — usar
                              </button>
                              <a
                                href={`https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-medium px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--accent-cyan)', color: '#0d1117' }}
                              >
                                Ver deal
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Sales Analysis */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Historial de Ventas</span>
                      <div className="flex gap-1">
                        {[1, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedRange(m)}
                            className="text-[10px] px-2 py-0.5 rounded cursor-pointer"
                            style={selectedRange === m
                              ? { backgroundColor: 'var(--accent)', color: '#0d1117', fontWeight: 600 }
                              : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                            }
                          >
                            {m === 12 ? "1 año" : `${m}m`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-md text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <div>
                        <p className="text-[9px] uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>Ventas</p>
                        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{filteredSales.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>Precio medio</p>
                        <p className="text-base font-semibold" style={{ color: 'var(--accent)' }}>€{salesAverage.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Sales List */}
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {filteredSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="flex items-center gap-2">
                            <span style={{ color: 'var(--text-muted)' }}>
                              {sale.date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                            </span>
                            <span
                              className="text-[9px] px-1 py-0.5 rounded uppercase font-medium"
                              style={{
                                backgroundColor: sale.condition === "sealed" ? 'rgba(251,191,36,0.1)' : sale.condition === "loose" ? 'rgba(248,113,113,0.1)' : 'rgba(76,168,212,0.1)',
                                color: sale.condition === "sealed" ? '#fbbf24' : sale.condition === "loose" ? '#f87171' : '#4ca8d4',
                              }}
                            >
                              {sale.condition === "sealed" ? "Precintado" : sale.condition === "loose" ? "Loose" : "CIB"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: 'var(--accent)' }}>€{sale.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => setPurchasePrice(sale.price.toString())}
                              className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-medium"
                              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
                            >
                              usar
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredSales.length === 0 && (
                        <p className="text-center text-xs py-3" style={{ color: 'var(--text-muted)' }}>No hay ventas en este período.</p>
                      )}
                    </div>
                  </div>

                  {/* Toggle Diagram Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPipeline(!showPipeline)}
                      className="text-xs px-3 py-1.5 rounded-md cursor-pointer font-medium"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                    >
                      {showPipeline ? "Ocultar análisis IQR" : "Ver pipeline outliers (IQR)"}
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
            <form onSubmit={handleSubmit} className="space-y-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Registrar en colección</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Platform */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Plataforma</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
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
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Edición</label>
                  <input
                    type="text"
                    placeholder="Standard, Coleccionista..."
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="owned">En colección</option>
                    <option value="playing">Jugando</option>
                    <option value="completed">Completado</option>
                    <option value="plan_to_play">Pendiente</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Condición</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="cib">CIB (Completo)</option>
                    <option value="sealed">Precintado</option>
                    <option value="box_and_game">Caja y juego</option>
                    <option value="loose">Suelto</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas personales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la compra, estado físico, opinión..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Submit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
                >
                  {isSubmitting ? "Guardando..." : "Registrar en colección"}
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  {isSubmitting ? "Guardando..." : "Añadir rápido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
