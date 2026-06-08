"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Heart } from "lucide-react";
import { addGameToWishlist } from "@/features/collection/actions";
import { useToast } from "@/context/ToastContext";

export default function GameContextMenu({ children, game, ownerId, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const { showToast } = useToast();

  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleProposeTrade = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!currentUser) {
      showToast("Debes iniciar sesión para proponer un intercambio.", "error");
      return;
    }
    // Navigate to the marketplace creation page with context
    router.push(`/marketplace/create?game_id=${game.gameId}&owner_id=${ownerId}&type=trade`);
  };

  const handleAddToWishlist = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!currentUser) {
      showToast("Debes iniciar sesión para añadir a tu lista de deseos.", "error");
      return;
    }

    try {
      const result = await addGameToWishlist(
        game.gameId,
        game.title,
        game.coverUrl,
        game.platform
      );

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`¡${game.title} añadido a tu lista de deseos!`, "success");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      showToast("Error de conexión al guardar el juego.", "error");
    }
  };

  return (
    <div className="relative w-full h-full group cursor-pointer" onClick={handleToggleMenu}>
      {children}

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-[#18191b] rounded-lg border border-gray-800 shadow-xl py-1 z-50 animate-[fadeIn_0.15s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleProposeTrade}
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            <span>Proponer Intercambio</span>
          </button>
          <button
            onClick={handleAddToWishlist}
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer border-t border-gray-800/50"
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span>Añadir a Mis Deseos</span>
          </button>
        </div>
      )}
    </div>
  );
}
