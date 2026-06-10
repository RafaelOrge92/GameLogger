"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate inputs
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      setIsLoading(false);
      return;
    }

    // Alphanumeric username check to prevent weird URLs
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError("El nombre de usuario solo puede contener letras, números y guiones bajos.");
      setIsLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Check if user needs email confirmation or is logged in immediately
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSuccess(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado durante el registro.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4"
            style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}
          >
            R
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Crear cuenta
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Regístrate en RetroLogger para gestionar tu colección
          </p>
        </div>

        {/* Success message */}
        {success ? (
          <div className="space-y-4">
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#10b981",
              }}
            >
              ¡Registro completado! Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.
            </div>
            <Link
              href="/login"
              className="block w-full py-2 rounded-md text-sm font-semibold text-center transition-opacity"
              style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm mb-5"
                style={{
                  backgroundColor: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
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
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: nintendofan92"
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}
              >
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>o</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            </div>

            {/* Login Link */}
            <div className="text-center text-xs space-y-2" style={{ color: "var(--text-muted)" }}>
              <p>
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/login"
                  className="font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
