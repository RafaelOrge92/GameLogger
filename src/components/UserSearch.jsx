/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Assume API returns array of user objects directly
          setResults(Array.isArray(data) ? data : data.results || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle input changes, setting loading/resetting state outside the useEffect
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setSelectedIndex(-1);
    } else {
      setLoading(true);
      setSelectedIndex(-1);
    }
  };

  // Handle keyboard navigation inside dropdown
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => 
        prevIndex < results.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => 
        prevIndex > 0 ? prevIndex - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        const selectedUser = results[selectedIndex];
        router.push(`/user/${selectedUser.username}`);
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        {/* Search Icon (Magnifying Glass) */}
        <span className="absolute left-3.5 text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>

        {/* Input Text Box */}
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar coleccionistas..."
          className="w-full bg-[#212427] text-white placeholder-gray-400 text-sm rounded-lg pl-10 pr-10 py-2.5 border border-transparent focus:border-emerald-500 focus:outline-none transition-all duration-200"
        />

        {/* Loading Spinner */}
        {loading && (
          <span className="absolute right-3.5 flex h-4 w-4 items-center justify-center">
            <svg
              className="animate-spin h-4 w-4 text-emerald-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </div>

      {/* Floating Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[#18191b] border border-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400 gap-2">
              <span className="h-4 w-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <span>Buscando usuarios...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 px-4 text-center text-sm text-gray-400">
              No se encontraron coleccionistas con ese nombre
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-800/40">
              {results.map((user, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <li key={user.id || user.username || index}>
                    <Link
                      href={`/user/${user.username}`}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 ${
                        isSelected 
                          ? "bg-emerald-950/25 text-emerald-400 border-l-2 border-emerald-500" 
                          : "hover:bg-gray-800/40 text-gray-200 hover:text-white"
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* Left side: Avatar + Username */}
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            onError={(e) => {
                              // If avatar fails to load, replace with fallback
                              e.target.onerror = null;
                              e.target.src = "/retro_avatar.png";
                            }}
                            className="w-8 h-8 rounded-full object-cover border border-gray-800"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {user.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                          </div>
                        )}
                        <span className={`text-sm font-semibold transition-colors ${
                          isSelected ? "text-emerald-400" : "text-white"
                        }`}>
                          {user.username}
                        </span>
                      </div>

                      {/* Right side: Favorite Console */}
                      {user.favorite_console && (
                        <div className="flex items-center gap-1.5 bg-[#212427]/40 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 border border-gray-800/30">
                          <span>🎮</span>
                          <span>{user.favorite_console}</span>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
