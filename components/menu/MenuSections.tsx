"use client";

import { useMemo, useState } from "react";
import type { Categoria, Producto } from "@/types/database";
import { FeaturedRow } from "./FeaturedRow";
import { MenuGrid } from "./MenuGrid";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { SearchBar } from "./SearchBar";

type Props = {
  categorias: Categoria[];
  productos: Producto[];
  destacados: Producto[];
  tasaBs: number;
};

/**
 * Wrapper cliente que orquesta:
 * - Búsqueda global (con estado local)
 * - Modal de detalle de producto compartido entre FeaturedRow y MenuGrid
 * - Filtrado de productos según query activo
 */
export function MenuSections({
  categorias,
  productos,
  destacados,
  tasaBs,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Producto | null>(null);

  const categoriaById = useMemo(() => {
    const map = new Map<string, Categoria>();
    for (const c of categorias) map.set(c.id, c);
    return map;
  }, [categorias]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return productos;
    return productos.filter((p) => {
      const target = `${p.nombre} ${p.descripcion ?? ""}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [productos, normalizedQuery, isSearching]);

  const openProduct = (p: Producto) => setSelected(p);
  const closeProduct = () => setSelected(null);

  return (
    <>
      <SearchBar value={query} onChange={setQuery} resultsCount={filtered.length} />

      {!isSearching && destacados.length > 0 && (
        <FeaturedRow
          title="Los más pedidos"
          subtitle="Los favoritos de los clientes Maná"
          productos={destacados}
          tasaBs={tasaBs}
          onOpenDetail={openProduct}
        />
      )}

      <main className="bg-mana-cream min-h-[50vh] pb-24">
        <MenuGrid
          categorias={categorias}
          productos={filtered}
          tasaBs={tasaBs}
          onOpenDetail={openProduct}
          isSearching={isSearching}
          query={normalizedQuery}
        />
      </main>

      <ProductDetailSheet
        open={!!selected}
        producto={selected}
        categoria={selected ? categoriaById.get(selected.categoria_id) : undefined}
        tasaBs={tasaBs}
        onClose={closeProduct}
      />
    </>
  );
}
