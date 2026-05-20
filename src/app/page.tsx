export default function Home() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="border-b-2 border-[#ff6b00]/30 pb-4">
        <h2 className="text-4xl text-[#ff6b00] font-retro tracking-widest uppercase">Colección Principal</h2>
        <p className="text-gray-400 mt-2 font-mono">ESTADO: <span className="text-[#00ff00]">ONLINE</span> // USUARIO: ADMIN</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Juegos Registrados</h3>
          <p className="text-4xl font-retro text-white">000</p>
        </div>
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Valor Estimado</h3>
          <p className="text-4xl font-retro text-[#00ff00]">€0.00</p>
        </div>
        <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-6 shadow-[4px_4px_0px_#ff6b00]">
          <h3 className="text-sm font-bold text-[#ff6b00] mb-2 uppercase tracking-wider">Juegos Completados</h3>
          <p className="text-4xl font-retro text-[#ff6b00]">000</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#0f0f0f] border-2 border-[#ff6b00] p-12 flex flex-col items-center justify-center text-center min-h-[400px] shadow-[8px_8px_0px_#ff6b00]">
        <div className="w-20 h-20 bg-transparent border-4 border-[#ff6b00] flex items-center justify-center mb-6 animate-pulse">
          <svg className="w-10 h-10 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-2xl text-white mb-4 font-retro tracking-widest">MEMORIA VACÍA</h3>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          SISTEMA ESPERANDO ENTRADA DE DATOS. UTILIZA LA BARRA DE BÚSQUEDA SUPERIOR PARA INSERTAR UN NUEVO JUEGO EN LA BASE DE DATOS.
        </p>
      </div>
    </div>
  );
}
