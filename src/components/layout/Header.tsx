"use client";

import { useState, useEffect, useRef } from "react";
import { searchGamesIGDB } from "@/features/market/services/igdb";
import { addGameToCollection } from "@/features/collection/actions";
import { useDebounce } from "@/hooks/useDebounce";

export default function Header() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
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

  const handleAdd = async (game: any) => {
    // Optimistic UI could be added here, but let's keep it simple
    alert(`Añadiendo ${game.name} a tu colección...`);
    const result = await addGameToCollection(
      game.id, 
      game.name, 
      game.platforms?.[0] || "Desconocida", 
      game.coverUrl
    );

    if (result.error) {
      alert(result.error);
    } else {
      alert(`${game.name} añadido correctamente!`);
      setShowDropdown(false);
      setQuery("");
    }
  };

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
                  <li key={game.id} className="p-3 flex items-center justify-between hover:bg-[#0f0f0f] transition-colors group">
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
                    <button 
                      onClick={() => handleAdd(game)}
                      className="bg-[#ff6b00] text-black font-bold px-3 py-1 text-sm rounded-none hover:bg-white transition-colors uppercase font-retro"
                    >
                      Añadir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Profile Actions */}
      <div className="flex items-center gap-4 ml-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-[#ff6b00] font-retro uppercase">Usuario</p>
          <p className="text-sm font-bold">Admin Test</p>
        </div>
        <div className="w-10 h-10 bg-[#ff6b00] border-2 border-white rounded-none flex items-center justify-center text-black font-bold font-retro">
          A
        </div>
      </div>
    </header>
  );
}
