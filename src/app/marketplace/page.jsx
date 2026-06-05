/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";

// Mock Data representing various marketplace listings from the community
const MOCK_OFFERS = [
  {
    id: "off-1",
    game_id: 119133,
    title: "Chrono Trigger",
    platform: "SNES",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co87df.jpg",
    condition_state: "cib",
    region: "PAL-ES",
    offer_type: "both",
    price_wanted: 320,
    created_at: "2026-06-04T12:00:00Z",
    user: {
      username: "RetroLegend",
      avatar_url: ""
    }
  },
  {
    id: "off-2",
    game_id: 68,
    title: "Final Fantasy VII",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobn9o.jpg",
    condition_state: "cib",
    region: "PAL-ES",
    offer_type: "sell",
    price_wanted: 65,
    created_at: "2026-06-04T15:30:00Z",
    user: {
      username: "friendTest",
      avatar_url: ""
    }
  },
  {
    id: "off-3",
    game_id: 40,
    title: "Zelda: Ocarina of Time",
    platform: "Nintendo 64",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3nnx.jpg",
    condition_state: "loose",
    region: "NTSC-U",
    offer_type: "trade",
    price_wanted: null,
    created_at: "2026-06-03T18:45:00Z",
    user: {
      username: "ZeldaFan",
      avatar_url: ""
    }
  },
  {
    id: "off-4",
    game_id: 29,
    title: "Castlevania: Symphony of the Night",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co53m8.jpg",
    condition_state: "sealed",
    region: "PAL-ES",
    offer_type: "both",
    price_wanted: 350,
    created_at: "2026-06-04T09:15:00Z",
    user: {
      username: "Alucard",
      avatar_url: ""
    }
  },
  {
    id: "off-5",
    game_id: 33,
    title: "Metal Gear Solid",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobpao.jpg",
    condition_state: "cib",
    region: "PAL-ES",
    offer_type: "sell",
    price_wanted: 55,
    created_at: "2026-06-05T08:20:00Z",
    user: {
      username: "Solidsnake",
      avatar_url: ""
    }
  },
  {
    id: "off-6",
    game_id: 75,
    title: "Metroid Prime",
    platform: "GameCube",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co6m4m.jpg",
    condition_state: "loose",
    region: "NTSC-J",
    offer_type: "trade",
    price_wanted: null,
    created_at: "2026-06-02T11:10:00Z",
    user: {
      username: "Samus",
      avatar_url: ""
    }
  },
  {
    id: "off-7",
    game_id: 68,
    title: "Super Mario Sunshine",
    platform: "GameCube",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co68sg.jpg",
    condition_state: "cib",
    region: "PAL-ES",
    offer_type: "sell",
    price_wanted: 45,
    created_at: "2026-06-05T10:15:00Z",
    user: {
      username: "RetroGamer88",
      avatar_url: ""
    }
  },
  {
    id: "off-8",
    game_id: 54,
    title: "Pokémon Stadium",
    platform: "Nintendo 64",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1yyd.jpg",
    condition_state: "loose",
    region: "PAL-UK",
    offer_type: "sell",
    price_wanted: 70,
    created_at: "2026-06-01T14:00:00Z",
    user: {
      username: "KantoCollector",
      avatar_url: ""
    }
  }
];

export default function MarketplacePage() {
  // Filter States
  const [offerType, setOfferType] = useState("all"); // all, sell, trade, both
  const [condition, setCondition] = useState("all"); // all, loose, cib, sealed
  const [region, setRegion] = useState("all"); // all, PAL-ES, NTSC-U, etc.

  // Extract unique regions for the dropdown dynamically
  const uniqueRegions = ["all", ...new Set(MOCK_OFFERS.map((o) => o.region))];

  // Filtering Logic
  const filteredOffers = MOCK_OFFERS.filter((offer) => {
    const matchesType =
      offerType === "all" ||
      (offerType === "sell" && (offer.offer_type === "sell" || offer.offer_type === "both")) ||
      (offerType === "trade" && (offer.offer_type === "trade" || offer.offer_type === "both"));

    const matchesCondition =
      condition === "all" || offer.condition_state === condition;

    const matchesRegion =
      region === "all" || offer.region === region;

    return matchesType && matchesCondition && matchesRegion;
  });

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-retro">
            🎮 Mercado de la Comunidad
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

      {/* Interactive Filters Panel */}
      <div className="bg-bg-surface border border-border p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between mb-8">
        {/* Left Side: Segmented Buttons for Offer Type */}
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

        {/* Right Side: Selectors for Condition & Region */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Condition Select */}
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

          {/* Region Select */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-bg-base border border-border hover:border-gray-700 text-text-primary px-3.5 py-2 rounded-lg text-xs focus:border-emerald-500 focus:outline-none transition-colors duration-150 cursor-pointer uppercase"
            >
              <option value="all">Región: Todas</option>
              {uniqueRegions
                .filter((r) => r !== "all")
                .map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="bg-bg-surface border border-border/80 border-dashed rounded-xl p-12 text-center text-text-secondary max-w-lg mx-auto mt-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-white font-bold text-lg mb-1">No se encontraron anuncios</h3>
          <p className="text-xs">
            Prueba a cambiar los filtros de tipo de oferta, estado o región.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredOffers.map((offer) => {
            // Setup Badge styles for visual clarity
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

            // Setup state text representation
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
                {/* Visual Cover Section */}
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
                      <span className="text-4xl">🎮</span>
                      <p className="text-[10px] text-text-muted mt-2 font-mono">{offer.platform}</p>
                    </div>
                  )}

                  {/* Top Floating Badge: Offer Type */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${offerBadgeClass}`}>
                      {offerBadgeText}
                    </span>
                  </div>

                  {/* Bottom Floating Badges: Condition & Region */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
                    <span className="bg-neutral-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-white border border-neutral-800/60 uppercase">
                      {conditionLabel}
                    </span>
                    <span className="bg-neutral-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 border border-neutral-800/60 uppercase">
                      {offer.region}
                    </span>
                  </div>
                </div>

                {/* Card Details / Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Platform Tag */}
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono">
                      {offer.platform}
                    </span>

                    {/* Game Title */}
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate text-base mt-0.5 mb-2 leading-snug">
                      {offer.title}
                    </h3>

                    {/* Pricing or Trade highlights */}
                    <div className="mt-1">
                      {offer.offer_type === "trade" ? (
                        <div className="flex items-center gap-1.5 text-accent-cyan font-bold text-base py-0.5">
                          <span>🔄</span>
                          <span>Intercambio</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-black text-white font-mono leading-none">
                          {offer.price_wanted.toFixed(2).replace(".", ",")}{" "}
                          <span className="text-sm font-semibold text-text-secondary">€</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Seller Info Row */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <Link
                      href={`/user/${offer.user.username}`}
                      className="flex items-center gap-2 hover:text-white text-text-secondary transition-colors group/user"
                    >
                      {/* Seller Avatar Fallback or Img */}
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

                    {/* Quick Info text */}
                    <span className="text-[10px] text-text-muted font-medium">
                      Hace {new Date(offer.created_at).getDate() % 2 === 0 ? "1d" : "unas h"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
