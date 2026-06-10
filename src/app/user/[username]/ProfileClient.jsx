"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { Gamepad2, Library, Gem, Flame, Sparkles, Crown, Package, Award, ArrowLeftRight } from "lucide-react";
import GameCardWithMenu from "@/components/GameCardWithMenu";
import MyGameDetailsModal from "@/components/MyGameDetailsModal";
import TradeProposalModal from "@/components/TradeProposalModal";




const STATUS_META = {
  collection:   { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  wishlist:     { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  playing:      { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  completed:    { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  plan_to_play: { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  dropped:      { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  owned:        { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
};


const CONDITION_META = {
  loose:  { label: "Loose",  color: "text-rose-400 border-rose-500/30 bg-rose-950/20" },
  cib:    { label: "CIB",    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
  sealed: { label: "Sealed", color: "text-amber-400 border-amber-500/30 bg-amber-950/20" },
  digital:{ label: "Digital",color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/20" },
};

export default function ProfileClient({
  profile,
  initialIsFollowing,
  initialFollowerCount = 0,
  currentUser,
  collection,
  stats,
  favoriteGame,
  crownJewel
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [localCollection, setLocalCollection] = useState(collection);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState(null);
  const { showToast } = useToast();

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  
  const [profileTab, setProfileTab] = useState("coleccion"); 
  const [compareData, setCompareData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareSubTab, setCompareSubTab] = useState("comun"); 
  const [wishlistSearchQuery, setWishlistSearchQuery] = useState("");
  const [selectedTradeGame, setSelectedTradeGame] = useState(null);

  
  useEffect(() => {
    if (profileTab === "comparar" && !compareData && !isComparing) {
      async function runComparison() {
        setIsComparing(true);
        try {
          const res = await fetch("/api/users/compare", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ targetUserId: profile.id }),
          });
          const json = await res.json();
          if (res.ok) {
            setCompareData(json);
          } else {
            showToast(json.error || "Error al comparar colecciones.", "error");
            setProfileTab("coleccion");
          }
        } catch (err) {
          console.error("Comparison error:", err);
          showToast("Error de conexión al comparar colecciones.", "error");
          setProfileTab("coleccion");
        } finally {
          setIsComparing(false);
        }
      }
      runComparison();
    }
  }, [profileTab, compareData, isComparing, profile.id, showToast]);

  const mapDbToCard = (dbItem) => ({
    id: dbItem.id,
    gameId: dbItem.game_id,
    title: dbItem.title,
    coverUrl: dbItem.cover_url,
    platform: dbItem.platform,
    status: dbItem.status,
    condition: dbItem.condition,
    purchasePrice: dbItem.purchase_price,
    region: dbItem.region || "PAL-ES",
    imagesUrls: dbItem.images_urls || [],
    notes: dbItem.notes || "",
    edition: dbItem.edition || "",
    addedAt: dbItem.added_at
  });

  
  useEffect(() => {
    setLocalCollection(collection);
  }, [collection]);

  const handleGameUpdate = (updatedGame) => {
    const mappedUpdated = {
      id: updatedGame.id,
      gameId: updatedGame.game_id,
      title: updatedGame.title,
      coverUrl: updatedGame.cover_url,
      platform: updatedGame.platform,
      status: updatedGame.status,
      condition: updatedGame.condition,
      purchasePrice: updatedGame.purchase_price,
      region: updatedGame.region,
      imagesUrls: updatedGame.images_urls || [],
      notes: updatedGame.notes || "",
      edition: updatedGame.edition || "",
      addedAt: updatedGame.added_at
    };

    setLocalCollection((prev) =>
      prev.map((g) => (g.id === mappedUpdated.id ? mappedUpdated : g))
    );
    setSelectedGameForDetails(mappedUpdated);
  };

  const handleGameDelete = (id) => {
    setLocalCollection((prev) => prev.filter((g) => g.id !== id));
    setSelectedGameForDetails(null);
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast("Debes iniciar sesión para seguir coleccionistas.", "error");
      return;
    }
    
    setIsLoadingFollow(true);
    const prevIsFollowing = isFollowing;
    const prevCount = followerCount;

    
    setIsFollowing(!prevIsFollowing);
    setFollowerCount(prevIsFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ following_id: profile.id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "followed") {
          setIsFollowing(true);
          showToast(`¡Ahora sigues a ${profile.username || "este usuario"}!`, "success");
        } else if (data.status === "unfollowed") {
          setIsFollowing(false);
          showToast(`Dejaste de seguir a ${profile.username || "este usuario"}`, "success");
        } else {
          
          setIsFollowing(prevIsFollowing);
          setFollowerCount(prevCount);
          showToast(data.error || "Ocurrió un error.", "error");
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setIsFollowing(prevIsFollowing);
        setFollowerCount(prevCount);
        showToast(data.error || "Error al procesar la acción de seguimiento.", "error");
      }
    } catch (error) {
      console.error(error);
      setIsFollowing(prevIsFollowing);
      setFollowerCount(prevCount);
      showToast("Error de conexión al procesar la acción.", "error");
    } finally {
      
      setTimeout(() => {
        setIsLoadingFollow(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-10 animate-[fadeIn_0.5s_ease-out]">
      
      { }
      <div 
        className="w-full relative rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        { }
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        { }
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-[var(--accent)] bg-[#141517] flex items-center justify-center shadow-[0_0_20px_rgba(67,185,79,0.15)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(67,185,79,0.3)]">
            {profile.avatar_url ? (
              
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/retro_avatar.png";
                }}
              />
            ) : (
              
              <img
                src="/retro_avatar.png"
                alt="Avatar Default"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          { }
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[var(--bg-surface)] bg-[var(--accent)] shadow-md" />
        </div>

        { }
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {profile.username || "Coleccionista"}
                </h1>
                
                { }
                {profile.favorite_console && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                    <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> {profile.favorite_console}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                <span>Miembro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : 'Recientemente'}</span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-emerald-400 font-bold">{followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}</span>
              </p>
            </div>

            { }
            <div>
              {isOwnProfile ? (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold btn-secondary shadow-md cursor-pointer border border-gray-800"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Editar Perfil</span>
                </Link>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 active:scale-[0.97] cursor-pointer disabled:opacity-75 ${
                    isFollowing
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700/60"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  {isLoadingFollow ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <span>Siguiendo</span>
                  ) : (
                    <span>Seguir</span>
                  )}
                </button>
              )}
            </div>
          </div>

          { }
          <div className="max-w-2xl bg-[#141517]/40 rounded-xl p-3.5 border border-[var(--border)]/60 text-left">
            <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {profile.bio || "Este coleccionista aún no ha escrito su biografía en RetroLogger."}
            </p>
          </div>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        { }
        <div className="stat-card flex items-center justify-between p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-300" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Juegos en Estantería
            </p>
            <p className="text-3xl font-black text-white">{stats.totalGames}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Piezas registradas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/20 border border-emerald-500/10 flex items-center justify-center">
            <Library className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        { }
        <div className="stat-card flex items-center justify-between p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-300" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Valor Estimado
            </p>
            <p className="text-3xl font-black text-emerald-400">
              {stats.isPricePublic || stats.isMock ? `€${stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Privado 🔒"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {stats.isPricePublic || stats.isMock ? "Tasado al valor de mercado" : "Valor oculto por el usuario"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-center">
            <Gem className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        { }
        <div className="stat-card flex items-center justify-between p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/10 transition-all duration-300" />
          <div className="space-y-1.5 text-left">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Interés de la Comunidad
            </p>
            <p className="text-xl sm:text-2xl font-black text-orange-500">
              {stats.comunidadDeseados !== undefined ? stats.comunidadDeseados : 42} Coleccionistas
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Tienen piezas de tu estantería en su Lista de Deseos
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-950/20 border border-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
        </div>

      </div>

      { }
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" /> Vitrina de Honor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          { }
          <div 
            className="rounded-xl border p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            { }
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="aspect-[3/4] w-full sm:w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-[#141517] border border-[var(--border)] shadow-lg relative group">
              {favoriteGame?.coverUrl ? (
                
                <img 
                  src={favoriteGame.coverUrl} 
                  alt={favoriteGame.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Gamepad2 className="w-5 h-5 text-gray-500 mb-1" />
                  <span className="font-semibold mt-1">Sin juego favorito</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Mi Juego Favorito
                </span>
                {favoriteGame ? (
                  <div>
                    <h4 className="text-base font-extrabold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                      {favoriteGame.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                      {favoriteGame.platforms?.slice(0, 3).join(", ") || "Retro"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                      Aún no seleccionado
                    </h4>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      El coleccionista aún no ha destacado su juego preferido.
                    </p>
                  </div>
                )}
              </div>

              {favoriteGame && (
                <div className="pt-4 border-t border-[var(--border)]/50 mt-4 flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Estado en biblioteca:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    Completado <Award className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </div>
              )}
            </div>
          </div>

          { }
          <div 
            className="rounded-xl border p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden transition-all duration-300 hover:border-amber-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            { }
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="aspect-[3/4] w-full sm:w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-[#141517] border border-[var(--border)] shadow-lg relative group">
              {crownJewel?.coverUrl ? (
                
                <img 
                  src={crownJewel.coverUrl} 
                  alt={crownJewel.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Crown className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="font-semibold mt-1">Sin joya destacada</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/15 border border-amber-500/35 text-amber-400">
                  La Joya de la Corona
                </span>
                {crownJewel ? (
                  <div>
                    <h4 className="text-base font-extrabold text-white leading-tight group-hover:text-amber-400 transition-colors">
                      {crownJewel.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                      {crownJewel.platforms?.slice(0, 3).join(", ") || "Retro"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                      Aún no seleccionado
                    </h4>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      El coleccionista no ha destacado una pieza valiosa en su vitrina.
                    </p>
                  </div>
                )}
              </div>

              {crownJewel && (
                <div className="pt-4 border-t border-[var(--border)]/50 mt-4 flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Pieza de Gran Valor:</span>
                  <span className="font-black text-amber-400 flex items-center gap-1">
                    ★★★★★ CIB PAL-ES
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      { }
      {!isOwnProfile && currentUser && (
        <div className="flex border-b border-gray-800/80 pb-0.5 gap-6">
          <button
            type="button"
            onClick={() => setProfileTab("coleccion")}
            className={`px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer border-b-2 -mb-0.5 ${
              profileTab === "coleccion"
                ? "text-emerald-400 border-emerald-500"
                : "text-gray-500 hover:text-white border-transparent"
            }`}
          >
            🎮 Colección Completa
          </button>
          <button
            type="button"
            onClick={() => setProfileTab("comparar")}
            className={`px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer border-b-2 -mb-0.5 flex items-center gap-1.5 ${
              profileTab === "comparar"
                ? "text-emerald-400 border-emerald-500"
                : "text-gray-500 hover:text-white border-transparent"
            }`}
          >
            🔄 Comparar Colecciones
          </button>
        </div>
      )}

      {profileTab === "coleccion" ? (
        (() => {
          const displayedCollection = localCollection.filter(
            (item) => item.status === "collection" || item.status === "owned" || item.status === "playing" || item.status === "completed" || !item.status
          );
          return (
             
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" /> Colección Completa
                </h3>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {displayedCollection.length} juegos en propiedad
                </span>
              </div>

              {displayedCollection.length === 0 ? (
                <div 
                  className="rounded-xl flex flex-col items-center justify-center text-center py-16 px-6 border"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <Package className="w-10 h-10 text-gray-500 mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">Sin juegos públicos</h4>
                  <p className="text-xs max-w-xs" style={{ color: "var(--text-secondary)" }}>
                    Este usuario no tiene ningún juego registrado o su colección es totalmente privada.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {displayedCollection.map((item) => {
                    const statusMeta = STATUS_META[item.status] || { label: item.status, color: "var(--text-primary)", bg: "transparent" };
                    const conditionMeta = CONDITION_META[item.condition] || { label: item.condition, color: "text-gray-400 border-gray-800" };
                    
                    return (
                      <GameCardWithMenu
                        key={item.id}
                        item={item}
                        statusMeta={statusMeta}
                        conditionMeta={conditionMeta}
                        stats={stats}
                        profile={profile}
                        currentUser={currentUser}
                        isOwnProfile={isOwnProfile}
                        onEdit={(game) => setSelectedGameForDetails(game)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()
      ) : (
         
        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
                🔄 Comparador de Colecciones
              </h3>
              <p className="text-xs text-gray-400 mt-1">Comparando tu colección con la de @{profile.username || "este usuario"}</p>
            </div>

            { }
            {compareData && (
              <div className="flex gap-2 p-1 bg-[#141517] rounded-lg border border-gray-800 max-w-md">
                <button
                  type="button"
                  onClick={() => setCompareSubTab("comun")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                    compareSubTab === "comun"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  En Común ({compareData.coincidencias.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCompareSubTab("suyos")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                    compareSubTab === "suyos"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  Solo Él Tiene ({compareData.soloSuyos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCompareSubTab("deseados")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                    compareSubTab === "deseados"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  Mis Deseados ({compareData.matchDeseados.length})
                </button>
              </div>
            )}
          </div>

          { }
          {(isComparing || !compareData) ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-gray-800 rounded"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              { }
              {compareSubTab === "deseados" && (
                <div className="relative max-w-xs">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={wishlistSearchQuery}
                    onChange={(e) => setWishlistSearchQuery(e.target.value)}
                    placeholder="Filtrar deseados por título..."
                    className="w-full bg-[#141517] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-600 transition-colors"
                  />
                </div>
              )}

              { }
              {compareSubTab === "comun" && (
                compareData.coincidencias.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tienen ningún juego en común en sus colecciones.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {compareData.coincidencias.map((dbItem) => {
                      const item = mapDbToCard(dbItem);
                      const statusMeta = STATUS_META[item.status] || { label: item.status, color: "var(--text-primary)", bg: "transparent" };
                      const conditionMeta = CONDITION_META[item.condition] || { label: item.condition, color: "text-gray-400 border-gray-800" };
                      return (
                        <GameCardWithMenu
                          key={item.id}
                          item={item}
                          statusMeta={statusMeta}
                          conditionMeta={conditionMeta}
                          stats={stats}
                          profile={profile}
                          currentUser={currentUser}
                          isOwnProfile={false}
                          onEdit={null}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {compareSubTab === "suyos" && (
                compareData.soloSuyos.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tiene ningún juego que no tengas tú también.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {compareData.soloSuyos.map((dbItem) => {
                      const item = mapDbToCard(dbItem);
                      const statusMeta = STATUS_META[item.status] || { label: item.status, color: "var(--text-primary)", bg: "transparent" };
                      const conditionMeta = CONDITION_META[item.condition] || { label: item.condition, color: "text-gray-400 border-gray-800" };
                      return (
                        <GameCardWithMenu
                          key={item.id}
                          item={item}
                          statusMeta={statusMeta}
                          conditionMeta={conditionMeta}
                          stats={stats}
                          profile={profile}
                          currentUser={currentUser}
                          isOwnProfile={false}
                          onEdit={null}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {compareSubTab === "deseados" && (() => {
                const filtered = compareData.matchDeseados.filter((item) =>
                  item.title.toLowerCase().includes(wishlistSearchQuery.toLowerCase())
                );
                return filtered.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No se encontraron juegos deseados en común.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {filtered.map((dbItem) => {
                      const item = mapDbToCard(dbItem);
                      const statusMeta = STATUS_META[item.status] || { label: item.status, color: "var(--text-primary)", bg: "transparent" };
                      const conditionMeta = CONDITION_META[item.condition] || { label: item.condition, color: "text-gray-400 border-gray-800" };
                      return (
                        <div key={item.id} className="flex flex-col gap-2 group/trade">
                          <GameCardWithMenu
                            item={item}
                            statusMeta={statusMeta}
                            conditionMeta={conditionMeta}
                            stats={stats}
                            profile={profile}
                            currentUser={currentUser}
                            isOwnProfile={false}
                            onEdit={null}
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedTradeGame(item)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Proponer Intercambio</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      { }
      {selectedTradeGame && (
        <TradeProposalModal
          game={selectedTradeGame}
          ownerId={profile.id}
          currentUser={currentUser}
          onClose={() => setSelectedTradeGame(null)}
          initialMessage={`¡Hola! He estado comparando nuestras colecciones y veo que tienes '${selectedTradeGame.title}' (${selectedTradeGame.platform}) en tu colección, el cual tengo en mi lista de deseos. ¿Te interesaría algún intercambio?`}
        />
      )}

      {selectedGameForDetails && (
        <MyGameDetailsModal
          game={{
            id: selectedGameForDetails.id,
            game_id: selectedGameForDetails.gameId,
            title: selectedGameForDetails.title,
            cover_url: selectedGameForDetails.coverUrl,
            platform: selectedGameForDetails.platform,
            status: selectedGameForDetails.status,
            condition: selectedGameForDetails.condition,
            purchase_price: selectedGameForDetails.purchasePrice,
            region: selectedGameForDetails.region,
            added_at: selectedGameForDetails.addedAt || new Date().toISOString(),
            notes: selectedGameForDetails.notes || "",
            edition: selectedGameForDetails.edition || "",
            images_urls: selectedGameForDetails.imagesUrls || []
          }}
          onClose={() => setSelectedGameForDetails(null)}
          onUpdate={handleGameUpdate}
          onDelete={handleGameDelete}
        />
      )}

    </div>
  );
}
