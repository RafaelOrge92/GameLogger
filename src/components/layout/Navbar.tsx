"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchGamesIGDB } from "@/features/market/services/igdb";
import { useDebounce } from "@/hooks/useDebounce";
import GameModal from "@/components/layout/GameModal";
import { useToast } from "@/context/ToastContext";
import UserSearch from "@/components/UserSearch";
import NotificationInbox from "@/components/layout/NotificationInbox";

import {
  Search,
  X,
  Loader2,
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Gamepad2,
  Users,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Mercado", icon: ShoppingBag },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
];

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const supabase = createClient();

  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  
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

  const getUserEmail = (u: any) => u?.email || "";

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 w-full" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="RetroLogger Logo" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 border" style={{ color: "var(--accent)", borderColor: "transparent" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(67,185,79,0.2)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(67,185,79,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>
    );
  }

  
  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          backgroundColor: "rgba(32, 34, 38, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-[58px]">

            { }
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <img src="/logo.png" alt="RetroLogger Logo" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
            </Link>

            { }
            <div className="hidden md:flex items-center h-full gap-0.5 ml-2">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group"
                    style={{
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      backgroundColor: isActive ? "rgba(67,185,79,0.08)" : "transparent",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <Icon
                      className="w-[15px] h-[15px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{link.label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                        style={{ backgroundColor: "var(--accent)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            { }
            <div className="flex-1" />

            { }
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="w-44 xl:w-52">
                <UserSearch />
              </div>
            </div>

            { }
            <div className="relative w-44 sm:w-60 lg:w-72" ref={dropdownRef}>
              <div
                className="relative flex items-center transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: `1px solid ${searchFocused ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "10px",
                  boxShadow: searchFocused ? "0 0 0 3px rgba(67,185,79,0.12)" : "none",
                }}
              >
                <Search
                  className="absolute left-3 w-3.5 h-3.5 pointer-events-none transition-colors duration-150 shrink-0"
                  style={{ color: searchFocused ? "var(--accent)" : "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (query.trim()) setShowDropdown(true);
                  }}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Buscar juegos..."
                  className="w-full bg-transparent pl-8 pr-8 py-2 text-[13px] focus:outline-none placeholder:text-[var(--text-muted)]"
                  style={{ color: "var(--text-primary)" }}
                />
                { }
                <div className="absolute right-2.5 flex items-center">
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent)" }} />
                  ) : query.length > 0 ? (
                    <button
                      onClick={clearSearch}
                      className="p-0.5 rounded-full transition-colors hover:bg-gray-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex h-5 items-center px-1.5 rounded text-[10px] font-mono font-medium select-none"
                      style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      /
                    </kbd>
                  )}
                </div>
              </div>

              { }
              {showDropdown && query.trim().length > 0 && (
                <div
                  className="absolute top-full right-0 mt-2 w-full sm:w-96 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-hover)",
                    zIndex: 100,
                  }}
                >
                  { }
                  <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <Zap className="w-3 h-3" style={{ color: "var(--accent)" }} />
                      Resultados IGDB
                    </span>
                    {!isSearching && results.length > 0 && (
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{results.length} encontrados</span>
                    )}
                  </div>

                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} />
                      Buscando...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-6 text-center">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: "var(--text-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Sin resultados para &ldquo;{query}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <ul className="py-1 max-h-80 overflow-y-auto">
                      {results.map((game) => (
                        <li
                          key={game.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-100"
                          style={{ color: "var(--text-primary)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                          onClick={() => {
                            setSelectedGame(game);
                            setShowDropdown(false);
                          }}
                        >
                          {game.coverUrl ? (
                            <img
                              src={game.coverUrl}
                              alt={game.name}
                              className="w-9 h-12 object-cover rounded-md shrink-0 shadow-md"
                            />
                          ) : (
                            <div
                              className="w-9 h-12 rounded-md shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }}
                            >
                              <Gamepad2 className="w-4 h-4 opacity-40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{game.name}</p>
                            <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
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

            { }
            <div className="hidden sm:block shrink-0 mr-1">
              <NotificationInbox currentUser={user} />
            </div>

            { }
            <div className="relative hidden sm:block shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-150 cursor-pointer group"
                style={{
                  backgroundColor: userMenuOpen ? "var(--bg-elevated)" : "transparent",
                  border: `1px solid ${userMenuOpen ? "var(--border-hover)" : "transparent"}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
                onMouseLeave={e => {
                  if (!userMenuOpen) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }
                }}
              >
                { }
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[12px] font-bold shrink-0 ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-[var(--bg-surface)] transition-all duration-200"
                  style={{}}
                >
                  {user?.user_metadata?.avatar_url ? (
                    
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[12px] font-bold"
                      style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}
                    >
                      {getInitials(user)}
                    </div>
                  )}
                </div>
                <span className="text-[13px] font-medium max-w-[90px] truncate hidden lg:block" style={{ color: "var(--text-primary)" }}>
                  {getUserName(user)}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--text-muted)" }}
                />
              </button>

              { }
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl py-1.5 overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-hover)",
                    zIndex: 100,
                  }}
                >
                  { }
                  <div className="px-3.5 py-2.5 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{getUserName(user)}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{getUserEmail(user)}</p>
                  </div>

                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] transition-colors duration-100 cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    Ajustes de perfil
                  </Link>

                  <div className="h-px my-1" style={{ backgroundColor: "var(--border)" }} />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] transition-colors duration-100 cursor-pointer text-left"
                    style={{ color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(248,113,113,0.08)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            { }
            <button
              className="md:hidden p-2 rounded-lg transition-colors cursor-pointer"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: mobileMenuOpen ? "var(--bg-elevated)" : "transparent",
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5" />
                : <Menu className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        { }
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">

              { }
              {user && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}>
                    {user?.user_metadata?.avatar_url ? (
                      
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : getInitials(user)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{getUserName(user)}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{getUserEmail(user)}</p>
                  </div>
                </div>
              )}

              { }
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Users className="w-3 h-3" />
                  Buscar coleccionistas
                </p>
                <UserSearch />
              </div>

              { }
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <LayoutDashboard className="w-3 h-3" />
                  Navegación
                </p>
                {NAV_LINKS.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        backgroundColor: isActive ? "rgba(67,185,79,0.08)" : "transparent",
                        borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              { }
              <div
                className="space-y-1 pt-3 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setMobileMenuOpen(false)}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  Ajustes de perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{ color: "#f87171" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(248,113,113,0.08)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      { }
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
