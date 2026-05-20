import { getCollection, removeGameFromCollection } from "@/features/collection/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto py-12">
        <header className="border-b-2 border-red-500/30 pb-4 text-center">
          <h2 className="text-4xl text-red-500 font-retro tracking-widest uppercase">ACCESO DENEGADO</h2>
          <p className="text-gray-400 mt-2 font-mono">ESTADO: <span className="text-red-500">OFFLINE</span> // SISTEMA BLOQUEADO</p>
        </header>

        <div className="bg-[#0f0f0f] border-2 border-red-500 p-12 flex flex-col items-center justify-center text-center min-h-[400px] shadow-[8px_8px_0px_#ef4444] relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>
          
          <div className="w-20 h-20 bg-transparent border-4 border-red-500 flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8V7m0 0a3 3 0 100-6 3 3 0 000 6zm0 11a7 7 0 110-14 7 7 0 010 14z" />
            </svg>
          </div>
          <h3 className="text-2xl text-white mb-4 font-retro tracking-widest">AUTENTICACIÓN REQUERIDA</h3>
          <p className="text-gray-400 max-w-md mb-8 leading-relaxed font-mono text-xs">
            DEBES INICIAR SESIÓN PARA PODER REGISTRAR JUEGOS Y VER TU INVENTARIO PERSONAL DE VIDEOJUEGOS RETRO Y DIGITALES.
          </p>
          <Link
            href="/login"
            className="bg-red-500 hover:bg-[#00ff00] text-black font-retro text-2xl font-bold py-3 px-8 border-2 border-black shadow-[4px_4px_0px_#ef4444] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"
          >
            [INICIAR_SESION]
          </Link>
        </div>
      </div>
    );
  }

  const { data: games = [] } = await getCollection();

  // Statistics calculations
  const totalGames = games.length;
  const totalValue = games.reduce((acc, g) => acc + (g.purchase_price ? parseFloat(g.purchase_price) : 0), 0);
  const completedGames = games.filter(g => g.status === "completed").length;

  async function deleteGameAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await removeGameFromCollection(id);
      revalidatePath("/");
    }
  }

  // Formatting helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "playing": return "bg-[#00ff00]";
      case "completed": return "bg-cyan-400";
      case "plan_to_play": return "bg-yellow-400";
      case "dropped": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "playing": return "Jugando";
      case "completed": return "Completado";
      case "plan_to_play": return "Plan para Jugar";
      case "dropped": return "Abandonado";
      case "owned": return "En Colección";
      default: return "Guardado";
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "sealed": return "Precintado";
      case "cib": return "CIB (Completo)";
      case "box_and_game": return "Caja y Cartucho";
      case "loose": return "Loose (Suelto)";
      case "digital": return "Digital";
      default: return condition.toUpperCase();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="border-b-2 border-[#ff6b00]/30 pb-4">
        <h2 className="text-4xl text-[#ff6b00] font-retro tracking-widest uppercase">Colección Principal</h2>
        <p className="text-gray-400 mt-2 font-mono">
          ESTADO: <span className="text-[#00ff00]">ONLINE</span> // 
          USUARIO: <span className="text-white uppercase font-bold">{user.user_metadata?.full_name || user.email?.split("@")[0]}</span>
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Juegos Registrados</h3>
          <p className="text-4xl font-retro text-white">{totalGames.toString().padStart(3, "0")}</p>
        </div>
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Valor Estimado</h3>
          <p className="text-4xl font-retro text-[#00ff00]">€{totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Juegos Completados</h3>
          <p className="text-4xl font-retro text-[#ff6b00]">{completedGames.toString().padStart(3, "0")}</p>
        </div>
      </div>

      {totalGames === 0 ? (
        /* Empty State */
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-12 flex flex-col items-center justify-center text-center min-h-[400px] shadow-[8px_8px_0px_#ff6b00] relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>
          
          <div className="w-20 h-20 bg-transparent border-4 border-[#ff6b00] flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-10 h-10 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-2xl text-white mb-4 font-retro tracking-widest">MEMORIA VACÍA</h3>
          <p className="text-gray-400 max-w-md mb-8 leading-relaxed font-mono text-xs">
            SISTEMA ESPERANDO ENTRADA DE DATOS. UTILIZA LA BARRA DE BÚSQUEDA SUPERIOR PARA INSERTAR UN NUEVO JUEGO EN LA BASE DE DATOS.
          </p>
        </div>
      ) : (
        /* Games Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game: any) => (
            <div 
              key={game.id} 
              className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-5 shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col justify-between relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>
              
              <div className="relative z-20">
                {/* Card Title & Platform */}
                <div className="flex items-start justify-between gap-2 border-b border-[#ff6b00]/20 pb-2 mb-3">
                  <h4 className="text-white font-bold font-retro text-lg tracking-wide truncate" title={game.title}>
                    {game.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#ff6b00]/60 text-[#ff6b00] bg-[#050505] shrink-0 font-bold uppercase">
                    {game.platform || "PC"}
                  </span>
                </div>

                {/* Game Details */}
                <div className="space-y-1.5 text-xs font-mono text-gray-400 mb-4">
                  {game.edition && (
                    <p><span className="text-[#ff6b00]/70">EDICIÓN:</span> <span className="text-gray-200">{game.edition}</span></p>
                  )}
                  <p><span className="text-[#ff6b00]/70">ESTADO FÍSICO:</span> <span className="text-gray-200">{getConditionLabel(game.condition)}</span></p>
                  {game.purchase_price !== null && (
                    <p><span className="text-[#ff6b00]/70">PRECIO PAGADO:</span> <span className="text-[#00ff00] font-bold">€{parseFloat(game.purchase_price).toFixed(2)}</span></p>
                  )}
                  {game.notes && (
                    <p className="italic text-gray-500 mt-2 truncate"><span className="text-[#ff6b00]/70 not-italic">NOTAS:</span> "{game.notes}"</p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between border-t border-[#ff6b00]/10 pt-3 mt-2 relative z-20">
                {/* Status indicator */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-300">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`}></span>
                  <span>{getStatusLabel(game.status)}</span>
                </div>

                {/* Delete Form Action */}
                <form action={deleteGameAction}>
                  <input type="hidden" name="id" value={game.id} />
                  <button
                    type="submit"
                    className="text-[10px] font-retro px-2 py-1 bg-[#150a05] border border-red-500/40 text-red-500 hover:bg-red-950/20 hover:border-red-500 transition-colors cursor-pointer"
                  >
                    [ELIMINAR]
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
