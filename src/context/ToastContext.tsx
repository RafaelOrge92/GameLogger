"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      { }
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${isSuccess ? 'var(--accent)' : '#f87171'}`,
                boxShadow: `0 0 0 1px ${isSuccess ? 'rgba(67,185,79,0.15)' : 'rgba(248,113,113,0.15)'}, 0 20px 40px rgba(0,0,0,0.5)`,
                animation: 'toast-in 0.2s ease',
              }}
            >
              { }
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                style={{
                  backgroundColor: isSuccess ? 'rgba(67,185,79,0.15)' : 'rgba(248,113,113,0.15)',
                  color: isSuccess ? 'var(--accent)' : '#f87171',
                }}
              >
                {isSuccess ? '✓' : '✕'}
              </div>

              { }
              <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                {toast.message}
              </p>

              { }
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded cursor-pointer text-sm leading-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
