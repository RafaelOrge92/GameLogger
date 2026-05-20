"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Check if error is in URL search params without breaking build (no Suspense boundary required)
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "auth-callback-failed") {
      setError("Fallo en la autenticación con el proveedor externo.");
    }
  }, []);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión con Google.");
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

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff6b00] hover:bg-[#00ff00] text-black font-retro text-xl font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "CONECTANDO..." : "[INICIAR_SESION]"}
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-[#ff6b00]/20"></div>
              <span className="px-3 text-[10px] text-gray-500 font-mono">O BIEN</span>
              <div className="flex-1 border-t border-[#ff6b00]/20"></div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-[#0a0a0a] hover:bg-gray-900 text-white font-retro text-lg py-2.5 px-4 border-2 border-white hover:border-[#00ffff] hover:text-[#00ffff] shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              [ENTRAR_CON_GOOGLE]
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
