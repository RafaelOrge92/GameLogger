import { getCollection, removeGameFromCollection } from "@/features/collection/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";

// Status helpers
const STATUS_META: Record<string, { label: string; color: string }> = {
  playing:      { label: "Jugando",       color: "var(--status-playing)" },
  completed:    { label: "Completado",    color: "var(--status-completed)" },
  plan_to_play: { label: "Pendiente",     color: "var(--status-plan)" },
  dropped:      { label: "Abandonado",    color: "var(--status-dropped)" },
  owned:        { label: "En colección",  color: "var(--status-owned)" },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="py-12 md:py-24 space-y-20 md:space-y-32">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
            📊 El control financiero de tu colección
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            RetroLogger: Indexa, Tasa y Evoluciona tu Colección Retro
          </h1>
          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            El primer portafolio financiero de activos coleccionables impulsado por datos reales de mercado.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold transition-all duration-200 shadow-[0_0_20px_rgba(67,185,79,0.3)] hover:shadow-[0_0_30px_rgba(67,185,79,0.5)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
            >
              <span>Iniciar Sesión con Google (Es Gratis)</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Dashboard Preview / Mockup Section */}
        <div className="max-w-5xl mx-auto px-4">
          <div 
            className="rounded-2xl border p-6 md:p-8 space-y-6 md:space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {/* Fake Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Dashboard Resumen</p>
                <h3 className="text-xl font-bold text-white mt-1">Tu Portafolio de Coleccionables</h3>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">EUR €</span>
                <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Pal-ES Región</span>
              </div>
            </div>

            {/* Fake Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Juegos", value: "142", sub: "+5 este mes" },
                { label: "Valor de Mercado", value: "€5,280.00", sub: "▲ +12.4% vs adquis.", highlight: true },
                { label: "Completados", value: "84", sub: "59.1% del total" },
                { label: "Alertas de Caza", value: "3 Activas", sub: "Precios de ganga" }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-xl border" 
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <p className="text-xs text-[var(--text-secondary)] font-medium">{stat.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>{stat.value}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Interactive/Visual Section: Market Trends & Items Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fake Trend Graph */}
              <div 
                className="md:col-span-2 p-5 rounded-xl border space-y-4 flex flex-col justify-between"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Evolución Histórica (1 año)</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Super Mario Sunshine (CIB, PAL-ES)</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Media: €34.00</span>
                </div>
                
                {/* Simulated SVG Chart */}
                <div className="h-40 w-full flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#43b94f" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#43b94f" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    {/* Area under the curve */}
                    <path 
                      d="M0 40 L0 30 L15 28 L30 32 L45 25 L60 20 L75 24 L90 14 L100 12 L100 40 Z" 
                      fill="url(#chartGrad)" 
                    />
                    {/* Line */}
                    <path 
                      d="M0 30 L15 28 L30 32 L45 25 L60 20 L75 24 L90 14 L100 12" 
                      fill="none" 
                      stroke="#43b94f" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                    {/* Circles on peak points */}
                    <circle cx="60" cy="20" r="1.5" fill="#43b94f" />
                    <circle cx="100" cy="12" r="1.5" fill="#43b94f" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Jun 2025</span>
                  <span>Dic 2025</span>
                  <span>May 2026</span>
                </div>
              </div>

              {/* Fake Recent Items */}
              <div 
                className="p-5 rounded-xl border space-y-4"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Últimas Tasaciones</h4>
                <div className="space-y-3">
                  {[
                    { title: "Chrono Trigger", platform: "SNES", price: "€320.00", cond: "CIB", color: "#4ca8d4" },
                    { title: "Pokemon Stadium", platform: "N64", price: "€105.00", cond: "Sealed", color: "#fbbf24" },
                    { title: "Metroid Prime", platform: "GC", price: "€18.00", cond: "Loose", color: "#f87171" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-elevated)] text-xs border border-[var(--border)]">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.platform} • <span style={{ color: item.color }}>{item.cond}</span></p>
                      </div>
                      <span className="font-bold text-emerald-400 shrink-0">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-white">Diseñado para Coleccionistas Exigentes</h3>
            <p className="text-sm text-[var(--text-secondary)]">La precisión analítica que tu colección de videojuegos se merece.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Valuación Real del Mercado",
                desc: "Consultamos los precios de mercado en tiempo real y ventas recientes para ofrecerte estimaciones limpias y realistas de tus juegos.",
                icon: "📈"
              },
              {
                title: "Limpieza IQR de Outliers",
                desc: "Filtramos anuncios anómalos o sospechosos (lotes vacíos, reproducciones baratas) para obtener valores fiables basados en datos puros.",
                icon: "⚙️"
              },
              {
                title: "Indexación por Estado y Región",
                desc: "Registra tus piezas especificando si son cartuchos sueltos (Loose), completos (CIB) o precintados (Sealed), adaptados a su región original.",
                icon: "🎮"
              }
            ].map((feat, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl border space-y-3 transition-colors hover:border-emerald-500/20"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <span className="text-3xl block">{feat.icon}</span>
                <h4 className="text-base font-bold text-white">{feat.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { data: games = [] } = await getCollection();

  const totalGames = games.length;
  const totalValue = games.reduce(
    (acc, g) => acc + (g.purchase_price ? parseFloat(g.purchase_price) : 0),
    0
  );
  const completedGames = games.filter(g => g.status === "completed").length;
  const playingGames  = games.filter(g => g.status === "playing").length;

  async function deleteGameAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await removeGameFromCollection(id);
      revalidatePath("/");
    }
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  const STATS = [
    { label: "Total juegos",  value: String(totalGames) },
    { label: "Valor total",   value: `€${totalValue.toFixed(2)}` },
    { label: "Completados",   value: String(completedGames) },
    { label: "Jugando",       value: String(playingGames) },
  ];

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Hola, {userName} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Tu colección personal de videojuegos
        </p>
      </div>

      {/* Quick stats — CSS hover via .stat-card class */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Collection content */}
      {totalGames === 0 ? (
        /* Empty state */
        <div
          className="rounded-xl flex flex-col items-center justify-center text-center py-20 px-8"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Tu colección está vacía
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Usa la barra de búsqueda superior para añadir tu primer juego
          </p>
        </div>
      ) : (
        /* Games grid — cover-art focused like Backloggd */
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {totalGames} {totalGames === 1 ? "juego" : "juegos"}
          </p>

          {/* CSS-only hover via .game-card and .game-card-overlay — no JS handlers needed */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            {games.map((game: any) => {
              const status = STATUS_META[game.status] ?? { label: game.status, color: 'var(--text-muted)' };
              return (
                <div key={game.id} className="game-card">
                  {/* Cover image */}
                  <div className="aspect-[3/4]" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[10px] text-center p-2 font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {game.title}
                      </div>
                    )}
                  </div>

                  {/* Hover overlay — controlled entirely by CSS (.game-card:hover .game-card-overlay) */}
                  <div className="game-card-overlay">
                    {/* Delete button top-right */}
                    <form action={deleteGameAction} className="flex justify-end">
                      <input type="hidden" name="id" value={game.id} />
                      <button
                        type="submit"
                        className="w-6 h-6 rounded flex items-center justify-center text-sm font-medium btn-danger-dim"
                        title="Eliminar de la colección"
                      >
                        ×
                      </button>
                    </form>

                    {/* Info bottom */}
                    <div>
                      <p
                        className="text-[11px] font-semibold leading-tight mb-1"
                        style={{
                          color: 'var(--text-primary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {game.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-medium" style={{ color: status.color }}>
                          {status.label}
                        </span>
                        {game.purchase_price && (
                          <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                            €{parseFloat(game.purchase_price).toFixed(0)}
                          </span>
                        )}
                      </div>
                      {game.platform && (
                        <span
                          className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {game.platform}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status indicator strip */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: status.color }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
