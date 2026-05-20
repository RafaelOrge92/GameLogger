"use client";

import { useState, useEffect } from "react";
import { getGameMarketData } from "@/features/market/actions";
import { addGameToCollection } from "@/features/collection/actions";

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

export default function GameModal({ game, onClose, onSuccess }: GameModalProps) {
  const [marketData, setMarketData] = useState<{
    cheapsharkDeals: any[];
    ebayListings: any[];
  }>({ cheapsharkDeals: [], ebayListings: [] });
  
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [status, setStatus] = useState<"owned" | "playing" | "completed" | "plan_to_play" | "dropped">("owned");
  const [condition, setCondition] = useState<"sealed" | "cib" | "box_and_game" | "loose" | "digital">("cib");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [edition, setEdition] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        alert(`Error: ${result.error}`);
      } else {
        alert(`¡${game.name} añadido correctamente a tu colección!`);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error inesperado.");
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Cover & IGDB Details */}
            <div className="space-y-4">
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

            {/* Column 2: Market Prices (eBay & CheapShark) */}
            <div className="md:col-span-2 space-y-6 border-t-2 md:border-t-0 md:border-l-2 border-[#ff6b00]/30 md:pl-6 pt-6 md:pt-0">
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
                            <a 
                              key={item.id}
                              href={item.itemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex gap-2 p-2 bg-[#050505] border border-gray-800 hover:border-[#ff6b00] transition-colors group"
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-10 h-10 object-cover border border-gray-800 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-900 border border-gray-800 flex items-center justify-center text-[8px] text-gray-500 font-retro shrink-0">N/A</div>
                              )}
                              <div className="min-w-0 flex-1 flex flex-col justify-between">
                                <p className="text-[10px] text-gray-300 font-mono truncate group-hover:text-white transition-colors">{item.title}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-[#00ff00] font-bold">{item.price} {item.currency}</span>
                                  <span className="text-[9px] text-gray-500 bg-[#0f0f0f] px-1 border border-gray-800 uppercase">{item.condition}</span>
                                </div>
                              </div>
                            </a>
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
                                <span className="text-gray-500 line-through">Retail: ${deal.retailPrice}</span>
                                <span className="text-[#00ff00] font-bold">Oferta: ${deal.cheapest}</span>
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
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#ff6b00] hover:bg-[#00ff00] text-black font-retro text-xl font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "REGISTRANDO..." : "[+ REGISTRAR EN COLECCION]"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
