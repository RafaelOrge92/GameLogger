"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Bookmark, MoreHorizontal, Image, Edit3 } from "lucide-react";
import { addGameToWishlist } from "@/features/collection/actions";
import { useToast } from "@/context/ToastContext";
import TradeProposalModal from "@/components/TradeProposalModal";
import GameGalleryModal from "@/components/GameGalleryModal";

export default function GameCardWithMenu({
  item,
  statusMeta,
  conditionMeta,
  stats,
  profile,
  currentUser,
  isOwnProfile,
  onEdit,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const cardRef = useRef(null);
  const router = useRouter();
  const { showToast } = useToast();

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    function handleScroll() {
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192; 
    const menuHeight = 90; 

    let x = rect.right - menuWidth;
    let y = rect.bottom + 6;

    
    if (x < 10) x = 10;
    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight - 6;
    }

    setCoords({ x, y });
    setIsOpen((prev) => !prev);
  };

  const handleContextMenu = (e) => {
    if (isOwnProfile) return; 
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 192;
    const menuHeight = 90;

    let x = e.clientX;
    let y = e.clientY;

    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setCoords({ x, y });
    setIsOpen(true);
  };

  const handleOpenGallery = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsGalleryOpen(true);
  };

  const handleProposeTrade = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!currentUser) {
      showToast("Debes iniciar sesión para proponer un intercambio.", "error");
      return;
    }
    setIsProposalModalOpen(true);
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
        item.gameId,
        item.title,
        item.coverUrl,
        item.platform,
        isOwnProfile ? null : profile?.id
      );

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`¡${item.title} añadido a tu lista de deseos!`, "success");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      showToast("Error de conexión al guardar el juego.", "error");
    }
  };

  return (
    <div
      ref={cardRef}
      onContextMenu={handleContextMenu}
      className="relative w-full h-full group select-none"
    >
      { }
      <button
        onClick={handleButtonClick}
        type="button"
        className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center w-7 h-7 text-gray-400 hover:text-white bg-gray-950/80 hover:bg-gray-900 border border-gray-800 rounded-md backdrop-blur-xs shadow-lg"
        aria-label="Opciones"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      { }
      <div
        className={`game-card flex flex-col overflow-hidden w-full h-full ${isOwnProfile ? 'cursor-pointer hover:border-emerald-500/50 transition-colors' : ''}`}
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
        onClick={(e) => {
          if (isOwnProfile && onEdit) {
            e.preventDefault();
            e.stopPropagation();
            onEdit(item);
          }
        }}
      >
        { }
        <div className="aspect-[3/4] relative w-full overflow-hidden bg-[#141517]">
          {item.coverUrl ? (
            
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase">
              {item.title}
            </div>
          )}

          { }
          <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center p-2 text-center pointer-events-none">
            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${conditionMeta.color} shadow-lg backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-200`}>
              {conditionMeta.label}
            </span>
            {item.platform && (
              <span className="mt-1.5 text-[9px] text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded font-semibold border border-gray-800">
                {item.platform}
              </span>
            )}
          </div>
        </div>

        { }
        <div className="p-3 space-y-1.5 bg-[#1f2125]/50 border-t border-[var(--border)]/55 flex-1 flex flex-col justify-between">
          <p
            className="text-xs font-bold text-white truncate leading-tight hover:text-emerald-400 transition-colors"
            title={item.title}
          >
            {item.title}
          </p>
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase"
              style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
            >
              {statusMeta.label}
            </span>
            {item.purchasePrice && (stats.isPricePublic || stats.isMock) && (
              <span className="text-[10px] font-bold text-emerald-400">
                €{parseFloat(item.purchasePrice).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        { }
        <div className="h-1 w-full" style={{ backgroundColor: statusMeta.color }} />
      </div>

      { }
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed w-48 bg-[#18191b] border border-gray-800/80 rounded-lg shadow-2xl py-1 z-[9999] animate-[fadeIn_0.1s_ease-out]"
          style={{
            top: `${coords.y}px`,
            left: `${coords.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isOwnProfile ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onEdit) onEdit(item);
                }}
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Editar detalles</span>
              </button>
              {item.imagesUrls && item.imagesUrls.length > 0 && (
                <button
                  onClick={handleOpenGallery}
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer border-t border-gray-800/50"
                >
                  <Image className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ver mis fotos</span>
                </button>
              )}
            </>
          ) : (
            <>
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
                <Bookmark className="w-4 h-4 shrink-0" />
                <span>Añadir a Mis Deseos</span>
              </button>
              {item.imagesUrls && item.imagesUrls.length > 0 && (
                <button
                  onClick={handleOpenGallery}
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-emerald-950/30 hover:text-emerald-400 transition-colors duration-150 text-left cursor-pointer border-t border-gray-800/50"
                >
                  <Image className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ver fotos del coleccionista</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
      { }
      {isProposalModalOpen && (
        <TradeProposalModal
          game={item}
          ownerId={profile.id}
          currentUser={currentUser}
          onClose={() => setIsProposalModalOpen(false)}
        />
      )}

      { }
      {isGalleryOpen && (
        <GameGalleryModal
          images={item.imagesUrls}
          gameTitle={item.title}
          onClose={() => setIsGalleryOpen(false)}
          onEdit={isOwnProfile ? () => {
            setIsGalleryOpen(false);
            if (onEdit) onEdit(item);
          } : undefined}
        />
      )}
    </div>
  );
}
