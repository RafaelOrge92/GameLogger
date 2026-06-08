"use client";

import { useState, useMemo } from "react";
import { removeGameFromCollection } from "@/features/collection/actions";
import { Search, Filter, ArrowUpDown, X, Trash2, Gamepad2, Package } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import MyGameDetailsModal from "./MyGameDetailsModal";

interface Game {
  id: string;
  game_id: string;
  title: string;
  cover_url: string;
  platform: string;
  status: string;
  condition: string;
  purchase_price: string | null;
  region: string;
  added_at: string;
  notes?: string | null;
  edition?: string | null;
}

interface DashboardCollectionProps {
  initialGames: Game[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  playing:      { label: "Jugando",       color: "var(--status-playing)", bg: "rgba(76, 168, 212, 0.1)" },
  completed:    { label: "Completado",    color: "var(--status-completed)", bg: "rgba(67, 185, 79, 0.1)" },
  plan_to_play: { label: "Pendiente",     color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  dropped:      { label: "Abandonado",    color: "var(--status-dropped)", bg: "rgba(248, 113, 113, 0.1)" },
  owned:        { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
};

const CONDITION_META: Record<string, { label: string; color: string }> = {
  loose:  { label: "Loose",  color: "text-rose-400 border-rose-500/30 bg-rose-950/20" },
  cib:    { label: "CIB",    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
  sealed: { label: "Sealed", color: "text-amber-400 border-amber-500/30 bg-amber-950/20" },
  digital:{ label: "Digital",color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/20" },
};

export default function DashboardCollection({ initialGames }: DashboardCollectionProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);

  const { showToast } = useToast();

  // Extract unique platforms and regions dynamically from the collection
  const uniquePlatforms = useMemo(() => {
    return Array.from(new Set(games.map((g) => g.platform).filter(Boolean))).sort();
  }, [games]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(games.map((g) => g.region).filter(Boolean))).sort();
  }, [games]);

  const handleClearFilters = () => {
    setSearch("");
    setPlatform("");
    setRegion("");
    setStatus("");
    setCondition("");
    setSortBy("recent");
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    
    if (confirm("¿Estás seguro de que quieres eliminar este juego de tu colección?")) {
      setDeletingId(id);
      try {
        const res = await removeGameFromCollection(id);
        if (res.error) {
          showToast(res.error, "error");
        } else {
          setGames((prev) => prev.filter((g) => g.id !== id));
          showToast("Juego eliminado de tu colección", "success");
        }
      } catch (error) {
        console.error("Error deleting game:", error);
        showToast("Error al eliminar el juego", "error");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleGameUpdate = (updatedGame: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updatedGame.id ? updatedGame : g)));
    setSelectedGameForDetails(updatedGame);
  };

  const handleGameDelete = (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  };


  // Filter and sort logic
  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.title?.toLowerCase().includes(q));
    }

    // Platform filter
    if (platform) {
      result = result.filter((g) => g.platform === platform);
    }

    // Region filter
    if (region) {
      result = result.filter((g) => g.region === region);
    }

    // Status filter
    if (status) {
      result = result.filter((g) => g.status === status);
    }

    // Condition filter
    if (condition) {
      result = result.filter((g) => g.condition === condition);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "price-desc": {
          const priceA = a.purchase_price ? parseFloat(a.purchase_price) : -1;
          const priceB = b.purchase_price ? parseFloat(b.purchase_price) : -1;
          return priceB - priceA;
        }
        case "price-asc": {
          const priceA = a.purchase_price ? parseFloat(a.purchase_price) : Infinity;
          const priceB = b.purchase_price ? parseFloat(b.purchase_price) : Infinity;
          return priceA - priceB;
        }
        case "recent":
        default:
          return new Date(b.added_at || 0).getTime() - new Date(a.added_at || 0).getTime();
      }
    });

    return result;
  }, [games, search, platform, region, status, condition, sortBy]);

  const hasActiveFilters = search || platform || region || status || condition || sortBy !== "recent";

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar Card */}
      <div className="bg-[#18191b] border border-gray-800 rounded-xl p-4 md:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide uppercase">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filtros de Colección</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Input grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search text */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full bg-[#0f0f10] text-white placeholder-gray-500 text-xs rounded-lg pl-9 pr-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Platform Select */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Plataforma: Todas</option>
            {uniquePlatforms.map((plat) => (
              <option key={plat} value={plat}>
                {plat}
              </option>
            ))}
          </select>

          {/* Region Select */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Región: Todas</option>
            {uniqueRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Estado: Todos</option>
            {Object.entries(STATUS_META).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>

          {/* Condition Select */}
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Formato: Todos</option>
            {Object.entries(CONDITION_META).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting and Summary Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-800/60">
          <div className="text-xs text-gray-400 font-medium">
            Mostrando <span className="text-white font-bold">{filteredAndSortedGames.length}</span> de{" "}
            <span className="text-gray-400">{games.length}</span> juegos
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" /> Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0f0f10] border border-gray-800 text-gray-300 text-[11px] font-semibold rounded-md px-2.5 py-1 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="recent">Añadidos recientemente</option>
              <option value="title-asc">Título (A-Z)</option>
              <option value="title-desc">Título (Z-A)</option>
              <option value="price-desc">Precio (Mayor a menor)</option>
              <option value="price-asc">Precio (Menor a mayor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Games Grid or Empty State */}
      {filteredAndSortedGames.length === 0 ? (
        <div className="rounded-xl flex flex-col items-center justify-center text-center py-20 px-8 bg-[#18191b] border border-gray-800 shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#0f0f10]">
            <Package className="w-7 h-7 text-gray-500" />
          </div>
          <h3 className="text-base font-semibold mb-2 text-white">
            No se encontraron juegos
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            {hasActiveFilters
              ? "Prueba a cambiar los criterios de búsqueda o limpia los filtros."
              : "Usa la barra de búsqueda superior para añadir tu primer juego."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {filteredAndSortedGames.map((game) => {
            const statusInfo = STATUS_META[game.status] ?? {
              label: game.status,
              color: "var(--text-muted)",
              bg: "transparent",
            };
            return (
              <div 
                key={game.id} 
                className="game-card relative overflow-hidden group cursor-pointer"
                onClick={() => setSelectedGameForDetails(game)}
              >
                {/* Cover image */}
                <div className="aspect-[3/4] bg-[#141517] w-full overflow-hidden">
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-center p-2 font-medium text-gray-500 uppercase">
                      {game.title}
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="game-card-overlay absolute inset-0 bg-neutral-950/80 backdrop-blur-xs p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Delete button top-right */}
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(game.id);
                      }}
                      disabled={deletingId === game.id}
                      className="w-6 h-6 rounded flex items-center justify-center text-sm font-medium bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Eliminar de la colección"
                    >
                      {deletingId === game.id ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Info bottom */}
                  <div className="space-y-1.5">
                    <p
                      className="text-[11px] font-bold leading-tight text-white line-clamp-2"
                      title={game.title}
                    >
                      {game.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                      >
                        {statusInfo.label}
                      </span>
                      {game.purchase_price && (
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          €{parseFloat(game.purchase_price).toFixed(0)}
                        </span>
                      )}
                    </div>
                    
                    {/* Platform & Region row */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {game.platform && (
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-[#0f0f10] border border-gray-800 text-gray-400 font-mono uppercase">
                          {game.platform}
                        </span>
                      )}
                      {game.region && (
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-mono font-bold uppercase">
                          {game.region}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status indicator strip */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: statusInfo.color }}
                />
              </div>
            );
          })}
        </div>
      )}

      {selectedGameForDetails && (
        <MyGameDetailsModal
          game={selectedGameForDetails}
          onClose={() => setSelectedGameForDetails(null)}
          onUpdate={handleGameUpdate}
          onDelete={handleGameDelete}
        />
      )}
    </div>
  );
}
