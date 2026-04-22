"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X, Check, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Producto, Categoria } from "@/types/database";
import {
  getGroupsForCategorySlug,
  sumModifierPrices,
  type ModifierGroup,
} from "@/lib/modifiers";
import { useCart } from "@/lib/store/cart-store";
import { formatUSD, formatBs } from "@/lib/utils";

type Props = {
  producto: Producto | null;
  categoria: Categoria | undefined;
  tasaBs: number;
  open: boolean;
  onClose: () => void;
};

const EMOJI_BY_SLUG: Record<string, string> = {
  hamburguesas: "🍔",
  "hamburguesas-especiales": "🍔",
  "hot-dog": "🌭",
  enrollados: "🌯",
  pepitos: "🥖",
  salchipapas: "🍟",
  extras: "🧀",
  bebidas: "🥤",
};

export function ProductDetailSheet({
  producto,
  categoria,
  tasaBs,
  open,
  onClose,
}: Props) {
  const addItem = useCart((s) => s.addItem);

  const [cantidad, setCantidad] = useState(1);
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [notas, setNotas] = useState("");

  const groups: ModifierGroup[] = useMemo(
    () => (categoria ? getGroupsForCategorySlug(categoria.slug) : []),
    [categoria]
  );

  useEffect(() => {
    if (open) {
      setCantidad(1);
      setSelectedMods(new Set());
      setNotas("");
    }
  }, [open, producto?.id]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open, onClose]);

  if (!producto) return null;

  const emoji = EMOJI_BY_SLUG[categoria?.slug ?? ""] ?? "🍽️";
  const extrasPrice = sumModifierPrices(Array.from(selectedMods));
  const unitPrice = producto.precio_usd + extrasPrice;
  const total = unitPrice * cantidad;

  const toggleMod = (groupId: string, optId: string, type: ModifierGroup["type"]) => {
    setSelectedMods((prev) => {
      const next = new Set(prev);
      if (type === "single") {
        const group = groups.find((g) => g.id === groupId);
        group?.options.forEach((o) => next.delete(o.id));
        next.add(optId);
      } else {
        if (next.has(optId)) next.delete(optId);
        else next.add(optId);
      }
      return next;
    });
  };

  const handleAdd = () => {
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_base_usd: producto.precio_usd,
      extra_price_usd: extrasPrice,
      imagen_url: producto.imagen_url,
      modifier_ids: Array.from(selectedMods),
      notas: notas.trim() || undefined,
      cantidad,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${producto.nombre}`}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-mana-cream shadow-2xl sm:inset-0 sm:m-auto sm:h-[88dvh] sm:max-w-lg sm:rounded-3xl"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-mana-ink shadow-mana-soft ring-1 ring-black/10 backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <div className="relative h-[34%] min-h-[240px] shrink-0 overflow-hidden bg-gradient-to-br from-mana-yellow/60 via-mana-cream to-white">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(255,199,44,0.55) 0%, rgba(255,199,44,0.15) 45%, transparent 75%)",
                }}
              />
              <div className="absolute bottom-6 left-1/2 h-4 w-[58%] -translate-x-1/2 rounded-full bg-black/25 blur-lg" />

              {producto.imagen_url ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative h-full w-full">
                    <Image
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, 500px"
                      className="object-contain"
                      style={{
                        filter:
                          "drop-shadow(0 18px 22px rgba(0,0,0,0.3)) drop-shadow(0 6px 8px rgba(0,0,0,0.2)) saturate(1.08)",
                      }}
                      priority
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl">
                  {emoji}
                </div>
              )}

              {extrasPrice > 0 && (
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-mana-yellow px-2.5 py-1 text-[11px] font-black text-mana-ink shadow-mana-soft">
                  <Sparkles className="h-3 w-3" />
                  Personalizado
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-black leading-tight text-mana-ink">
                    {producto.nombre}
                  </h2>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-mana-muted">
                    {categoria?.nombre}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-xl font-black text-mana-red">
                    {formatUSD(producto.precio_usd)}
                  </div>
                  <div className="text-[10px] text-mana-muted">
                    ≈ {formatBs(producto.precio_usd * tasaBs)}
                  </div>
                </div>
              </div>

              {producto.descripcion && (
                <p className="mt-3 text-sm leading-relaxed text-mana-ink/75">
                  {producto.descripcion}
                </p>
              )}

              {groups.map((group) => (
                <div key={group.id} className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-sm font-black uppercase tracking-wider text-mana-ink">
                      {group.label}
                    </h3>
                    {group.required ? (
                      <span className="text-[10px] font-bold text-mana-red">
                        Obligatorio
                      </span>
                    ) : (
                      <span className="text-[10px] text-mana-muted">
                        Opcional
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {group.options.map((opt) => {
                      const checked = selectedMods.has(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleMod(group.id, opt.id, group.type)}
                          className={[
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
                            checked
                              ? "bg-mana-red text-white ring-mana-red shadow-mana-soft"
                              : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span
                              className={[
                                "inline-flex h-4 w-4 shrink-0 items-center justify-center",
                                group.type === "single"
                                  ? "rounded-full ring-2"
                                  : "rounded ring-2",
                                checked
                                  ? "bg-white text-mana-red ring-white"
                                  : "ring-black/25",
                              ].join(" ")}
                            >
                              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                            </span>
                            {opt.label}
                          </span>
                          <span
                            className={[
                              "text-xs font-bold",
                              checked
                                ? "text-white/90"
                                : opt.price_usd === 0
                                ? "text-mana-muted"
                                : "text-mana-red",
                            ].join(" ")}
                          >
                            {opt.price_usd === 0
                              ? ""
                              : `+${formatUSD(opt.price_usd)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-5">
                <label className="block text-sm font-black uppercase tracking-wider text-mana-ink">
                  Notas para la cocina{" "}
                  <span className="text-[10px] font-normal normal-case tracking-normal text-mana-muted">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  maxLength={150}
                  placeholder="Ej: término medio, sin hielo, etc."
                  className="input-mana mt-2 resize-none text-sm"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-black/5 bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full bg-mana-cream ring-1 ring-black/10">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    aria-label="Disminuir cantidad"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-l-full hover:bg-mana-cream-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
                  >
                    <Minus className="h-4 w-4" strokeWidth={3} />
                  </button>
                  <span className="min-w-8 text-center font-display text-base font-black text-mana-ink">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                    aria-label="Aumentar cantidad"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-r-full hover:bg-mana-cream-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!producto.disponible}
                  className="flex-1 btn-primary h-12 text-sm"
                >
                  Agregar ·{" "}
                  <span className="font-black">{formatUSD(total)}</span>
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-mana-muted">
                ≈ {formatBs(total * tasaBs)}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
