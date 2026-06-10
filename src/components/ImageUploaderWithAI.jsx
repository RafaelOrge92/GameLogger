"use client";

import { useState } from "react";
import { Upload, Loader, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ImageUploaderWithAI({ images = [], onChange, onRecognized }) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const { showToast } = useToast();

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result;
      setAuditError(null);
      setIsAuditing(true);

      try {
        const res = await fetch("/api/ai/image-audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
            fileName: file.name,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (data.isAllowed) {
            
            const photoUrl = data.publicUrl || base64;
            const updatedImages = [...images, photoUrl];
            onChange(updatedImages);
            showToast("Foto validada por IA con éxito.", "success");

            
            if (data.recognizedGame && data.recognizedGame.gameTitle && onRecognized) {
              onRecognized(data.recognizedGame.gameTitle);
            }
          } else {
            setAuditError("Esta foto no es válida para la publicación.");
            showToast("La foto fue rechazada por motivos de seguridad.", "error");
          }
        } else {
          setAuditError("Error al analizar la imagen. Inténtalo de nuevo.");
        }
      } catch (err) {
        console.error(err);
        setAuditError("Error de conexión durante el análisis de seguridad.");
      } finally {
        setIsAuditing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updatedImages);
  };

  return (
    <div className="space-y-3">
      { }
      <div className="relative">
        {isAuditing ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/40 rounded-lg p-6 bg-emerald-950/5 min-h-[100px] text-center space-y-2">
            <Loader className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-xs font-semibold text-emerald-400 animate-pulse">
              Auditando imagen con IA...
            </span>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-lg p-6 hover:border-emerald-500/30 bg-gray-900/10 hover:bg-emerald-950/5 cursor-pointer text-center group transition-all min-h-[100px]">
            <Upload className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors mb-1.5" />
            <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
              Añadir foto del estado real
            </span>
            <span className="text-[10px] text-gray-600 mt-1">
              Arrastra o haz clic para subir imagen (JPG, PNG)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      { }
      {auditError && (
        <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-[11px] animate-[fadeIn_0.15s_ease-out]">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      { }
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square w-full rounded border border-gray-800 overflow-hidden bg-gray-950 group"
            >
              { }
              <img
                src={img}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-gray-950/80 hover:bg-red-500/20 border border-gray-800 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Eliminar foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
