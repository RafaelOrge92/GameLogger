"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchGamesIGDB } from "@/features/market/services/igdb";
import { useDebounce } from "@/hooks/useDebounce";
import GameModal from "@/components/layout/GameModal";
import { addGameToCollection } from "@/features/collection/actions";
import { useToast } from "@/context/ToastContext";

const NAV_LINKS = [
  { href: "/", label: "Mi Colección" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/hunt", label: "Alertas de Caza" },
];

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const supabase = createClient();

  // Search state
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-search
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
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
    performSearch();
  }, [debouncedQuery]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (u: any) => {
    const name = u?.user_metadata?.full_name || u?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  const getUserName = (u: any) =>
    u?.user_metadata?.full_name || u?.email?.split("@")[0] || "Usuario";

  return (
    <>
      <nav
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
        }}
        className="sticky top-0 z-50 w-full"
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-14">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
              >
                R
              </div>
              <span
                className="font-semibold text-[15px] hidden sm:block"
                style={{ color: 'var(--text-primary)' }}
              >
                RetroLogger
              </span>
            </Link>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative w-56 sm:w-72" ref={dropdownRef}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => { if (query.trim()) setShowDropdown(true); }}
                  placeholder="Buscar juegos..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocusCapture={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  }}
                  onBlurCapture={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && query.trim().length > 0 && (
                <div
                  className="absolute top-full right-0 mt-1 w-full sm:w-96 rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hover)',
                    zIndex: 100,
                  }}
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Buscando...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Sin resultados para "{query}"
                    </div>
                  ) : (
                    <ul className="py-1 max-h-80 overflow-y-auto">
                      {results.map((game) => (
                        <li
                          key={game.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                          style={{ transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                          onClick={() => {
                            setSelectedGame(game);
                            setShowDropdown(false);
                          }}
                        >
                          {game.coverUrl ? (
                            <img
                              src={game.coverUrl}
                              alt={game.name}
                              className="w-9 h-12 object-cover rounded shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-12 rounded shrink-0 flex items-center justify-center text-xs"
                              style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                            >
                              ?
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {game.name}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {game.releaseDate?.substring(0, 4)}
                              {game.platforms?.length > 0 && ` · ${game.platforms.slice(0, 2).join(", ")}`}
                            </p>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user) return;
                              try {
                                const platform = game.platforms?.[0] || "PC";
                                const result = await addGameToCollection(
                                  game.id, game.name, platform, "owned", "cib", null, null, null
                                );
                                if (result.error) {
                                  showToast(result.error, "error");
                                } else {
                                  showToast(`${game.name} añadido a tu colección`, "success");
                                  setQuery("");
                                  setShowDropdown(false);
                                  router.refresh();
                                }
                              } catch (err) {
                                showToast("Error al añadir el juego", "error");
                              }
                            }}
                            className="shrink-0 px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: 'var(--accent-dim)',
                              color: 'var(--accent)',
                              border: '1px solid var(--border-accent)',
                            }}
                            title="Añadir a colección"
                          >
                            + Añadir
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* User area */}
            {user ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSignOut}
                  className="hidden sm:block text-sm px-3 py-1.5 rounded-md"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                >
                  Salir
                </button>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 cursor-default"
                  style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
                  title={getUserName(user)}
                >
                  {getInitials(user)}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium px-3 py-1.5 rounded-md shrink-0"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#0d1117',
                }}
              >
                Iniciar sesión
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-sm"
                  style={{
                    color: pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: pathname === link.href ? 'var(--bg-elevated)' : 'transparent',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Game detail modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSuccess={() => {
            setQuery("");
            setShowDropdown(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
