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

const CONDITION_LABEL: Record<string, string> = {
  sealed:       "Precintado",
  cib:          "CIB",
  box_and_game: "Caja + Juego",
  loose:        "Suelto",
  digital:      "Digital",
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
  const playingGames = games.filter(g => g.status === "playing").length;

  async function deleteGameAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await removeGameFromCollection(id);
      revalidatePath("/");
    }
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Hola, {userName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Tu colección personal de videojuegos
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total juegos",  value: totalGames,                         suffix: "" },
          { label: "Valor total",   value: `€${totalValue.toFixed(2)}`,        suffix: "", raw: true },
          { label: "Completados",   value: completedGames,                     suffix: "" },
          { label: "Jugando",       value: playingGames,                       suffix: "" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {stat.raw ? stat.value : stat.value}
              {stat.suffix}
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {totalGames} {totalGames === 1 ? "juego" : "juegos"}
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            {games.map((game: any) => {
              const status = STATUS_META[game.status] ?? { label: game.status, color: 'var(--text-muted)' };
              return (
                <div
                  key={game.id}
                  className="group relative rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Cover image */}
                  <div className="aspect-[3/4] relative bg-[var(--bg-elevated)] overflow-hidden">
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

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-2"
                      style={{
                        background: 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.3) 60%, transparent 100%)',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* Delete button top-right */}
                      <form action={deleteGameAction} className="flex justify-end">
                        <input type="hidden" name="id" value={game.id} />
                        <button
                          type="submit"
                          className="w-6 h-6 rounded flex items-center justify-center text-xs opacity-70 hover:opacity-100"
                          style={{ backgroundColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}
                          title="Eliminar de la colección"
                        >
                          ×
                        </button>
                      </form>

                      {/* Info bottom */}
                      <div>
                        <p className="text-[11px] font-semibold leading-tight line-clamp-2 mb-1"
                          style={{ color: 'var(--text-primary)' }}>
                          {game.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: status.color }}
                          >
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
                  </div>

                  {/* Status dot indicator bottom */}
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
