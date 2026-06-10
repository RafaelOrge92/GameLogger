"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchGamesIGDB, getGameByIdIGDB } from "@/features/market/services/igdb";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";
import { getCollection } from "@/features/collection/actions";
import ProfileClient from "@/app/user/[username]/ProfileClient";

interface GameHighlight {
  id: number;
  name: string;
  coverUrl: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favoriteConsole, setFavoriteConsole] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteGame, setFavoriteGame] = useState<GameHighlight | null>(null);
  const [crownJewel, setCrownJewel] = useState<GameHighlight | null>(null);

  
  const [searchFavQuery, setSearchFavQuery] = useState("");
  const [searchCrownQuery, setSearchCrownQuery] = useState("");
  const [favResults, setFavResults] = useState<any[]>([]);
  const [crownResults, setCrownResults] = useState<any[]>([]);
  const [isSearchingFav, setIsSearchingFav] = useState(false);
  const [isSearchingCrown, setIsSearchingCrown] = useState(false);
  const [showFavDropdown, setShowFavDropdown] = useState(false);
  const [showCrownDropdown, setShowCrownDropdown] = useState(false);

  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("editar");
  const [myCollection, setMyCollection] = useState<any[]>([]);
  const [profileId, setProfileId] = useState("");
  const [profileCreatedAt, setProfileCreatedAt] = useState("");
  const [currentUserState, setCurrentUserState] = useState<any>(null);
  const [isValuePublic, setIsValuePublic] = useState(false);

  
  const debouncedFavQuery = useDebounce(searchFavQuery, 500);
  const debouncedCrownQuery = useDebounce(searchCrownQuery, 500);

  
  const favDropdownRef = useRef<HTMLDivElement>(null);
  const crownDropdownRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setCurrentUserState(user);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error loading user profile:", profileError);
          showToast("Error al cargar los datos del perfil.", "error");
          return;
        }

        if (profile) {
          setProfileId(profile.id || "");
          setProfileCreatedAt(profile.created_at || "");
          setUsername(profile.username || "");
          setAvatarUrl(profile.avatar_url || "");
          setFavoriteConsole(profile.favorite_console || "");
          setBio(profile.bio || "");
          setIsValuePublic(profile.is_value_public || false);

          
          const promises = [];
          if (profile.favorite_game_id) {
            promises.push(
              getGameByIdIGDB(Number(profile.favorite_game_id)).then(game => {
                if (game) setFavoriteGame(game);
              })
            );
          }
          if (profile.crown_jewel_id) {
            promises.push(
              getGameByIdIGDB(Number(profile.crown_jewel_id)).then(game => {
                if (game) setCrownJewel(game);
              })
            );
          }

          
          promises.push(
            getCollection().then(async (colRes) => {
              const rawColls = colRes.success ? colRes.data : [];
              const { data: userItems } = await supabase
                .from("user_collection")
                .select("*")
                .eq("user_id", user.id);

              const itemMap = new Map(userItems?.map(ui => [String(ui.game_id), ui]) || []);
              const unifiedCollection = rawColls.map((c: any) => {
                const physicalItem = itemMap.get(String(c.game_id));
                return {
                  id: c.id,
                  gameId: c.game_id,
                  title: c.title,
                  coverUrl: c.cover_url,
                  platform: c.platform,
                  status: c.status || "owned",
                  condition: physicalItem?.condition_state || c.condition || "cib",
                  purchasePrice: physicalItem?.purchase_price || c.purchase_price || null,
                  region: physicalItem?.region || "PAL-ES"
                };
              });
              setMyCollection(unifiedCollection);
            })
          );

          await Promise.all(promises);
        }
      } catch (err) {
        console.error("Unexpected error loading settings:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [router, supabase, showToast]);

  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (favDropdownRef.current && !favDropdownRef.current.contains(e.target as Node)) {
        setShowFavDropdown(false);
      }
      if (crownDropdownRef.current && !crownDropdownRef.current.contains(e.target as Node)) {
        setShowCrownDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  useEffect(() => {
    async function searchFav() {
      if (!debouncedFavQuery.trim()) {
        setFavResults([]);
        setShowFavDropdown(false);
        return;
      }
      setIsSearchingFav(true);
      setShowFavDropdown(true);
      try {
        const results = await searchGamesIGDB(debouncedFavQuery);
        setFavResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingFav(false);
      }
    }
    searchFav();
  }, [debouncedFavQuery]);

  
  useEffect(() => {
    async function searchCrown() {
      if (!debouncedCrownQuery.trim()) {
        setCrownResults([]);
        setShowCrownDropdown(false);
        return;
      }
      setIsSearchingCrown(true);
      setShowCrownDropdown(true);
      try {
        const results = await searchGamesIGDB(debouncedCrownQuery);
        setCrownResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCrown(false);
      }
    }
    searchCrown();
  }, [debouncedCrownQuery]);

  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (bio.length > 150) {
      showToast("La biografía no puede superar los 150 caracteres.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          avatar_url: avatarUrl,
          favorite_console: favoriteConsole,
          bio,
          favorite_game_id: favoriteGame ? favoriteGame.id : null,
          crown_jewel_id: crownJewel ? crownJewel.id : null,
          is_value_public: isValuePublic,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        showToast("¡Perfil actualizado con éxito!", "success");
        router.refresh();
      } else {
        showToast(result.error || "Error al actualizar el perfil.", "error");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Error de conexión al guardar cambios.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return <SettingsSkeleton />;
  }  
  const totalGames = myCollection.length;
  const totalValue = myCollection.reduce(
    (sum, item) => sum + (item.purchasePrice ? Number(item.purchasePrice) : 0),
    0
  );
  const completedCount = myCollection.filter(item => item.status === "completed").length;
  const completedPercentage = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

  const stats = {
    totalGames,
    totalValue,
    completedPercentage,
    completedCount,
    isPricePublic: isValuePublic,
    isMock: false,
    comunidadDeseados: Math.round(totalGames * 1.8) || 12
  };

  const displayProfile = {
    id: profileId,
    username: username || "Coleccionista",
    avatar_url: avatarUrl || "/retro_avatar.png",
    bio: bio,
    favorite_console: favoriteConsole,
    created_at: profileCreatedAt
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>⚙️</span> Ajustes de Perfil
        </h1>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">Personaliza tu perfil, avatar y catálogo destacado</p>
      </div>

      { }
      <div className="flex border-b border-gray-800/80 pb-0.5 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("editar")}
          className={`px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer border-b-2 -mb-0.5 ${
            activeTab === "editar"
              ? "text-emerald-400 border-emerald-500"
              : "text-gray-500 hover:text-white border-transparent"
          }`}
        >
          Editar Ajustes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vista-previa")}
          className={`px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer border-b-2 -mb-0.5 ${
            activeTab === "vista-previa"
              ? "text-emerald-400 border-emerald-500"
              : "text-gray-500 hover:text-white border-transparent"
          }`}
        >
          Vista Previa Pública
        </button>
      </div>

      {activeTab === "editar" ? (
        <form onSubmit={handleSave} className="bg-[#18191b] border border-gray-800 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 shadow-2xl transition-all duration-300">
          
          { }
          <div className="flex flex-col items-center gap-4 w-full md:w-1/3 shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-800 bg-[#0f0f10] flex items-center justify-center shadow-lg relative">
                {avatarUrl ? (
                  
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = document.getElementById("avatar-fallback");
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  id="avatar-fallback"
                  className="absolute inset-0 bg-emerald-950/20 text-emerald-400 text-4xl md:text-5xl font-black flex items-center justify-center rounded-full"
                  style={{ display: avatarUrl ? "none" : "flex" }}
                >
                  {username ? username.trim().charAt(0).toUpperCase() : "?"}
                </div>
              </div>
            </div>
            
            <div className="w-full space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-1.5 text-white text-xs transition-colors placeholder-gray-700"
              />
            </div>
            <span className="text-[10px] text-gray-500 text-center leading-normal">
              La vista previa de la foto se actualizará en tiempo real si pegas un enlace válido.
            </span>
          </div>

          { }
          <div className="flex-1 space-y-5">
            
            { }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Tu alias"
                  className="w-full bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg px-4 py-2 text-white text-sm transition-colors placeholder-gray-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Consola Preferida</label>
                <input
                  type="text"
                  value={favoriteConsole}
                  onChange={(e) => setFavoriteConsole(e.target.value)}
                  placeholder="Ej: SNES, PlayStation 1, Mega Drive"
                  className="w-full bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg px-4 py-2 text-white text-sm transition-colors placeholder-gray-700"
                />
              </div>
            </div>

            { }
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Biografía</label>
                <span className={`text-[10px] font-bold ${150 - bio.length <= 15 ? "text-rose-500 animate-[pulse_1s_infinite]" : "text-gray-500"}`}>
                  {150 - bio.length} / 150
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Cuéntanos un poco sobre ti y tu gusto retro..."
                rows={3}
                maxLength={150}
                className="w-full bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg px-4 py-2.5 text-white text-sm transition-colors placeholder-gray-700 resize-none leading-relaxed"
              />
            </div>

            { }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              { }
              <div className="space-y-1.5 relative" ref={favDropdownRef}>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Juego Favorito</label>
                
                {favoriteGame ? (
                   
                  <div className="bg-[#0f0f10] border border-emerald-500/10 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-md animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 min-w-0">
                      {favoriteGame.coverUrl ? (
                        
                        <img src={favoriteGame.coverUrl} alt={favoriteGame.name} className="w-9 h-12 object-cover rounded shrink-0 border border-gray-800" />
                      ) : (
                        <div className="w-9 h-12 bg-gray-900 border border-gray-800 text-gray-600 rounded flex items-center justify-center shrink-0 text-xs">?</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{favoriteGame.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">Juego destacado</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFavoriteGame(null)}
                      className="text-[10px] text-rose-500 hover:text-rose-400 font-bold px-2 py-1 hover:bg-rose-950/20 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                   
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchFavQuery}
                      onChange={(e) => setSearchFavQuery(e.target.value)}
                      onFocus={() => { if (searchFavQuery.trim()) setShowFavDropdown(true); }}
                      placeholder="Buscar juego favorito..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg text-white text-sm transition-colors placeholder-gray-700"
                    />
                    {isSearchingFav && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-emerald-500" />
                      </div>
                    )}

                    { }
                    {showFavDropdown && searchFavQuery.trim() && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-[#18191b] border border-gray-800 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-900 scrollbar-thin">
                        {favResults.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 text-center">No se encontraron juegos retro</div>
                        ) : (
                          favResults.map((game) => (
                            <div
                              key={game.id}
                              onClick={() => {
                                setFavoriteGame(game);
                                setSearchFavQuery("");
                                setShowFavDropdown(false);
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-[#0f0f10] cursor-pointer transition-colors"
                            >
                              {game.coverUrl ? (
                                
                                <img src={game.coverUrl} alt={game.name} className="w-7 h-9 object-cover rounded shrink-0 border border-gray-900" />
                              ) : (
                                <div className="w-7 h-9 bg-gray-900 text-gray-600 rounded flex items-center justify-center shrink-0 text-[10px]">?</div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{game.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {game.releaseDate?.substring(0, 4)} {game.platforms.length > 0 ? `· ${game.platforms.slice(0, 1).join("")}` : ""}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              { }
              <div className="space-y-1.5 relative" ref={crownDropdownRef}>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Joya de la Colección</label>
                
                {crownJewel ? (
                   
                  <div className="bg-[#0f0f10] border border-emerald-500/10 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-md animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 min-w-0">
                      {crownJewel.coverUrl ? (
                        
                        <img src={crownJewel.coverUrl} alt={crownJewel.name} className="w-9 h-12 object-cover rounded shrink-0 border border-gray-800" />
                      ) : (
                        <div className="w-9 h-12 bg-gray-900 border border-gray-800 text-gray-600 rounded flex items-center justify-center shrink-0 text-xs">?</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{crownJewel.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">Joya más valiosa</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCrownJewel(null)}
                      className="text-[10px] text-rose-500 hover:text-rose-400 font-bold px-2 py-1 hover:bg-rose-950/20 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                   
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchCrownQuery}
                      onChange={(e) => setSearchCrownQuery(e.target.value)}
                      onFocus={() => { if (searchCrownQuery.trim()) setShowCrownDropdown(true); }}
                      placeholder="Buscar joya..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0f0f10] border border-gray-800 focus:border-emerald-500 focus:outline-none rounded-lg text-white text-sm transition-colors placeholder-gray-700"
                    />
                    {isSearchingCrown && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-emerald-500" />
                      </div>
                    )}

                    { }
                    {showCrownDropdown && searchCrownQuery.trim() && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-[#18191b] border border-gray-800 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-900 scrollbar-thin">
                        {crownResults.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 text-center">No se encontraron juegos retro</div>
                        ) : (
                          crownResults.map((game) => (
                            <div
                              key={game.id}
                              onClick={() => {
                                setCrownJewel(game);
                                setSearchCrownQuery("");
                                setShowCrownDropdown(false);
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-[#0f0f10] cursor-pointer transition-colors"
                            >
                              {game.coverUrl ? (
                                
                                <img src={game.coverUrl} alt={game.name} className="w-7 h-9 object-cover rounded shrink-0 border border-gray-900" />
                              ) : (
                                <div className="w-7 h-9 bg-gray-900 text-gray-600 rounded flex items-center justify-center shrink-0 text-[10px]">?</div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{game.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {game.releaseDate?.substring(0, 4)} {game.platforms.length > 0 ? `· ${game.platforms.slice(0, 1).join("")}` : ""}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            { }
            <div className="flex items-center gap-3 bg-[#0f0f10] border border-gray-800 rounded-lg p-3">
              <input
                type="checkbox"
                id="is_value_public"
                checked={isValuePublic}
                onChange={(e) => setIsValuePublic(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-emerald-400 bg-gray-900 border-gray-800 focus:ring-emerald-500 focus:ring-opacity-25 focus:ring-2 accent-emerald-400 cursor-pointer"
              />
              <label htmlFor="is_value_public" className="text-xs text-gray-300 font-bold select-none cursor-pointer flex flex-col text-left">
                <span>Hacer público el valor estimado de mi colección</span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">Si está desactivado, otros usuarios no verán la tasación en euros en tu perfil público.</span>
              </label>
            </div>

            </div>

            { }
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>

          </div>

        </form>
      ) : (
        <div className="bg-[#18191b] border border-gray-800 rounded-xl p-6 sm:p-8 shadow-2xl transition-all duration-300 animate-[fadeIn_0.3s_ease-out]">
          <div className="mb-6 flex justify-between items-center border-b border-gray-800/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vista previa de tu perfil público</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Así es como verán tu perfil otros coleccionistas (incluye cambios sin guardar).</p>
            </div>
            {username && (
              <a
                href={`/user/${username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Visitar Perfil</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          <div className="w-full">
            <ProfileClient
              profile={displayProfile}
              initialIsFollowing={false}
              initialFollowerCount={0}
              currentUser={currentUserState}
              collection={myCollection}
              stats={stats}
              favoriteGame={favoriteGame}
              crownJewel={crownJewel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-gray-800 rounded"></div>
        <div className="h-3.5 w-72 bg-gray-800 rounded"></div>
      </div>

      <div className="bg-[#18191b] border border-gray-800 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-800"></div>
          <div className="h-8 w-full bg-gray-800 rounded-lg"></div>
        </div>
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-10 bg-gray-800 rounded-lg"></div>
          </div>
          <div className="h-24 bg-gray-800 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 bg-gray-800 rounded-lg"></div>
            <div className="h-12 bg-gray-800 rounded-lg"></div>
          </div>
          <div className="h-10 w-36 bg-gray-800 rounded-lg ml-auto"></div>
        </div>
      </div>
    </div>
  );
}
