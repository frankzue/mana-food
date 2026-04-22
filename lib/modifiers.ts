/**
 * Catálogo canónico de modificadores por categoría.
 *
 * Este archivo funciona como fuente de verdad tanto en cliente (para pintar la UI
 * del modal de detalle) como en servidor (para validar precios al crear el
 * pedido y evitar que un cliente manipule el body de la request con precios falsos).
 */

export type ModifierOption = {
  id: string;
  label: string;
  price_usd: number;
};

export type ModifierGroup = {
  id: string;
  label: string;
  type: "single" | "multiple";
  required?: boolean;
  min?: number;
  max?: number;
  options: ModifierOption[];
};

const EXTRAS_CARNE: ModifierGroup = {
  id: "extras",
  label: "Añadir extras",
  type: "multiple",
  options: [
    { id: "ex-tocineta", label: "Tocineta extra", price_usd: 2.0 },
    { id: "ex-queso", label: "Queso gouda extra", price_usd: 1.5 },
    { id: "ex-parmesano", label: "Queso parmesano", price_usd: 2.5 },
    { id: "ex-huevo", label: "Huevo frito", price_usd: 1.0 },
    { id: "ex-carne", label: "Carne extra 150gr", price_usd: 3.0 },
    { id: "ex-pollo", label: "Pollo extra", price_usd: 3.0 },
  ],
};

const QUITAR_HAMBURGUESA: ModifierGroup = {
  id: "quitar",
  label: "Quitar ingredientes",
  type: "multiple",
  options: [
    { id: "sin-cebolla", label: "Sin cebolla", price_usd: 0 },
    { id: "sin-tomate", label: "Sin tomate", price_usd: 0 },
    { id: "sin-lechuga", label: "Sin lechuga", price_usd: 0 },
    { id: "sin-salsas", label: "Sin salsas", price_usd: 0 },
    { id: "sin-tocineta", label: "Sin tocineta", price_usd: 0 },
  ],
};

const EXTRAS_HOTDOG: ModifierGroup = {
  id: "extras",
  label: "Añadir extras",
  type: "multiple",
  options: [
    { id: "ex-queso-hd", label: "Queso extra", price_usd: 1.5 },
    { id: "ex-tocineta-hd", label: "Tocineta extra", price_usd: 2.0 },
    { id: "ex-parmesano-hd", label: "Parmesano", price_usd: 2.5 },
    { id: "ex-salchicha", label: "Salchicha extra", price_usd: 2.0 },
    { id: "ex-papas-hd", label: "Ración papas", price_usd: 3.0 },
  ],
};

const QUITAR_HOTDOG: ModifierGroup = {
  id: "quitar",
  label: "Quitar ingredientes",
  type: "multiple",
  options: [
    { id: "sin-repollo", label: "Sin repollo", price_usd: 0 },
    { id: "sin-cebolla-hd", label: "Sin cebolla", price_usd: 0 },
    { id: "sin-salsas-hd", label: "Sin salsas", price_usd: 0 },
    { id: "sin-papas-hd", label: "Sin papitas", price_usd: 0 },
  ],
};

const EXTRAS_SALCHIPAPA: ModifierGroup = {
  id: "extras",
  label: "Añadir extras",
  type: "multiple",
  options: [
    { id: "ex-queso-sp", label: "Queso extra", price_usd: 1.5 },
    { id: "ex-tocineta-sp", label: "Tocineta extra", price_usd: 2.0 },
    { id: "ex-parmesano-sp", label: "Parmesano", price_usd: 2.5 },
    { id: "ex-pollo-sp", label: "Pollo extra", price_usd: 3.0 },
  ],
};

const BEBIDA_TAMANO: ModifierGroup = {
  id: "tamano",
  label: "Tamaño",
  type: "single",
  required: true,
  options: [
    { id: "tam-normal", label: "Normal", price_usd: 0 },
    { id: "tam-grande", label: "Grande", price_usd: 1.0 },
  ],
};

/** Grupos de modificadores disponibles por slug de categoría. */
export const MODIFIERS_BY_CATEGORY: Record<string, ModifierGroup[]> = {
  hamburguesas: [EXTRAS_CARNE, QUITAR_HAMBURGUESA],
  "hamburguesas-especiales": [EXTRAS_CARNE, QUITAR_HAMBURGUESA],
  "hot-dog": [EXTRAS_HOTDOG, QUITAR_HOTDOG],
  pepitos: [EXTRAS_CARNE, QUITAR_HAMBURGUESA],
  enrollados: [EXTRAS_CARNE, QUITAR_HAMBURGUESA],
  salchipapas: [EXTRAS_SALCHIPAPA],
  bebidas: [BEBIDA_TAMANO],
  extras: [],
};

/**
 * Mapa global id → ModifierOption. Se usa en el servidor para validar
 * precios cuando llega un pedido con modificadores.
 */
export const MODIFIER_CATALOG: Record<string, ModifierOption> = Object.values(
  MODIFIERS_BY_CATEGORY
)
  .flat()
  .flatMap((g) => g.options)
  .reduce<Record<string, ModifierOption>>((acc, o) => {
    acc[o.id] = o;
    return acc;
  }, {});

export function getGroupsForCategorySlug(slug: string): ModifierGroup[] {
  return MODIFIERS_BY_CATEGORY[slug] ?? [];
}

export function resolveModifier(id: string): ModifierOption | null {
  return MODIFIER_CATALOG[id] ?? null;
}

/** Resume visualmente los modificadores ("Sencilla · +Tocineta, sin cebolla"). */
export function summarizeModifiers(ids: string[]): string {
  if (ids.length === 0) return "";
  const parts = ids
    .map((id) => resolveModifier(id)?.label)
    .filter(Boolean) as string[];
  return parts.join(", ");
}

export function sumModifierPrices(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (resolveModifier(id)?.price_usd ?? 0), 0);
}
