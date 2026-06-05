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
import UserSearch from "@/components/UserSearch";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/marketplace", label: "Mercado" },
  { href: "/dashboard/settings", label: "Mi Perfil" },
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

  if (!user) {
    return (
      <nav
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
        }}
        className="sticky top-0 z-50 w-full"
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
            >
              R
            </div>
            <span
              className="font-bold text-lg tracking-tight font-sans transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              RetroLogger
            </span>
          </Link>

          {/* Sign In Button */}
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-500/20 hover:bg-emerald-950/20"
            style={{ color: 'var(--accent)' }}
          >
            Sign In
          </Link>
        </div>
      </nav>
    );
  }

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
            <div className="hidden md:flex items-center h-full">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 h-full flex items-center text-sm font-semibold relative transition-colors duration-150 ${
                      isActive
                        ? "text-emerald-400 font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User Search (Collectors) */}
            <div className="hidden md:block w-48 lg:w-56 shrink-0">
              <UserSearch />
            </div>

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
                <Link
                  href="/dashboard/settings"
                  className="hidden sm:block text-xs font-semibold px-2.5 py-1.5 rounded border border-gray-800 bg-[#0f0f10]/40 transition-all hover:bg-emerald-950/20 hover:border-emerald-500/20 text-gray-400 hover:text-white"
                >
                  Ajustes
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:block text-xs font-semibold px-2.5 py-1.5 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Salir
                </button>
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold shrink-0 cursor-default border border-gray-800 bg-[#0f0f10]"
                  title={getUserName(user)}
                >
                  {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        const fb = document.getElementById("nav-avatar-fallback");
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    id="nav-avatar-fallback"
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: '#0d1117',
                      display: user?.user_metadata?.avatar_url ? "none" : "flex"
                    }}
                  >
                    {getInitials(user)}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium px-3 py-1.5 rounded-md shrink-0 btn-primary"
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
            <div className="md:hidden pb-3 space-y-3 px-3">
              <div className="pt-2">
                <UserSearch />
              </div>
              <div className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-emerald-950/20 text-emerald-400 border-l-2 border-emerald-500 font-semibold"
                          : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
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
