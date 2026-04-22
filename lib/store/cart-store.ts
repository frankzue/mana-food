"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  /**
   * Identificador único del renglón del carrito.
   * Un mismo `producto_id` puede aparecer varias veces si el cliente elige
   * modificadores distintos — cada variante tiene su propio `cartId`.
   */
  cartId: string;
  producto_id: string;
  nombre: string;
  /** Precio base (sin modificadores ni notas). */
  precio_base_usd: number;
  /** Precio unitario final = base + suma(modificadores). */
  precio_unit_usd: number;
  imagen_url: string | null;
  cantidad: number;
  /** IDs de modificadores aplicados; se resuelven vía `MODIFIER_CATALOG`. */
  modifier_ids: string[];
  notas?: string;
};

type AddInput = {
  producto_id: string;
  nombre: string;
  precio_base_usd: number;
  imagen_url: string | null;
  modifier_ids?: string[];
  notas?: string;
  extra_price_usd?: number;
  cantidad?: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** Último `cartId` agregado (para animar la floating bar en cliente). */
  lastAddedAt: number;
  addItem: (input: AddInput) => void;
  removeItem: (cartId: string) => void;
  increment: (cartId: string) => void;
  decrement: (cartId: string) => void;
  clear: () => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
  count: () => number;
  countOfProducto: (producto_id: string) => number;
  subtotalUsd: () => number;
};

/**
 * Devuelve un cartId determinístico a partir de producto + modificadores ordenados
 * + notas. Si dos ítems coinciden exactamente, se suma cantidad en lugar de duplicar.
 */
function buildCartId(
  producto_id: string,
  modifier_ids: string[] = [],
  notas: string = ""
): string {
  const sorted = [...modifier_ids].sort().join("|");
  const notasKey = notas.trim().toLowerCase();
  return `${producto_id}::${sorted}::${notasKey}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAddedAt: 0,

      addItem: (input) =>
        set((state) => {
          const modifier_ids = input.modifier_ids ?? [];
          const cantidad = input.cantidad ?? 1;
          const notas = input.notas ?? "";
          const cartId = buildCartId(input.producto_id, modifier_ids, notas);

          const precio_unit_usd =
            input.precio_base_usd + (input.extra_price_usd ?? 0);

          const existing = state.items.find((i) => i.cartId === cartId);
          if (existing) {
            return {
              lastAddedAt: Date.now(),
              items: state.items.map((i) =>
                i.cartId === cartId
                  ? { ...i, cantidad: i.cantidad + cantidad }
                  : i
              ),
            };
          }
          return {
            lastAddedAt: Date.now(),
            items: [
              ...state.items,
              {
                cartId,
                producto_id: input.producto_id,
                nombre: input.nombre,
                precio_base_usd: input.precio_base_usd,
                precio_unit_usd,
                imagen_url: input.imagen_url,
                cantidad,
                modifier_ids,
                notas: notas || undefined,
              },
            ],
          };
        }),

      removeItem: (cartId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartId !== cartId),
        })),

      increment: (cartId) =>
        set((state) => ({
          lastAddedAt: Date.now(),
          items: state.items.map((i) =>
            i.cartId === cartId ? { ...i, cantidad: i.cantidad + 1 } : i
          ),
        })),

      decrement: (cartId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.cartId === cartId ? { ...i, cantidad: i.cantidad - 1 } : i
            )
            .filter((i) => i.cantidad > 0),
        })),

      clear: () => set({ items: [], isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      count: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
      countOfProducto: (producto_id) =>
        get()
          .items.filter((i) => i.producto_id === producto_id)
          .reduce((sum, i) => sum + i.cantidad, 0),
      subtotalUsd: () =>
        get().items.reduce((s, i) => s + i.precio_unit_usd * i.cantidad, 0),
    }),
    {
      name: "mana-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted: any, version) => {
        // v1 → v2: cambio de clave producto_id a cartId + modifier_ids.
        if (!persisted || version >= 2) return persisted;
        const items = Array.isArray(persisted.items) ? persisted.items : [];
        return {
          items: items.map((i: any) => ({
            cartId: buildCartId(i.producto_id, [], ""),
            producto_id: i.producto_id,
            nombre: i.nombre,
            precio_base_usd: i.precio_unit_usd,
            precio_unit_usd: i.precio_unit_usd,
            imagen_url: i.imagen_url,
            cantidad: i.cantidad,
            modifier_ids: [],
          })),
        };
      },
    }
  )
);
