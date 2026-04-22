"use client";

import { useCart } from "@/lib/store/cart-store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
  X,
  ShoppingBag,
  ArrowRight,
  StickyNote,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatUSD, formatBs } from "@/lib/utils";
import { summarizeModifiers } from "@/lib/modifiers";

type Props = {
  tasaBs: number;
  ivaRate: number;
};

export function CartDrawer({ tasaBs, ivaRate }: Props) {
  const router = useRouter();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const inc = useCart((s) => s.increment);
  const dec = useCart((s) => s.decrement);
  const remove = useCart((s) => s.removeItem);

  const subtotal = items.reduce(
    (s, i) => s + i.precio_unit_usd * i.cantidad,
    0
  );
  const iva = subtotal * ivaRate;
  const estimado = subtotal + iva;

  const goCheckout = () => {
    close();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-mana-cream shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-black/5 bg-mana-black p-4 text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-mana-yellow" />
                <h2 className="font-display text-lg font-bold">Tu carrito</h2>
              </div>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="rounded-full p-1.5 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="text-6xl mb-3">🛒</div>
                  <p className="font-display text-lg font-bold text-mana-ink">
                    Tu carrito está vacío
                  </p>
                  <p className="text-sm text-mana-muted mt-1">
                    Agrega productos del menú para empezar.
                  </p>
                  <button
                    onClick={close}
                    className="btn-secondary mt-6"
                  >
                    Ver menú
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((it) => {
                      const mods = summarizeModifiers(it.modifier_ids);
                      return (
                        <motion.li
                          key={it.cartId}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 120 }}
                          transition={{ duration: 0.22 }}
                          className="card-mana flex gap-3 p-3"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-mana-cream-dark">
                            {it.imagen_url && (
                              <Image
                                src={it.imagen_url}
                                alt={it.nombre}
                                fill
                                sizes="64px"
                                className="object-contain p-1"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm text-mana-ink leading-tight">
                                {it.nombre}
                              </h3>
                              <button
                                onClick={() => remove(it.cartId)}
                                aria-label="Eliminar"
                                className="text-mana-muted hover:text-mana-red transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-red rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-mana-muted mt-0.5">
                              {formatUSD(it.precio_unit_usd)} c/u
                              {it.precio_unit_usd !== it.precio_base_usd && (
                                <span className="text-mana-red font-semibold">
                                  {" "}
                                  (+
                                  {formatUSD(
                                    it.precio_unit_usd - it.precio_base_usd
                                  )}{" "}
                                  extras)
                                </span>
                              )}
                            </p>
                            {mods && (
                              <p className="mt-1 rounded-md bg-mana-yellow/25 px-2 py-0.5 text-[11px] text-mana-ink line-clamp-2">
                                {mods}
                              </p>
                            )}
                            {it.notas && (
                              <p className="mt-1 flex items-start gap-1 text-[11px] text-mana-muted italic">
                                <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
                                {it.notas}
                              </p>
                            )}

                            <div className="mt-2 flex items-center justify-between">
                              <div className="inline-flex items-center rounded-full bg-white ring-1 ring-black/10">
                                <button
                                  onClick={() => dec(it.cartId)}
                                  aria-label="Quitar uno"
                                  className="p-1.5 hover:bg-mana-cream-dark rounded-l-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-8 text-center text-sm font-bold">
                                  {it.cantidad}
                                </span>
                                <button
                                  onClick={() => inc(it.cartId)}
                                  aria-label="Agregar uno"
                                  className="p-1.5 hover:bg-mana-cream-dark rounded-r-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="font-display font-extrabold text-mana-red">
                                {formatUSD(it.precio_unit_usd * it.cantidad)}
                              </span>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-black/5 bg-white p-4 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-mana-muted">Subtotal</span>
                    <span className="font-semibold">
                      {formatUSD(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mana-muted">
                      IVA ({Math.round(ivaRate * 100)}%)
                    </span>
                    <span className="font-semibold">{formatUSD(iva)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-mana-muted italic">
                    <span>Envío</span>
                    <span>se calcula en el siguiente paso</span>
                  </div>
                  <div className="border-t border-dashed border-black/10 pt-2 flex justify-between items-end">
                    <span className="text-sm font-semibold">Estimado</span>
                    <div className="text-right">
                      <div className="font-display text-lg font-black text-mana-red">
                        {formatUSD(estimado)}
                      </div>
                      <div className="text-xs text-mana-muted">
                        ≈ {formatBs(estimado * tasaBs)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={goCheckout}
                  className="w-full btn-primary text-base py-3.5"
                >
                  Ir a checkout <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
