"use client";

import { useState, useEffect, useRef } from "react";
import { searchGamesIGDB } from "@/features/market/services/igdb";
import { useDebounce } from "@/hooks/useDebounce";
import GameModal from "@/components/layout/GameModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addGameToCollection } from "@/features/collection/actions";
import { useToast } from "@/context/ToastContext";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGameForModal, setSelectedGameForModal] = useState<any | null>(null);
  
  const debouncedQuery = useDebounce(query, 500); // 500ms delay
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to handle search automatically
  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const data = await searchGamesIGDB(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }
    performSearch();
  }, [debouncedQuery]);

  return (
    <header className="h-16 bg-[#050505] border-b-2 border-[#ff6b00] flex items-center justify-between px-6 shrink-0 relative z-50">
      
      {/* Search Bar Container */}
      <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
        <div className="relative">
          <svg 
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ff6b00]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim()) setShowDropdown(true); }}
            placeholder="[BUSCAR_JUEGO_AQUI_]"
            className="w-full bg-[#0f0f0f] border-2 border-[#ff6b00] rounded-none py-2 pl-10 pr-4 text-[#00ff00] font-retro tracking-widest text-lg placeholder-[#ff6b00]/50 focus:outline-none focus:shadow-[0_0_10px_#ff6b00] transition-shadow"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ff6b00] font-retro animate-pulse">BUSCANDO...</span>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && (query.trim().length > 0) && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#050505] border-2 border-[#ff6b00] shadow-[4px_4px_0px_#ff6b00] max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-[#ff6b00] font-retro">CARGANDO DATOS...</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-[#ff6b00] font-retro">NO SE ENCONTRARON COINCIDENCIAS</div>
            ) : (
              <ul className="divide-y divide-[#ff6b00]/30">
                {results.map((game) => (
                  <li 
                    key={game.id} 
                    className="p-3 flex items-center justify-between hover:bg-[#0f0f0f] cursor-pointer transition-colors group"
                    onClick={() => {
                      setSelectedGameForModal(game);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt={game.name} className="w-10 h-14 object-cover border border-[#ff6b00]" />
                      ) : (
                        <div className="w-10 h-14 bg-[#0f0f0f] border border-[#ff6b00] flex items-center justify-center text-xs text-[#ff6b00] font-retro text-center">N/A</div>
                      )}
                      <div>
                        <p className="font-bold text-white group-hover:text-[#ff6b00] transition-colors">{game.name}</p>
                        <p className="text-xs text-gray-400">
                          {game.releaseDate?.substring(0, 4)} • {game.platforms?.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering parent row click
                          setSelectedGameForModal(game);
                          setShowDropdown(false);
                        }}
                        className="bg-[#ff6b00] text-black font-bold px-2 py-1 text-xs rounded-none hover:bg-white transition-colors uppercase font-retro cursor-pointer"
                      >
                        Detalles
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Profile Actions */}
      <div className="flex items-center gap-4 ml-4">
        {user ? (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-[#ff6b00] font-retro uppercase">Usuario</p>
              <p className="text-sm font-bold text-white">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"}
              </p>
            </div>
            <div className="w-10 h-10 bg-[#ff6b00] border-2 border-white rounded-none flex items-center justify-center text-black font-bold font-retro uppercase" title={user.email}>
              {user.user_metadata?.full_name?.[0] || user.email?.[0] || "U"}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 border-2 border-[#ff6b00] text-[#ff6b00] font-retro text-sm hover:bg-[#ff6b00] hover:text-black transition-colors shadow-[2px_2px_0px_#ff6b00]"
          >
            INICIAR SESIÓN
          </Link>
        )}
      </div>

      {/* Game Details & Pricing Modal */}
      {selectedGameForModal && (
        <GameModal
          game={selectedGameForModal}
          onClose={() => setSelectedGameForModal(null)}
          onSuccess={() => {
            setQuery("");
            setShowDropdown(false);
            router.refresh(); // Refresh layout and page server component data smoothly
          }}
        />
      )}
    </header>
  );
}
