"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/store/cart-store";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { formatUSD, formatBs } from "@/lib/utils";
import { useEffect } from "react";

type Props = {
  tasaBs: number;
};

/**
 * Barra flotante del carrito al estilo Rappi / Uber Eats.
 * Aparece SOLO si hay items en el carrito, en la parte inferior de la pantalla.
 * Muestra: contador de items + subtotal en USD y equivalente Bs.
 * Click abre el drawer del carrito. Se anima con un "bump" cada vez
 * que se agrega un producto nuevo.
 */
export function CartFloatingBar({ tasaBs }: Props) {
  const openCart = useCart((s) => s.open);
  const items = useCart((s) => s.items);
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const controls = useAnimationControls();

  const count = items.reduce((sum, i) => sum + i.cantidad, 0);
  const subtotal = items.reduce(
    (s, i) => s + i.precio_unit_usd * i.cantidad,
    0
  );

  const visible = count > 0;

  useEffect(() => {
    if (lastAddedAt === 0) return;
    controls.start({
      scale: [1, 1.06, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });
  }, [lastAddedAt, controls]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cart-floating"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-40 pointer-events-none px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
        >
          <div className="absolute inset-x-0 bottom-0 h-28 -z-10 bg-gradient-to-t from-mana-cream via-mana-cream/80 to-transparent" />

          <motion.button
            animate={controls}
            onClick={openCart}
            className="pointer-events-auto mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-mana-red px-4 py-3.5 text-white shadow-mana ring-1 ring-mana-red-dark/40 transition-colors hover:bg-mana-red-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
            aria-label={`Ver pedido, ${count} productos, total ${formatUSD(subtotal)}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                <motion.span
                  key={count}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mana-yellow px-1 text-[11px] font-black text-mana-black ring-2 ring-mana-red"
                >
                  {count}
                </motion.span>
              </div>
              <div className="text-left min-w-0">
                <div className="font-display text-sm font-black leading-tight">
                  Ver pedido
                </div>
                <div className="text-[11px] text-white/80 leading-tight">
                  {count} {count === 1 ? "producto" : "productos"} · subtotal
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-display font-black text-base leading-none">
                  {formatUSD(subtotal)}
                </div>
                <div className="text-[10px] text-white/75 leading-tight mt-0.5">
                  ≈ {formatBs(subtotal * tasaBs)}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/80" />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
