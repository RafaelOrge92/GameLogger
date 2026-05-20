"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh(); // Refresh root layout to update user session status
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado al conectar.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {/* Login Card */}
      <div 
        className="w-full max-w-md bg-[#0f0f0f] border-4 border-[#ff6b00] p-8 shadow-[8px_8px_0px_#ff6b00] relative"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Scanlines retro effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>

        {/* Card Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl text-[#ff6b00] font-retro tracking-widest uppercase mb-2">ACCESS_SYSTEM</h2>
          <p className="text-xs text-gray-500 font-mono">INTRODUCE CREDENCIALES PARA INICIAR SESIÓN</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/20 border-2 border-red-500 text-red-500 p-3 text-xs font-mono mb-4 text-center">
            [ERROR]: {error.toUpperCase()}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
          <div>
            <label className="block text-xs font-bold text-[#ff6b00] uppercase mb-2 font-retro tracking-wider">
              [CORREO_ELECTRONICO]
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admin.com"
              className="w-full bg-[#050505] border-2 border-[#ff6b00]/60 text-[#00ff00] p-3 font-mono text-sm focus:outline-none focus:border-[#ff6b00] focus:shadow-[0_0_8px_#ff6b00] placeholder-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#ff6b00] uppercase mb-2 font-retro tracking-wider">
              [CONTRASEÑA]
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#050505] border-2 border-[#ff6b00]/60 text-[#00ff00] p-3 font-mono text-sm focus:outline-none focus:border-[#ff6b00] focus:shadow-[0_0_8px_#ff6b00] placeholder-gray-700"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff6b00] hover:bg-[#00ff00] text-black font-retro text-xl font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "CONECTANDO..." : "[INICIAR_SESION]"}
            </button>
          </div>
        </form>

        {/* Helper Test Credentials */}
        <div className="mt-8 pt-4 border-t border-[#ff6b00]/20 text-center font-mono text-[10px] text-gray-500">
          <p className="text-amber-500 font-bold uppercase mb-1">Cuentas de Prueba:</p>
          <p>Email: <span className="text-white">admin@admin.com</span></p>
          <p>Password: <span className="text-white">Ad1234</span></p>
        </div>
      </div>
    </div>
  );
}
