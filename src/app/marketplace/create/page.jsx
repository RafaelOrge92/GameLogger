/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { searchGamesIGDB } from "@/features/market/services/igdb";

const REGIONS = ["PAL-ES", "NTSC-U", "NTSC-J", "PAL-UK", "PAL-FR", "PAL-DE"];
const CONDITIONS = [
  { value: "loose", label: "Loose", desc: "Solo cartucho/disco, sin caja" },
  { value: "cib", label: "CIB", desc: "Completo en caja (Complete In Box)" },
  { value: "sealed", label: "Sealed", desc: "Nuevo / sin abrir / precintado" },
];
const OFFER_TYPES = [
  { value: "sell", label: "Venta", icon: "💶", desc: "Quiero venderlo" },
  { value: "trade", label: "Intercambio", icon: "🔄", desc: "Quiero cambiarlo" },
  { value: "both", label: "Ambos", icon: "⚡", desc: "Venta o intercambio" },
];

export default function CreateOfferPage() {
  const router = useRouter();

  // Game search
  const [gameQuery, setGameQuery] = useState("");
  const [gameResults, setGameResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const dropdownRef = useRef(null);
  const debouncedQuery = useDebounce(gameQuery, 400);

  // Form fields
  const [condition, setCondition] = useState("");
  const [region, setRegion] = useState("");
  const [offerType, setOfferType] = useState("");
  const [price, setPrice] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowGameDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // IGDB search
  useEffect(() => {
    if (!debouncedQuery.trim() || selectedGame) {
      setGameResults([]);
      setShowGameDropdown(false);
      return;
    }
    setIsSearching(true);
    setShowGameDropdown(true);

    searchGamesIGDB(debouncedQuery)
      .then((data) => {
        setGameResults(Array.isArray(data) ? data : []);
      })
      .catch(() => setGameResults([]))
      .finally(() => setIsSearching(false));
  }, [debouncedQuery, selectedGame]);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setGameQuery(game.name);
    setShowGameDropdown(false);
    setGameResults([]);
  };

  const handleClearGame = () => {
    setSelectedGame(null);
    setGameQuery("");
  };

  const needsPrice = offerType === "sell" || offerType === "both";

  const isFormValid =
    selectedGame &&
    condition &&
    region &&
    offerType &&
    (!needsPrice || (price !== "" && Number(price) >= 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        game_id: selectedGame.id,
        condition_state: condition,
        region,
        offer_type: offerType,
        ...(needsPrice ? { price_wanted: Number(price) } : {}),
      };

      const res = await fetch("/api/marketplace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Error al publicar el anuncio.");
        return;
      }

      // Success — redirect to marketplace
      router.push("/marketplace");
      router.refresh();
    } catch {
      setSubmitError("Error de red. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Mercado
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          📢 Publicar Anuncio
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Pon en venta o intercambio un juego de tu colección.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1 — Game search */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
            Selecciona el juego
          </h2>

          {selectedGame ? (
            /* Selected game preview */
            <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
              {selectedGame.coverUrl ? (
                <img
                  src={selectedGame.coverUrl}
                  alt={selectedGame.name}
                  className="w-12 h-16 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-12 h-16 rounded bg-bg-elevated border border-border flex items-center justify-center text-xl shrink-0">
                  🎮
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{selectedGame.name}</p>
                {selectedGame.platforms?.length > 0 && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {selectedGame.platforms.slice(0, 3).join(" · ")}
                  </p>
                )}
                {selectedGame.releaseDate && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {selectedGame.releaseDate.substring(0, 4)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearGame}
                className="shrink-0 w-7 h-7 rounded-full bg-bg-elevated border border-border hover:border-red-500/30 hover:text-red-400 text-text-muted flex items-center justify-center text-sm transition-all"
                title="Cambiar juego"
              >
                ✕
              </button>
            </div>
          ) : (
            /* Game search input */
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={gameQuery}
                  onChange={(e) => setGameQuery(e.target.value)}
                  onFocus={() => { if (gameResults.length > 0) setShowGameDropdown(true); }}
                  placeholder="Busca el título del juego..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-bg-elevated border border-border focus:border-emerald-500 focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>

              {/* Game dropdown */}
              {showGameDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-2xl border border-border-hover bg-bg-elevated z-50">
                  {gameResults.length === 0 && !isSearching ? (
                    <div className="p-4 text-center text-sm text-text-secondary">
                      Sin resultados para &quot;{gameQuery}&quot;
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {gameResults.map((game) => (
                        <li
                          key={game.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-bg-surface transition-colors"
                          onClick={() => handleSelectGame(game)}
                        >
                          {game.coverUrl ? (
                            <img
                              src={game.coverUrl}
                              alt={game.name}
                              className="w-8 h-11 object-cover rounded shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 rounded bg-bg-surface border border-border flex items-center justify-center text-xs shrink-0">
                              🎮
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{game.name}</p>
                            <p className="text-[11px] text-text-muted truncate">
                              {game.releaseDate?.substring(0, 4)}
                              {game.platforms?.length > 0 && ` · ${game.platforms.slice(0, 2).join(", ")}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2 — Condition */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">2</span>
            Estado de conservación
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {CONDITIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCondition(value)}
                className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all cursor-pointer ${
                  condition === value
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white"
                    : "border-border hover:border-border-hover text-text-secondary hover:text-white bg-bg-elevated"
                }`}
              >
                <span className={`text-lg font-black font-mono mb-1 ${condition === value ? "text-emerald-400" : ""}`}>
                  {label}
                </span>
                <span className="text-[10px] leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — Region */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">3</span>
            Región de la copia
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                  region === r
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-bg-elevated border-border hover:border-border-hover text-text-secondary hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4 — Offer type */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">4</span>
            Tipo de oferta
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {OFFER_TYPES.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOfferType(value)}
                className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all cursor-pointer ${
                  offerType === value
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white"
                    : "border-border hover:border-border-hover text-text-secondary hover:text-white bg-bg-elevated"
                }`}
              >
                <span className="text-2xl mb-1">{icon}</span>
                <span className={`text-sm font-bold mb-0.5 ${offerType === value ? "text-emerald-400" : ""}`}>
                  {label}
                </span>
                <span className="text-[10px] leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5 — Price (conditional) */}
        {needsPrice && (
          <div className="bg-bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">5</span>
              Precio de venta
            </h2>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="w-full pr-8 pl-4 py-2.5 rounded-lg text-sm bg-bg-elevated border border-border focus:border-emerald-500 focus:outline-none text-text-primary placeholder:text-text-muted transition-colors font-mono text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">€</span>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Introduce el precio de venta. Puedes dejarlo en 0 si es negociable.
            </p>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="bg-red-950/30 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
            ⚠️ {submitError}
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/marketplace"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:text-white border border-border hover:border-border-hover bg-bg-elevated transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isFormValid && !isSubmitting
                ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-950/30 hover:scale-[1.01] active:scale-[0.99]"
                : "bg-bg-elevated text-text-muted border border-border cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <span className="text-base font-black">+</span>
                Publicar Anuncio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
