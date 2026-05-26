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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold"
          style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
        >
          R
        </div>
        <div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Bienvenido a RetroLogger
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Lleva el control de tu colección de videojuegos y su valor de mercado.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-md text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
          >
            Iniciar sesión
          </Link>
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
                        className="w-6 h-6 rounded flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: 'rgba(248,113,113,0.2)',
                          color: '#f87171',
                        }}
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
