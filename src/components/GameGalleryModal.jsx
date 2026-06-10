"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";

export default function GameGalleryModal({ images = [], gameTitle, onClose, onEdit }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex flex-col items-center justify-center p-4 animate-[fadeIn_0.20s_ease-out]"
    >
      { }
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl flex flex-col items-center relative"
      >
        { }
        {onEdit && (
          <button
            onClick={onEdit}
            type="button"
            className="absolute -top-12 right-12 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer bg-emerald-950/30 hover:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-md"
            title="Editar detalles y fotos"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar y Añadir Fotos</span>
          </button>
        )}

        { }
        <button
          onClick={onClose}
          type="button"
          className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-900/50 p-2 rounded-full border border-gray-800"
          title="Cerrar galería"
        >
          <X className="w-5 h-5" />
        </button>

        { }
        <div className="absolute -top-12 left-0 text-left text-white">
          <h3 className="text-sm font-extrabold truncate max-w-md">
            Fotos de {gameTitle}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Imagen {activeIndex + 1} de {images.length}
          </p>
        </div>

        { }
        <div className="relative w-full aspect-[4/3] max-h-[60vh] bg-[#121314] rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center shadow-2xl group">
          { }
          <img
            src={images[activeIndex]}
            alt={`Foto de estado ${activeIndex + 1}`}
            className="w-full h-full object-contain"
          />

          { }
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-950/80 hover:bg-gray-900 border border-gray-800 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-950/80 hover:bg-gray-900 border border-gray-800 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        { }
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 overflow-x-auto max-w-full pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                type="button"
                className={`w-14 h-14 rounded border overflow-hidden shrink-0 transition-all ${
                  idx === activeIndex
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
                    : "border-gray-800 hover:border-gray-750 opacity-60 hover:opacity-100"
                }`}
              >
                { }
                <img
                  src={img}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
