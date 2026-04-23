import type { Categoria, Producto } from "@/types/database";
import { ProductCardFloating } from "./ProductCardFloating";

type Props = {
  categorias: Categoria[];
  productos: Producto[];
  tasaBs: number;
  onOpenDetail?: (p: Producto) => void;
  isSearching?: boolean;
  query?: string;
};

const CAT_EMOJI: Record<string, string> = {
  hamburguesas: "🍔",
  "hamburguesas-especiales": "🍔",
  "hot-dog": "🌭",
  enrollados: "🌯",
  pepitos: "🥖",
  salchipapas: "🍟",
  extras: "🧀",
  bebidas: "🥤",
};

export function MenuGrid({
  categorias,
  productos,
  tasaBs,
  onOpenDetail,
  isSearching,
  query,
}: Props) {
  const grouped = new Map<string, Producto[]>();
  for (const p of productos) {
    const bucket = grouped.get(p.categoria_id);
    if (bucket) bucket.push(p);
    else grouped.set(p.categoria_id, [p]);
  }

  if (isSearching && productos.length === 0) {
    return (
      <div className="container py-12 text-center">
        <div className="text-5xl mb-3">🔎</div>
        <h2 className="font-display text-xl font-black text-mana-ink">
          Nada encontrado para “{query}”
        </h2>
        <p className="mt-1 text-sm text-mana-muted">
          Prueba con otra palabra o revisa las categorías abajo.
        </p>
      </div>
    );
  }

  return (
    <div className="container space-y-10 py-6">
      {categorias.map((cat) => {
        const items = grouped.get(cat.id);
        if (!items || items.length === 0) return null;

        return (
          <section
            key={cat.id}
            id={`cat-${cat.slug}`}
            data-cat-slug={cat.slug}
            className="scroll-mt-32"
          >
            <div className="mb-4 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CAT_EMOJI[cat.slug] ?? "🍽️"}</span>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-mana-ink leading-tight">
                    {cat.nombre}
                  </h2>
                  <p className="text-xs text-mana-muted">
                    {items.length} {items.length === 1 ? "opción" : "opciones"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid denso en desktop: hasta 5 columnas a partir de lg y 6 en 2xl.
                En mobile se mantienen 2 columnas que es lo óptimo para tocar. */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
              {items.map((p) => (
                <ProductCardFloating
                  key={p.id}
                  producto={p}
                  tasaBs={tasaBs}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
