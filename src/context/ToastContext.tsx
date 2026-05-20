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

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Stacked Toasts Container Floating Top Right */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 bg-[#0c0c0c] border-2 font-mono text-xs uppercase tracking-wider relative overflow-hidden transition-all duration-300 shadow-[4px_4px_0px]
              ${toast.type === "success" 
                ? "border-[#00ff00] text-[#00ff00] shadow-[#00ff00]/40" 
                : "border-[#ff3333] text-[#ff3333] shadow-[#ff3333]/40"
              }`}
          >
            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-0"></div>
            
            <div className="flex items-start justify-between gap-3 relative z-10">
              <span className="font-bold">
                {toast.type === "success" ? "[SUCCESS]: " : "[ERROR]: "}
                <span className="text-white font-normal">{toast.message}</span>
              </span>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-[9px] hover:text-white shrink-0 cursor-pointer font-bold border border-current px-1 py-0.2"
              >
                X
              </button>
            </div>
          </div>
        ))}
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
