"use client";

import { useState, useEffect, useMemo } from "react";
import { getGameMarketData } from "@/features/market/actions";
import { addGameToCollection } from "@/features/collection/actions";
import { useToast } from "@/context/ToastContext";

import ImageUploaderWithAI from "@/components/ImageUploaderWithAI";

const Uploader = ImageUploaderWithAI as any;

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

export default function GameModal({ game, onClose, onSuccess }: GameModalProps) {
  const [marketData, setMarketData] = useState<{
    cheapsharkDeals: any[];
    ebayListings: any[];
  }>({ cheapsharkDeals: [], ebayListings: [] });
  
  const { showToast } = useToast();
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [status, setStatus] = useState<"collection" | "wishlist">("collection");
  const [condition, setCondition] = useState<"sealed" | "cib" | "box_and_game" | "loose" | "digital">("cib");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [edition, setEdition] = useState("");
  const [notes, setNotes] = useState("");
  const [region, setRegion] = useState("PAL-ES");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // eBay Region and Pagination States
  const [activeRegionTab, setActiveRegionTab] = useState<"ES" | "US">("ES");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter listings by active region
  const filteredListings = useMemo(() => {
    return marketData.ebayListings.filter(item => {
      const region = item.marketRegion || "ES";
      return region === activeRegionTab;
    });
  }, [marketData.ebayListings, activeRegionTab]);

  // Paginated listings slice (10 items per page, exactly 2 columns of 5 items)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage) || 1;
  
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredListings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredListings, currentPage]);

  useEffect(() => {
    if (game && game.platforms && game.platforms.length > 0) {
      setSelectedPlatform(game.platforms[0]);
    } else {
      setSelectedPlatform("Desconocida");
    }
  }, [game]);

  useEffect(() => {
    if (!game) return;

    const gameName = game.name;
    const gamePlatforms = game.platforms;

    async function loadMarket() {
      setIsLoadingMarket(true);
      try {
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
        edition,
        game.coverUrl,
        region,
        uploadedImages
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



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      { }
      <div
        className="w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] rounded-xl"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hover)', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
      >
        { }
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

        { }
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-5 gap-5 min-h-0">

          { }
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

          { }
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
                  {/* eBay - Mercado Físico */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 pb-2 gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>eBay — Mercado Físico</span>
                      
                      {/* Region Selector Tabs */}
                      <div className="flex rounded-md p-0.5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRegionTab("ES");
                            setCurrentPage(1);
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-sm cursor-pointer transition-all ${
                            activeRegionTab === "ES" 
                              ? "btn-primary font-medium" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          style={activeRegionTab === "ES" ? {} : { color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
                        >
                          eBay España (ES)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRegionTab("US");
                            setCurrentPage(1);
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-sm cursor-pointer transition-all ${
                            activeRegionTab === "US" 
                              ? "btn-primary font-medium" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          style={activeRegionTab === "US" ? {} : { color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
                        >
                          eBay Estados Unidos (USA)
                        </button>
                      </div>
                    </div>

                    {filteredListings.length === 0 ? (
                      <p className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                        No se encontraron artículos en eBay para esta región.
                      </p>
                    ) : (
                      <>
                        {/* 2-Column Results Grid (each page fits exactly 10 items) */}
                        <div className="grid grid-cols-2 gap-2">
                          {paginatedListings.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-2 p-2 rounded-md hover:border-gray-750 transition-colors"
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
                                  className="text-[10px] truncate hover:text-emerald-400 transition-colors"
                                  style={{ color: 'var(--text-secondary)' }}
                                  title={item.title}
                                >
                                  {item.title}
                                </a>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                    €{item.price}
                                  </span>
                                  <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                    item.condition === 'sealed' ? 'text-amber-400 border-amber-500/20 bg-amber-950/20' :
                                    item.condition === 'cib' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20' :
                                    'text-rose-400 border-rose-500/20 bg-rose-950/20'
                                  }`}>
                                    {item.condition === 'sealed' ? 'Precintado' : item.condition === 'cib' ? 'Completo' : 'Cartucho/Disco'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Section */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="text-[10px] px-2.5 py-1 rounded cursor-pointer font-medium btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Retroceder
                            </button>
                            
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Página {currentPage} de {totalPages}
                            </span>

                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="text-[10px] px-2.5 py-1 rounded cursor-pointer font-medium btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Avanzar
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            { }
            <form onSubmit={handleSubmit} className="space-y-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Registrar en colección</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                { }
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

                { }
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
                { }
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
                    <option value="collection">En colección</option>
                    <option value="wishlist">En deseados</option>
                  </select>
                </div>

                { }
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Región</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="PAL-ES">PAL-ES</option>
                    <option value="PAL-UK">PAL-UK</option>
                    <option value="NTSC-U">NTSC-U</option>
                    <option value="NTSC-J">NTSC-J</option>
                    <option value="PAL-FR">PAL-FR</option>
                    <option value="PAL-DE">PAL-DE</option>
                  </select>
                </div>

                { }
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

              { }
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

              { }
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fotos del estado real (opcional)</label>
                <Uploader
                  images={uploadedImages}
                  onChange={setUploadedImages}
                />
              </div>

              { }
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50 cursor-pointer btn-primary"
                >
                  {isSubmitting ? "Guardando..." : "Registrar en colección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
