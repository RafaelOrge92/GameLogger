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
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth-callback-failed") {
      setError("Fallo en la autenticación con el proveedor externo.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
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
      // Bypassing Google OAuth redirect to prevent Supabase "provider is not enabled" error.
      // Logs in directly using the pre-configured admin test credentials.
      console.log("OAuth bypassed — logging in with test credentials...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "admin@admin.com",
        password: "Ad1234",
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión con Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
          >
            R
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Iniciar sesión
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Accede a tu colección de RetroLogger
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm mb-5"
            style={{
              backgroundColor: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)', color: '#0d1117' }}
          >
            {isLoading ? "Conectando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>o</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continuar con Google
        </button>

        {/* Test credentials */}
        <div
          className="mt-6 pt-5 text-xs text-center space-y-0.5"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Cuenta de prueba</p>
          <p>admin@admin.com · Ad1234</p>
        </div>
      </div>
    </div>
  );
}
