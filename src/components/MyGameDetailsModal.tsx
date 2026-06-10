"use client";

import { useState } from "react";
import { updateGameInCollection, removeGameFromCollection } from "@/features/collection/actions";
import { X, Gamepad2, Tag, Calendar, DollarSign, Edit3, Trash2, Save, Globe, Award, Image } from "lucide-react";
import { useToast } from "@/context/ToastContext";

import GameGalleryModal from "@/components/GameGalleryModal";

const GalleryModal = GameGalleryModal as any;


import ImageUploaderWithAI from "@/components/ImageUploaderWithAI";

const Uploader = ImageUploaderWithAI as any;

interface Game {
  id: string;
  game_id: string;
  title: string;
  cover_url: string;
  platform: string;
  status: string;
  condition: string;
  purchase_price: string | null;
  region: string;
  added_at: string;
  notes?: string | null;
  edition?: string | null;
  images_urls?: string[] | null;
}

interface MyGameDetailsModalProps {
  game: Game;
  onClose: () => void;
  onUpdate: (updatedGame: Game) => void;
  onDelete: (id: string) => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  collection: { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  wishlist:   { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  owned:        { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  playing:      { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  completed:    { label: "En colección",  color: "var(--status-owned)", bg: "rgba(251, 146, 60, 0.1)" },
  plan_to_play: { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
  dropped:      { label: "En deseados",    color: "var(--status-plan)", bg: "rgba(167, 139, 250, 0.1)" },
};

const CONDITION_META: Record<string, { label: string; color: string }> = {
  loose:  { label: "Loose (Suelto)",  color: "text-rose-400 border-rose-500/30 bg-rose-950/20" },
  cib:    { label: "CIB (Completo)",    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
  sealed: { label: "Sealed (Precintado)", color: "text-amber-400 border-amber-500/30 bg-amber-950/20" },
  digital:{ label: "Digital",color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/20" },
  box_and_game: { label: "Caja y Juego", color: "text-purple-400 border-purple-500/30 bg-purple-950/20" },
};

const REGIONS = ["PAL-ES", "PAL-UK", "NTSC-U", "NTSC-J", "PAL-FR", "PAL-DE"];

export default function MyGameDetailsModal({ game, onClose, onUpdate, onDelete }: MyGameDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(game.status);
  const [condition, setCondition] = useState(game.condition);
  const [purchasePrice, setPurchasePrice] = useState(game.purchase_price || "");
  const [region, setRegion] = useState(game.region || "PAL-ES");
  const [edition, setEdition] = useState(game.edition || "");
  const [notes, setNotes] = useState(game.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(game.images_urls || []);

  const { showToast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const priceVal = purchasePrice ? parseFloat(purchasePrice) : null;
      const res = await updateGameInCollection(
        game.id,
        status as any,
        condition as any,
        priceVal,
        notes || null,
        edition || null,
        region,
        uploadedImages
      );

      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Detalles actualizados correctamente", "success");
        onUpdate({
          ...game,
          status,
          condition,
          purchase_price: purchasePrice ? parseFloat(purchasePrice).toFixed(2) : null,
          region,
          edition: edition || null,
          notes: notes || null,
          images_urls: uploadedImages,
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving game details:", err);
      showToast("Error al guardar los cambios", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${game.title}" de tu colección?`)) {
      try {
        const res = await removeGameFromCollection(game.id);
        if (res.error) {
          showToast(res.error, "error");
        } else {
          showToast("Juego eliminado de tu colección", "success");
          onDelete(game.id);
          onClose();
        }
      } catch (err) {
        console.error("Error deleting game:", err);
        showToast("Error al eliminar el juego", "error");
      }
    }
  };

  const statusInfo = STATUS_META[game.status] || { label: game.status, color: "text-gray-400", bg: "bg-gray-800/20" };
  const conditionInfo = CONDITION_META[game.condition] || { label: game.condition, color: "text-gray-400", bg: "bg-gray-800/20" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      { }
      <div className="w-full max-w-3xl bg-[#18191b] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        { }
        <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-emerald-400" /> Detalles de mi Juego
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-850 hover:bg-gray-800 text-gray-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        { }
        <div className="flex-1 overflow-y-auto p-5 md:p-6 min-h-0 flex flex-col md:flex-row gap-6">
          { }
          <div className="w-full md:w-48 shrink-0 flex flex-col items-center md:items-start space-y-4">
            <div className="aspect-[3/4] relative w-40 md:w-full rounded-lg overflow-hidden bg-[#141517] border border-gray-800 shadow-md">
              {game.cover_url ? (
                <img
                  src={game.cover_url}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 uppercase text-center p-4">
                  Sin portada
                </div>
              )}
            </div>

            {game.images_urls && game.images_urls.length > 0 && (
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="w-full py-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Image className="w-3.5 h-3.5" />
                <span>Ver fotos físicas ({game.images_urls.length})</span>
              </button>
            )}

            <div className="text-center md:text-left space-y-2 w-full">
              <h2 className="font-bold text-white text-base md:text-lg leading-tight">{game.title}</h2>
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 uppercase">
                  {game.platform}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 uppercase">
                  {game.region}
                </span>
              </div>
              
              <div className="pt-2 text-[10px] text-gray-500 flex items-center justify-center md:justify-start gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Añadido el {new Date(game.added_at).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>
          </div>

          { }
          <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-800/60 pt-5 md:pt-0 md:pl-6 min-h-0">
            {isEditing ? (
               
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  { }
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estado en biblioteca</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="collection">En colección</option>
                      <option value="wishlist">En deseados</option>
                    </select>
                  </div>

                  { }
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Región de la copia</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#0f0f10] text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  { }
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Precio de compra (€)</label>
                    <div className="relative flex items-center">
                      <DollarSign className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 font-bold" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0f0f10] text-white placeholder-gray-600 text-xs rounded-lg pl-8 pr-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                { }
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Edición</label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Standard, Coleccionista, Platinum, Nintendo Selects..."
                    className="w-full bg-[#0f0f10] text-white placeholder-gray-600 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                { }
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notas personales / Comentarios</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribe detalles sobre la adquisición, su estado físico, número de serie o sensaciones al jugarlo..."
                    className="w-full bg-[#0f0f10] text-white placeholder-gray-600 text-xs rounded-lg px-3 py-2 border border-gray-800 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                { }
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fotos del estado real (opcional)</label>
                  <Uploader
                    images={uploadedImages}
                    onChange={setUploadedImages}
                  />
                </div>

                { }
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white border border-gray-850 hover:border-gray-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950/20"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
               
              <div className="space-y-6 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  { }
                  <div className="grid grid-cols-3 gap-4">
                    { }
                    <div className="p-3 bg-[#0f0f10]/40 rounded-lg border border-gray-800/80 col-span-1">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Estado</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: statusInfo.color }}
                        />
                        <span className="text-sm font-semibold text-white">{statusInfo.label}</span>
                      </div>
                    </div>

                    { }
                    <div className="p-3 bg-[#0f0f10]/40 rounded-lg border border-gray-800/80 col-span-1">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Globe className="w-3 h-3 text-gray-500" /> Región original
                      </p>
                      <p className="text-sm font-bold text-white mt-1 uppercase">{game.region || "PAL-ES"}</p>
                    </div>

                    { }
                    <div className="p-3 bg-[#0f0f10]/40 rounded-lg border border-gray-800/80 col-span-1">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-500" /> Adquisición
                      </p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">
                        {game.purchase_price ? `€${parseFloat(game.purchase_price).toFixed(2)}` : "€0.00 / Gratis"}
                      </p>
                    </div>
                  </div>

                  { }
                  {game.edition && (
                    <div className="p-3 bg-[#0f0f10]/40 rounded-lg border border-gray-800/80">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-500" /> Edición del juego
                      </p>
                      <p className="text-xs font-bold text-white mt-1 leading-snug">{game.edition}</p>
                    </div>
                  )}

                  { }
                  <div className="p-3 bg-[#0f0f10]/40 rounded-lg border border-gray-800/80">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Notas personales</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line font-medium italic">
                      {game.notes || "No hay notas personales agregadas para este juego."}
                    </p>
                  </div>
                </div>

                { }
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-800/60 mt-4">
                  { }
                  <button
                    onClick={handleDeleteClick}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 hover:border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar juego</span>
                  </button>

                  { }
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0f0f10] hover:bg-gray-850 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar detalles</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isGalleryOpen && game.images_urls && game.images_urls.length > 0 && (
        <GalleryModal
          images={game.images_urls}
          gameTitle={game.title}
          onClose={() => setIsGalleryOpen(false)}
          onEdit={() => {
            setIsGalleryOpen(false);
            setIsEditing(true);
          }}
        />
      )}
    </div>
  );
}
