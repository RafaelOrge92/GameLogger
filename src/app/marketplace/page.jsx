 
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Search, ArrowLeftRight, MoreHorizontal, Bookmark, Image } from "lucide-react";
import { addGameToWishlist } from "@/features/collection/actions";
import TradeProposalModal from "@/components/TradeProposalModal";
import GameGalleryModal from "@/components/GameGalleryModal";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";

const REGIONS = ["all", "PAL-ES", "NTSC-U", "NTSC-J", "PAL-UK", "PAL-FR", "PAL-DE"];


const SkeletonCard = () => (
  <div className="bg-bg-surface border border-border rounded-xl overflow-hidden animate-pulse flex flex-col h-full">
    <div className="aspect-[3/4] bg-neutral-800" />
    <div className="p-4 flex-1 flex flex-col justify-between">
      <div>
        <div className="h-3 bg-neutral-800 rounded w-1/4 mb-2" />
        <div className="h-5 bg-neutral-800 rounded w-3/4 mb-3" />
        <div className="h-6 bg-neutral-800 rounded w-1/2" />
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-800" />
          <div className="h-3 bg-neutral-800 rounded w-16" />
        </div>
        <div className="h-3 bg-neutral-800 rounded w-8" />
      </div>
    </div>
  </div>
);

export default function MarketplacePage() {
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { showToast } = useToast();

  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedTradeOffer, setSelectedTradeOffer] = useState(null);
  const [selectedGalleryOffer, setSelectedGalleryOffer] = useState(null);

  
  const [offerType, setOfferType] = useState("all"); 
  const [condition, setCondition] = useState("all"); 
  const [region, setRegion] = useState("all"); 

  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  
  useEffect(() => {
    function closeMenus() {
      setActiveMenuId(null);
    }
    if (activeMenuId !== null) {
      window.addEventListener("click", closeMenus);
    }
    return () => {
      window.removeEventListener("click", closeMenus);
    };
  }, [activeMenuId]);

  
  useEffect(() => {
    let isMounted = true;
    async function fetchOffers() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (offerType && offerType !== "all") {
          queryParams.append("offer_type", offerType);
        }
        if (condition && condition !== "all") {
          queryParams.append("condition_state", condition);
        }
        if (region && region !== "all") {
          queryParams.append("region", region);
        }

        const response = await fetch(`/api/marketplace/offers?${queryParams.toString()}`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setOffers(Array.isArray(data) ? data : []);
        } else if (isMounted) {
          setOffers([]);
        }
      } catch (error) {
        console.error("Error fetching marketplace offers:", error);
        if (isMounted) setOffers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, [offerType, condition, region]);

  
  const handleResetFilters = () => {
    setOfferType("all");
    setCondition("all");
    setRegion("all");
  };

  return (
    <div className="w-full">
      { }
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-retro flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" /> Mercado de la Comunidad
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Compra, vende o intercambia piezas con otros coleccionistas.
          </p>
        </div>
        <div>
          <Link
            href="/marketplace/create"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] hover:scale-[1.01]"
          >
            <span className="text-lg font-bold">+</span> Publicar Anuncio
          </Link>
        </div>
      </div>

      { }
      <div className="bg-bg-surface border border-border p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between mb-8">
        { }
        <div className="flex bg-bg-base p-1 rounded-lg border border-border">
          <button
            onClick={() => setOfferType("all")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              offerType === "all"
                ? "bg-bg-surface text-emerald-400 border border-border shadow-xs"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setOfferType("sell")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              offerType === "sell"
                ? "bg-bg-surface text-emerald-400 border border-border shadow-xs"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Solo Venta
          </button>
          <button
            onClick={() => setOfferType("trade")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              offerType === "trade"
                ? "bg-bg-surface text-emerald-400 border border-border shadow-xs"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Solo Intercambio
          </button>
        </div>

        { }
        <div className="flex items-center gap-3 w-full sm:w-auto">
          { }
          <div className="flex-1 sm:flex-initial">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-bg-base border border-border hover:border-gray-700 text-text-primary px-3.5 py-2 rounded-lg text-xs focus:border-emerald-500 focus:outline-none transition-colors duration-150 cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="loose">Loose (Solo Cartucho/Disco)</option>
              <option value="cib">CIB (Completo en Caja)</option>
              <option value="sealed">Sealed (Nuevo/Precintado)</option>
            </select>
          </div>

          { }
          <div className="flex-1 sm:flex-initial">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-bg-base border border-border hover:border-gray-700 text-text-primary px-3.5 py-2 rounded-lg text-xs focus:border-emerald-500 focus:outline-none transition-colors duration-150 cursor-pointer uppercase"
            >
              <option value="all">Región: Todas</option>
              {REGIONS.filter((r) => r !== "all").map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      { }
      {loading ? (
         
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : offers.length === 0 ? (
         
        <div className="bg-bg-surface border border-border/80 border-dashed rounded-xl p-12 text-center max-w-lg mx-auto mt-8 flex flex-col items-center">
          <Search className="w-10 h-10 text-gray-500 mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">No se encontraron anuncios</h3>
          <p className="text-xs text-text-secondary mb-4">
            No hay ofertas disponibles con los filtros seleccionados.
          </p>
          <button
            onClick={handleResetFilters}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
         
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {offers.map((offer) => {
            
            let offerBadgeClass = "";
            let offerBadgeText = "";
            if (offer.offer_type === "sell") {
              offerBadgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              offerBadgeText = "Venta";
            } else if (offer.offer_type === "trade") {
              offerBadgeClass = "bg-sky-500/10 text-sky-400 border border-sky-500/20";
              offerBadgeText = "Intercambio";
            } else {
              offerBadgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
              offerBadgeText = "Ambos";
            }

            
            const conditionLabel =
              offer.condition_state === "cib"
                ? "CIB"
                : offer.condition_state === "loose"
                ? "Loose"
                : "Sealed";

            return (
              <div
                key={offer.id}
                className="group bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-200 flex flex-col"
              >
                { }
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 flex items-center justify-center">
                  {offer.coverUrl ? (
                    <img
                      src={offer.coverUrl}
                      alt={offer.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Gamepad2 className="w-10 h-10 text-gray-500" />
                      <p className="text-[10px] text-text-muted mt-2 font-mono">{offer.platform}</p>
                    </div>
                  )}

                  { }
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${offerBadgeClass}`}>
                      {offerBadgeText}
                    </span>
                  </div>

                  { }
                  {currentUser && currentUser.id !== offer.user_id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === offer.id ? null : offer.id);
                      }}
                      type="button"
                      className={`absolute top-2.5 right-2.5 z-20 transition-opacity duration-205 cursor-pointer flex items-center justify-center w-7 h-7 text-gray-400 hover:text-white bg-gray-950/80 hover:bg-gray-900 border border-gray-800 rounded-md backdrop-blur-xs shadow-lg ${
                        activeMenuId === offer.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="Opciones"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}

                  { }
                  {activeMenuId === offer.id && (
                    <div
                      className="absolute top-11 right-2.5 w-48 bg-[#18191b] border border-gray-850 rounded-lg shadow-2xl py-1 z-30 animate-[fadeIn_0.1s_ease-out]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          setSelectedTradeOffer({
                            gameId: offer.game_id,
                            title: offer.title,
                            platform: offer.platform,
                            coverUrl: offer.coverUrl,
                            ownerId: offer.user_id,
                          });
                        }}
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer font-semibold"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Proponer Intercambio</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          try {
                            const res = await addGameToWishlist(
                              String(offer.game_id),
                              offer.title,
                              offer.coverUrl,
                              offer.platform,
                              offer.user_id
                            );
                            if (res.error) {
                              showToast(res.error, "error");
                            } else {
                              showToast(`¡${offer.title} añadido a tus deseos!`, "success");
                            }
                          } catch (err) {
                            showToast("Error al guardar en deseos.", "error");
                          }
                        }}
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer border-t border-gray-800/50 font-semibold"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Añadir a Mis Deseos</span>
                      </button>
                      {offer.imagesUrls && offer.imagesUrls.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            setSelectedGalleryOffer({
                              title: offer.title,
                              imagesUrls: offer.imagesUrls,
                            });
                          }}
                          type="button"
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer border-t border-gray-800/50 font-semibold"
                        >
                          <Image className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Ver fotos físicas</span>
                        </button>
                      )}
                    </div>
                  )}

                  { }
                  <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
                    <span className="bg-neutral-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-white border border-neutral-800/60 uppercase">
                      {conditionLabel}
                    </span>
                    <span className="bg-neutral-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 border border-neutral-800/60 uppercase">
                      {offer.region}
                    </span>
                  </div>
                </div>

                { }
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    { }
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono">
                      {offer.platform}
                    </span>

                    { }
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate text-base mt-0.5 mb-2 leading-snug">
                      {offer.title}
                    </h3>

                    { }
                    <div className="mt-1">
                      {offer.offer_type === "trade" ? (
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-base py-0.5">
                          <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                          <span>Intercambio</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-black text-white font-mono leading-none">
                          {offer.price_wanted !== null && typeof offer.price_wanted === "number"
                            ? `${offer.price_wanted.toFixed(2).replace(".", ",")}`
                            : "0,00"}{" "}
                          <span className="text-sm font-semibold text-text-secondary">€</span>
                        </div>
                      )}
                    </div>
                  </div>

                  { }
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <Link
                      href={`/user/${offer.user.username}`}
                      className="flex items-center gap-2 hover:text-white text-text-secondary transition-colors group/user"
                    >
                      { }
                      {offer.user.avatar_url ? (
                        <img
                          src={offer.user.avatar_url}
                          alt={offer.user.username}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black font-mono">
                          {offer.user.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold group-hover/user:text-emerald-400 transition-colors truncate max-w-[110px]">
                        {offer.user.username}
                      </span>
                    </Link>

                    { }
                    <span className="text-[10px] text-text-muted font-medium">
                      {(() => {
                        const diff = Date.now() - new Date(offer.created_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 60) return `Hace ${mins || 1}m`;
                        const hours = Math.floor(mins / 60);
                        if (hours < 24) return `Hace ${hours}h`;
                        const days = Math.floor(hours / 24);
                        if (days < 30) return `Hace ${days}d`;
                        const months = Math.floor(days / 30);
                        return `Hace ${months} mes${months > 1 ? "es" : ""}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      { }
      {selectedTradeOffer && (
        <TradeProposalModal
          game={selectedTradeOffer}
          ownerId={selectedTradeOffer.ownerId}
          currentUser={currentUser}
          onClose={() => setSelectedTradeOffer(null)}
        />
      )}

      {selectedGalleryOffer && (
        <GameGalleryModal
          images={selectedGalleryOffer.imagesUrls}
          gameTitle={selectedGalleryOffer.title}
          onClose={() => setSelectedGalleryOffer(null)}
        />
      )}
    </div>
  );
}
