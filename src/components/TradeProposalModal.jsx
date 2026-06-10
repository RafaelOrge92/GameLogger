"use client";

import { useState } from "react";
import { X, ArrowLeftRight, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function TradeProposalModal({ game, ownerId, currentUser, onClose, initialMessage = "" }) {
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast("Por favor, escribe un mensaje con tu propuesta.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trade/propose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: ownerId,
          game_id: game.gameId,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Propuesta de intercambio enviada con éxito.", "success");
        onClose();
      } else {
        showToast(data.error || "No se pudo enviar la propuesta.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error de conexión al enviar la propuesta.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#18191b] border border-gray-800 rounded-lg p-6 max-w-md w-full relative shadow-2xl">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          title="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Proponer Intercambio por {game.title}
          </h3>
        </div>

        <p className="text-xs text-gray-400 mb-4 leading-normal">
          Estás proponiendo un intercambio directo a este usuario por su copia de <span className="text-emerald-400 font-bold">{game.title}</span> ({game.platform}).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí lo que ofreces a cambio o tu mensaje..."
              className="w-full bg-[#212427] text-white border border-gray-700/80 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 text-sm placeholder:text-gray-500 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-transparent border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                message.trim() && !isSubmitting
                  ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-950/20 cursor-pointer"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-800"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Propuesta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
