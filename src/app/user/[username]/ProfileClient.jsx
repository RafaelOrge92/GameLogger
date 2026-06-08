"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { Gamepad2, Library, Gem, Flame, Sparkles, Crown, Package, Award } from "lucide-react";

// Status configuration matching page.tsx
const STATUS_META = {
  playing:      { label: "Jugando",       color: "var(--status-playing)", bg: "rgba(76, 168, 212, 0.1)" },
  completed:    { label: "Completado",    color: "var(--status-completed)", bg: "rgba(67, 185, 79, 0.1)" },
  plan_to_play: { label: "Pendiente",     color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  dropped:      { label: "Abandonado",    color: "var(--status-dropped)", bg: "rgba(248, 113, 113, 0.1)" },
  owned:        { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
};

// Condition badge style configuration
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
  const { showToast } = useToast();

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast("Debes iniciar sesión para seguir coleccionistas.", "error");
      return;
    }
    
    setIsLoadingFollow(true);
    const prevIsFollowing = isFollowing;
    const prevCount = followerCount;

    // Optimistic Update
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
          // Revert on unexpected status
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
      // Disable the button for exactly 1 second to prevent double clicks
      setTimeout(() => {
        setIsLoadingFollow(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-10 animate-[fadeIn_0.5s_ease-out]">
      
      {/* 1. Cabecera del Perfil (Hero de Bienvenida) */}
      <div 
        className="w-full relative rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        {/* Profile Picture */}
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-[var(--accent)] bg-[#141517] flex items-center justify-center shadow-[0_0_20px_rgba(67,185,79,0.15)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(67,185,79,0.3)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/retro_avatar.png";
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/retro_avatar.png"
                alt="Avatar Default"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Active indicator dot */}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[var(--bg-surface)] bg-[var(--accent)] shadow-md" />
        </div>

        {/* Profile details */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {profile.username || "Coleccionista"}
                </h1>
                
                {/* Console tag */}
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

            {/* Social Button */}
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

          {/* Bio text */}
          <div className="max-w-2xl bg-[#141517]/40 rounded-xl p-3.5 border border-[var(--border)]/60 text-left">
            <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {profile.bio || "Este coleccionista aún no ha escrito su biografía en RetroLogger."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Fila de Mini-Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Stat Card 1 */}
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

        {/* Stat Card 2 */}
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

        {/* Stat Card 3: Interés de la Comunidad */}
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

      {/* 3. El Escaparate de Destacados (Vitrina de Honor) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" /> Vitrina de Honor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta A: Mi Juego Favorito */}
          <div 
            className="rounded-xl border p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="aspect-[3/4] w-full sm:w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-[#141517] border border-[var(--border)] shadow-lg relative group">
              {favoriteGame?.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
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

          {/* Tarjeta B: La Joya de la Corona */}
          <div 
            className="rounded-xl border p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden transition-all duration-300 hover:border-amber-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="aspect-[3/4] w-full sm:w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-[#141517] border border-[var(--border)] shadow-lg relative group">
              {crownJewel?.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
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

      {/* 4. La Cuadrícula de la Colección */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-emerald-400" /> Colección Completa
          </h3>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {collection.length} juegos en propiedad
          </span>
        </div>

        {collection.length === 0 ? (
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
            {collection.map((item) => {
              const statusMeta = STATUS_META[item.status] || { label: item.status, color: "var(--text-primary)", bg: "transparent" };
              const conditionMeta = CONDITION_META[item.condition] || { label: item.condition, color: "text-gray-400 border-gray-800" };
              
              return (
                <div 
                  key={item.id} 
                  className="game-card flex flex-col overflow-hidden select-none"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
                >
                  {/* Cover block */}
                  <div className="aspect-[3/4] relative w-full overflow-hidden bg-[#141517]">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.coverUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase">
                        {item.title}
                      </div>
                    )}

                    {/* Physical Condition floating Badge on Hover */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center p-2 text-center pointer-events-none">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${conditionMeta.color} shadow-lg backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-200`}>
                        {conditionMeta.label}
                      </span>
                      {item.platform && (
                        <span className="mt-1.5 text-[9px] text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded font-semibold border border-gray-800">
                          {item.platform}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata below cover */}
                  <div className="p-3 space-y-1.5 bg-[#1f2125]/50 border-t border-[var(--border)]/55 flex-1 flex flex-col justify-between">
                    <p 
                      className="text-xs font-bold text-white truncate leading-tight hover:text-emerald-400 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase" 
                        style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                      >
                        {statusMeta.label}
                      </span>
                      {item.purchasePrice && (stats.isPricePublic || stats.isMock) && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          €{parseFloat(item.purchasePrice).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status bottom bar */}
                  <div className="h-1 w-full" style={{ backgroundColor: statusMeta.color }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
