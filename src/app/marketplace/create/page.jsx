 
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, ArrowLeftRight, Zap, Megaphone, Gamepad2, AlertTriangle, Package, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";


const REGIONS = ["PAL-ES", "NTSC-U", "NTSC-J", "PAL-UK", "PAL-FR", "PAL-DE"];
const CONDITIONS = [
  { value: "loose", label: "Loose", desc: "Solo cartucho/disco, sin caja" },
  { value: "cib",   label: "CIB",   desc: "Completo en caja (Complete In Box)" },
  { value: "sealed",label: "Sealed",desc: "Nuevo / sin abrir / precintado" },
];
const OFFER_TYPES = [
  { value: "sell",  label: "Venta",       icon: Banknote, desc: "Quiero venderlo" },
  { value: "trade", label: "Intercambio", icon: ArrowLeftRight, desc: "Quiero cambiarlo" },
  { value: "both",  label: "Ambos",       icon: Zap, desc: "Venta o intercambio" },
];


const SkeletonItem = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border animate-pulse">
    <div className="w-10 h-14 rounded bg-neutral-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-neutral-800 rounded w-3/4" />
      <div className="h-2.5 bg-neutral-800 rounded w-1/3" />
    </div>
  </div>
);

export default function CreateOfferPage() {
  const router = useRouter();
  const { showToast } = useToast();

  
  const [photo, setPhoto] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPhoto(null);
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
            setPhoto(data.publicUrl || base64);
            
            if (data.recognizedGame) {
              const matchedGame = collection.find((item) =>
                item.title.toLowerCase().includes(data.recognizedGame.gameTitle.toLowerCase())
              );
              if (matchedGame) {
                setSelectedGame(matchedGame);
                showToast(`IA: Juego detectado como "${matchedGame.title}"`, "success");
              } else {
                showToast(`IA: Detectado "${data.recognizedGame.gameTitle}" (${data.recognizedGame.platform})`, "info");
              }
            }
          } else {
            setAuditError("Esta foto no es válida para la publicación.");
            showToast("La foto fue rechazada por el sistema de auditoría de seguridad.", "error");
          }
        } else {
          setAuditError("Error al auditar la imagen. Por favor, vuelve a intentarlo.");
        }
      } catch (error) {
        console.error(error);
        setAuditError("Error de conexión durante la auditoría de seguridad.");
      } finally {
        setIsAuditing(false);
      }
    };
    reader.readAsDataURL(file);
  };


  
  const [collection, setCollection]     = useState([]);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [collectionError, setCollectionError]     = useState(null);
  const [gameSearch, setGameSearch]               = useState("");
  const [selectedGame, setSelectedGame]           = useState(null);

  
  const [condition, setCondition] = useState("");
  const [region, setRegion]       = useState("");
  const [offerType, setOfferType] = useState("");
  const [price, setPrice]         = useState("");

  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState(null);

  
  useEffect(() => {
    setLoadingCollection(true);
    fetch("/api/collection/list")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCollection(data);
        } else {
          setCollectionError(data.error || "No se pudo cargar la colección.");
        }
      })
      .catch(() => setCollectionError("Error de red al cargar la colección."))
      .finally(() => setLoadingCollection(false));
  }, []);

  
  const filteredCollection = useMemo(() => {
    if (!gameSearch.trim()) return collection;
    const q = gameSearch.toLowerCase();
    return collection.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.platform?.toLowerCase().includes(q)
    );
  }, [collection, gameSearch]);

  const handleSelectGame = (item) => {
    setSelectedGame(item);
    setGameSearch("");
  };

  const handleClearGame = () => {
    setSelectedGame(null);
  };

  const needsPrice = offerType === "sell" || offerType === "both";

  const isFormValid =
    selectedGame &&
    condition &&
    region &&
    offerType &&
    (!needsPrice || (price !== "" && Number(price) >= 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        game_id: Number(selectedGame.game_id),
        condition_state: condition,
        region,
        offer_type: offerType,
        ...(needsPrice ? { price_wanted: Number(price) } : {}),
      };

      const res = await fetch("/api/marketplace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Error al publicar el anuncio.");
        return;
      }

      
      router.push("/marketplace");
      router.refresh();
    } catch {
      setSubmitError("Error de red. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      { }
      <div className="mb-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Mercado
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-emerald-400" /> Publicar Anuncio
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Pon en venta o intercambio un juego de tu colección.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        { }
        <div className="bg-bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            Foto del artículo físico
          </h2>
          <p className="text-xs text-text-secondary">
            Sube una foto real del artículo. Nuestro sistema de IA auditará la imagen por motivos de seguridad y tratará de reconocer el juego.
          </p>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl p-6 hover:border-emerald-500/40 transition-colors relative bg-bg-surface group">
            {isAuditing ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-medium text-emerald-400 animate-pulse">
                  Auditoría de seguridad en curso...
                </p>
              </div>
            ) : photo ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <img
                  src={photo}
                  alt="Vista previa del artículo"
                  className="w-32 h-40 object-cover rounded-lg shadow-xl border border-gray-800"
                />
                <div className="flex gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all">
                    Cambiar Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="px-4 py-2 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full py-6">
                <Upload className="w-8 h-8 text-gray-500 group-hover:text-emerald-400 transition-colors mb-2" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  Seleccionar archivo de imagen
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Formatos soportados: JPG, PNG, WEBP (Max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {auditError && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{auditError}</span>
            </div>
          )}
        </div>

        { }
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
            Selecciona el juego de tu colección
          </h2>

          {selectedGame ? (
             
            <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
              {selectedGame.cover_url ? (
                <img
                  src={selectedGame.cover_url}
                  alt={selectedGame.title}
                  className="w-12 h-16 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-12 h-16 rounded bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{selectedGame.title}</p>
                {selectedGame.platform && (
                  <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5 uppercase">
                    {selectedGame.platform}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearGame}
                className="shrink-0 w-7 h-7 rounded-full bg-bg-elevated border border-border hover:border-red-500/30 hover:text-red-400 text-text-muted flex items-center justify-center text-sm transition-all cursor-pointer"
                title="Cambiar juego"
              >
                ✕
              </button>
            </div>
          ) : (
             
            <div className="space-y-3">
              { }
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  placeholder="Filtrar por título o plataforma..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-bg-elevated border border-border focus:border-emerald-500 focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
                />
              </div>

              { }
              {loadingCollection ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)}
                </div>
              ) : collectionError ? (
                <div className="text-center py-6 text-sm text-red-400 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> {collectionError}
                </div>
              ) : collection.length === 0 ? (
                <div className="text-center py-8 text-sm text-text-secondary flex flex-col items-center">
                  <Package className="w-10 h-10 text-gray-500 mb-2 mx-auto" />
                  <p className="font-semibold text-white mb-1">Tu colección está vacía</p>
                  <p>Añade juegos a tu colección primero para poder publicar anuncios.</p>
                </div>
              ) : filteredCollection.length === 0 ? (
                <div className="text-center py-4 text-sm text-text-muted">
                  No hay juegos que coincidan con &quot;{gameSearch}&quot;
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCollection.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectGame(item)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated border border-border hover:border-emerald-500/30 hover:bg-emerald-950/10 transition-all text-left cursor-pointer"
                    >
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          className="w-9 h-12 object-cover rounded shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-12 rounded bg-bg-surface border border-border flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {item.title}
                        </p>
                        {item.platform && (
                          <p className="text-[11px] text-emerald-500 font-mono font-bold uppercase mt-0.5">
                            {item.platform}
                          </p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {!loadingCollection && collection.length > 0 && (
                <p className="text-[11px] text-text-muted text-right">
                  {filteredCollection.length} de {collection.length} juego{collection.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        { }
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">2</span>
            Estado de conservación
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {CONDITIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCondition(value)}
                className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all cursor-pointer ${
                  condition === value
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white"
                    : "border-border hover:border-border-hover text-text-secondary hover:text-white bg-bg-elevated"
                }`}
              >
                <span className={`text-lg font-black font-mono mb-1 ${condition === value ? "text-emerald-400" : ""}`}>
                  {label}
                </span>
                <span className="text-[10px] leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        { }
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">3</span>
            Región de la copia
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                  region === r
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-bg-elevated border-border hover:border-border-hover text-text-secondary hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        { }
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">4</span>
            Tipo de oferta
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {OFFER_TYPES.map(({ value, label, icon: IconComponent, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOfferType(value)}
                className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all cursor-pointer ${
                  offerType === value
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white"
                    : "border-border hover:border-border-hover text-text-secondary hover:text-white bg-bg-elevated"
                }`}
              >
                <IconComponent className={`w-6 h-6 mb-1.5 transition-colors ${offerType === value ? "text-emerald-400" : "text-gray-400 group-hover:text-white"}`} />
                <span className={`text-sm font-bold mb-0.5 ${offerType === value ? "text-emerald-400" : ""}`}>
                  {label}
                </span>
                <span className="text-[10px] leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        { }
        {needsPrice && (
          <div className="bg-bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">5</span>
              Precio de venta
            </h2>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="w-full pr-8 pl-4 py-2.5 rounded-lg text-sm bg-bg-elevated border border-border focus:border-emerald-500 focus:outline-none text-text-primary placeholder:text-text-muted transition-colors font-mono text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">€</span>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Introduce el precio. Puedes poner 0 si es negociable.
            </p>
          </div>
        )}

        { }
        {submitError && (
          <div className="bg-red-950/30 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" /> {submitError}
          </div>
        )}

        { }
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/marketplace"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:text-white border border-border hover:border-border-hover bg-bg-elevated transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isFormValid && !isSubmitting
                ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-950/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                : "bg-bg-elevated text-text-muted border border-border cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <span className="text-base font-black">+</span>
                Publicar Anuncio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
