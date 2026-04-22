"use client";

import Image from "next/image";
import { Plus, Sliders } from "lucide-react";
import type { Producto } from "@/types/database";
import { useCart } from "@/lib/store/cart-store";
import { motion } from "framer-motion";
import { formatUSD, formatBs } from "@/lib/utils";
import { useState } from "react";

type Props = {
  producto: Producto;
  tasaBs: number;
  /** Se dispara al tocar el card para abrir el modal de detalle. */
  onOpenDetail?: (p: Producto) => void;
};

const EMOJI_BY_CATEGORY: Record<string, string> = {
  "cat-1": "🍔",
  "cat-2": "🍔",
  "cat-3": "🌭",
  "cat-4": "🌯",
  "cat-5": "🥖",
  "cat-6": "🍟",
  "cat-7": "🧀",
  "cat-8": "🥤",
};

export function ProductCardFloating({ producto, tasaBs, onOpenDetail }: Props) {
  const addItem = useCart((s) => s.addItem);
  const quantity = useCart((s) => s.countOfProducto(producto.id));

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const emoji = EMOJI_BY_CATEGORY[producto.categoria_id] ?? "🍔";
  const hasImage = !!producto.imagen_url && !imgError;
  const soldOut = !producto.disponible;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soldOut) return;
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_base_usd: producto.precio_usd,
      imagen_url: producto.imagen_url,
    });
  };

  const handleOpenDetail = () => {
    if (soldOut) return;
    onOpenDetail?.(producto);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      onClick={handleOpenDetail}
      role="button"
      tabIndex={soldOut ? -1 : 0}
      aria-label={`Ver detalles de ${producto.nombre}`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !soldOut) {
          e.preventDefault();
          handleOpenDetail();
        }
      }}
      className={[
        "group relative overflow-hidden rounded-3xl bg-white shadow-mana-soft ring-1 ring-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
        soldOut
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:shadow-mana hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-mana-yellow/60 via-mana-cream to-white">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(255,199,44,0.55) 0%, rgba(255,199,44,0.15) 45%, transparent 75%)",
          }}
        />

        <div className="absolute bottom-4 left-1/2 h-3 w-[62%] -translate-x-1/2 rounded-full bg-black/25 blur-lg" />

        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-mana-cream-dark/60 via-mana-cream to-mana-yellow/15 animate-pulse" />
            )}
            <div
              className={[
                "absolute inset-0 flex items-center justify-center p-4 transition-transform duration-500 ease-out",
                soldOut
                  ? "grayscale"
                  : "group-hover:scale-110 group-hover:-translate-y-1.5 group-hover:rotate-[-2deg]",
              ].join(" ")}
            >
              <div className="relative h-full w-full">
                <Image
                  src={producto.imagen_url!}
                  alt={producto.nombre}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={[
                    "object-contain transition-opacity duration-300",
                    imgLoaded ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                  onError={() => setImgError(true)}
                  onLoad={() => setImgLoaded(true)}
                  style={{
                    filter:
                      "drop-shadow(0 14px 18px rgba(0,0,0,0.28)) drop-shadow(0 4px 6px rgba(0,0,0,0.18)) saturate(1.08)",
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl sm:text-8xl drop-shadow-[0_14px_22px_rgba(200,16,46,0.35)] transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1.5">
            {emoji}
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 rounded-full bg-white/95 backdrop-blur px-3 py-1 shadow-mana-soft">
          <span className="font-display text-sm font-extrabold text-mana-red">
            {formatUSD(producto.precio_usd)}
          </span>
        </div>

        {quantity > 0 && !soldOut && (
          <motion.div
            key={quantity}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 380 }}
            className="absolute top-2.5 right-2.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-mana-yellow px-2 text-xs font-black text-mana-ink shadow-mana-soft ring-2 ring-white"
            aria-label={`Tienes ${quantity} en el carrito`}
          >
            ×{quantity}
          </motion.div>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-mana-black px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white ring-2 ring-white/30">
              Agotado
            </span>
          </div>
        )}

        {!soldOut && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Agregar ${producto.nombre} rápido`}
            className="absolute bottom-2.5 right-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-mana-red text-white shadow-mana transition hover:bg-mana-red-dark active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
          </button>
        )}

        {!soldOut && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-mana-ink shadow-mana-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:opacity-100"
          >
            <Sliders className="h-3 w-3" />
            Personalizar
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-display font-bold text-mana-ink leading-tight line-clamp-1">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="mt-0.5 text-[11px] text-mana-muted line-clamp-2 leading-snug min-h-[2rem]">
            {producto.descripcion}
          </p>
        )}
        <p className="text-[10px] text-mana-muted mt-1">
          ≈ {formatBs(producto.precio_usd * tasaBs)}
        </p>
      </div>
    </motion.article>
  );
}
