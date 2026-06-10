import { getCollection, removeGameFromCollection } from "@/features/collection/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { TrendingUp, Gamepad2, Sliders, BarChart3 } from "lucide-react";
import DashboardCollection from "@/components/DashboardCollection";


const STATUS_META: Record<string, { label: string; color: string }> = {
  playing:      { label: "Jugando",       color: "var(--status-playing)" },
  completed:    { label: "Completado",    color: "var(--status-completed)" },
  plan_to_play: { label: "Pendiente",     color: "var(--status-plan)" },
  dropped:      { label: "Abandonado",    color: "var(--status-dropped)" },
  owned:        { label: "En colección",  color: "var(--status-owned)" },
};

const TRENDING_GAMES = [
  {
    title: "Chrono Trigger",
    platform: "SNES",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co87df.jpg",
    trend: "Valor: +24.8% (Ene)",
    value: "€320.00"
  },
  {
    title: "Super Mario Sunshine",
    platform: "GameCube",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co68sg.jpg",
    trend: "Valor: +12.5% (Ene)",
    value: "€34.00"
  },
  {
    title: "Metal Gear Solid",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobpao.jpg",
    trend: "Valor: +8.3% (Ene)",
    value: "€55.00"
  },
  {
    title: "Zelda: Ocarina of Time",
    platform: "Nintendo 64",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3nnx.jpg",
    trend: "Valor: +15.2% (Ene)",
    value: "€120.00"
  },
  {
    title: "Castlevania: SotN",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co53m8.jpg",
    trend: "Valor: +31.4% (Ene)",
    value: "€350.00"
  },
  {
    title: "Pokémon Stadium",
    platform: "Nintendo 64",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1yyd.jpg",
    trend: "Valor: +5.1% (Ene)",
    value: "€85.00"
  },
  {
    title: "Terranigma",
    platform: "SNES",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co26g4.jpg",
    trend: "Valor: +19.7% (Ene)",
    value: "€320.00"
  },
  {
    title: "Final Fantasy VII",
    platform: "PlayStation",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobn9o.jpg",
    trend: "Valor: +11.6% (Ene)",
    value: "€65.00"
  },
  {
    title: "Metroid Prime",
    platform: "GameCube",
    coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co6m4m.jpg",
    trend: "Valor: +9.4% (Ene)",
    value: "€45.00"
  }
];

export default async function Home(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const showLanding = searchParams?.landing === "true";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || showLanding) {
    return (
      <div className="py-12 md:py-24 space-y-20 md:space-y-32">
        { }
        <div className="max-w-4xl mx-auto text-center space-y-8 px-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
            <BarChart3 className="w-3.5 h-3.5" /> El control financiero de tu colección
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

        { }
        <div className="max-w-5xl mx-auto px-4 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white tracking-tight font-sans">
                Tendencias de Mercado (Top Buscados)
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">Posa el ratón para pausar</span>
          </div>

          { }
          <div className="relative w-full overflow-hidden">
            { }
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee py-2 select-none">
              { }
              {TRENDING_GAMES.map((game, i) => (
                <div 
                  key={`set1-${i}`}
                  className="w-36 sm:w-44 shrink-0 group relative rounded-xl overflow-hidden border border-[var(--border)] transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:-translate-y-1"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  { }
                  <div className="aspect-[3/4] relative w-full overflow-hidden bg-[var(--bg-elevated)]">
                    <img 
                      src={game.coverUrl} 
                      alt={game.title}
                      className="w-full h-full object-cover select-none pointer-events-none" 
                    />
                    { }
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                      {game.trend}
                    </div>
                    { }
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-[10px] text-cyan-400 font-bold tracking-wide uppercase">Valor medio</p>
                      <p className="text-sm font-black text-white">{game.value}</p>
                    </div>
                  </div>
                  { }
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-[11px] font-semibold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors" title={game.title}>
                      {game.title}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] font-medium">
                      {game.platform}
                    </p>
                  </div>
                </div>
              ))}
              { }
              {TRENDING_GAMES.map((game, i) => (
                <div 
                  key={`set2-${i}`}
                  className="w-36 sm:w-44 shrink-0 group relative rounded-xl overflow-hidden border border-[var(--border)] transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:-translate-y-1"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  { }
                  <div className="aspect-[3/4] relative w-full overflow-hidden bg-[var(--bg-elevated)]">
                    <img 
                      src={game.coverUrl} 
                      alt={game.title}
                      className="w-full h-full object-cover select-none pointer-events-none" 
                    />
                    { }
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                      {game.trend}
                    </div>
                    { }
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-[10px] text-cyan-400 font-bold tracking-wide uppercase">Valor medio</p>
                      <p className="text-sm font-black text-white">{game.value}</p>
                    </div>
                  </div>
                  { }
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-[11px] font-semibold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors" title={game.title}>
                      {game.title}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] font-medium">
                      {game.platform}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        { }
        <div className="max-w-5xl mx-auto px-4">
          <div 
            className="rounded-2xl border p-6 md:p-8 space-y-6 md:space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            { }
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

            { }
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

            { }
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              { }
              <div 
                className="md:col-span-2 p-5 rounded-xl border space-y-4 flex flex-col justify-between"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Evolución Histórica y Comparativa (1 año)</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Super Mario Sunshine (Historial por Estado de Conservación)</p>
                  </div>
                  <div className="flex gap-3 text-[9px] font-bold">
                    <span className="flex items-center gap-1 text-[#fbbf24]"><span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"/>Sealed</span>
                    <span className="flex items-center gap-1 text-[#10b981]"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"/>CIB</span>
                    <span className="flex items-center gap-1 text-[#06b6d4]"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]"/>Loose</span>
                  </div>
                </div>
                
                { }
                <div className="h-40 w-full flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradSealed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.08"/>
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="gradCIB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.08"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="gradLoose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08"/>
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" />

                    <path d="M0 40 L0 10 L15 8 L30 9 L45 6 L60 5 L75 7 L90 4 L100 3 L100 40 Z" fill="url(#gradSealed)" />
                    <path d="M0 40 L0 22 L15 20 L30 23 L45 18 L60 15 L75 17 L90 12 L100 10 L100 40 Z" fill="url(#gradCIB)" />
                    <path d="M0 40 L0 32 L15 31 L30 33 L45 29 L60 28 L75 30 L90 26 L100 25 L100 40 Z" fill="url(#gradLoose)" />

                    <path d="M0 10 L15 8 L30 9 L45 6 L60 5 L75 7 L90 4 L100 3" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M0 22 L15 20 L30 23 L45 18 L60 15 L75 17 L90 12 L100 10" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M0 32 L15 31 L30 33 L45 29 L60 28 L75 30 L90 26 L100 25" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />

                    <circle cx="60" cy="5" r="1" fill="#fbbf24" />
                    <circle cx="100" cy="3" r="1" fill="#fbbf24" />
                    
                    <circle cx="60" cy="15" r="1" fill="#10b981" />
                    <circle cx="100" cy="10" r="1" fill="#10b981" />

                    <circle cx="60" cy="28" r="1" fill="#06b6d4" />
                    <circle cx="100" cy="25" r="1" fill="#06b6d4" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Jun 2025</span>
                  <span>Dic 2025</span>
                  <span>May 2026</span>
                </div>
              </div>

              { }
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

        { }
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
                icon: TrendingUp
              },
              {
                title: "Limpieza IQR de Outliers",
                desc: "Filtramos anuncios anómalos o sospechosos (lotes vacíos, reproducciones baratas) para obtener valores fiables basados en datos puros.",
                icon: Sliders
              },
              {
                title: "Indexación por Estado y Región",
                desc: "Registra tus piezas especificando si son cartuchos sueltos (Loose), completos (CIB) o precintados (Sealed), adaptados a su región original.",
                icon: Gamepad2
              }
            ].map((feat, i) => {
              const IconComponent = feat.icon;
              return (
                <div 
                  key={i} 
                  className="p-6 rounded-xl border space-y-3 transition-colors hover:border-emerald-500/20"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="text-emerald-400">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">{feat.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const { data: games = [] } = await getCollection();

  
  let enrichedGames = [];
  if (user) {
    const { data: userItems } = await supabase
      .from("user_collection")
      .select("game_id, region")
      .eq("user_id", user.id);
    const itemMap = new Map(userItems?.map(ui => [String(ui.game_id), ui.region]) || []);
    enrichedGames = games.map((g: any) => ({
      ...g,
      region: itemMap.get(String(g.game_id)) || "PAL-ES"
    }));
  }

  const totalGames = games.length;
  const totalValue = games.reduce(
    (acc, g) => acc + (g.purchase_price ? parseFloat(g.purchase_price) : 0),
    0
  );
  const completedGames = games.filter(g => g.status === "completed").length;
  const playingGames  = games.filter(g => g.status === "playing").length;

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  const STATS = [
    { label: "Total juegos",  value: String(totalGames) },
    { label: "Valor total",   value: `€${totalValue.toFixed(2)}` },
    { label: "Completados",   value: String(completedGames) },
    { label: "Jugando",       value: String(playingGames) },
  ];

  return (
    <div className="space-y-8">

      { }
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Hola, {userName}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Tu colección personal de videojuegos
        </p>
      </div>

      { }
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

      { }
      <DashboardCollection initialGames={enrichedGames} />
    </div>
  );
}
