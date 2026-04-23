"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  DollarSign,
  Pencil,
  Percent,
  Search,
  X,
  EyeOff,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Producto, Categoria } from "@/types/database";
import { formatUSD } from "@/lib/utils";

type Props = {
  productos: Producto[];
  categorias: Categoria[];
};

type EditingState = {
  id: string;
  precio: string;
  costo: string;
  nombre: string;
  descripcion: string;
} | null;

export function ProductosBoard({ productos, categorias }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [editing, setEditing] = useState<EditingState>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productosConCat = useMemo(() => {
    const catById = new Map(categorias.map((c) => [c.id, c]));
    return productos.map((p) => ({
      ...p,
      categoria: catById.get(p.categoria_id),
    }));
  }, [productos, categorias]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productosConCat.filter((p) => {
      if (catFilter !== "todas" && p.categoria_id !== catFilter) return false;
      if (q && !(
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion ?? "").toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [productosConCat, query, catFilter]);

  const grouped = useMemo(() => {
    const g = new Map<string, typeof filtered>();
    for (const p of filtered) {
      const key = p.categoria_id;
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(p);
    }
    return g;
  }, [filtered]);

  function startEdit(p: Producto) {
    setEditing({
      id: p.id,
      precio: String(Number(p.precio_usd ?? 0).toFixed(2)),
      costo: String(Number(p.costo_usd ?? 0).toFixed(2)),
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
    });
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    if (!editing) return;
    const precio = Number(editing.precio);
    const costo = Number(editing.costo);
    if (!isFinite(precio) || precio < 0) {
      setError("Precio inválido");
      return;
    }
    if (!isFinite(costo) || costo < 0) {
      setError("Costo inválido");
      return;
    }
    if (!editing.nombre.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }

    setSavingId(editing.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          nombre: editing.nombre.trim(),
          descripcion: editing.descripcion.trim() || null,
          precio_usd: precio,
          costo_usd: costo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      setEditing(null);
      startTransition(() => router.refresh());
    } catch (e) {
      setError("Error de red");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleDisponible(p: Producto) {
    setSavingId(p.id);
    try {
      const res = await fetch("/api/admin/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          disponible: !p.disponible,
        }),
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mana-muted" />
          <input
            type="search"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-white ring-1 ring-black/10 pl-9 pr-3 py-2 text-sm focus:ring-mana-red focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCatFilter("todas")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
              catFilter === "todas"
                ? "bg-mana-ink text-white ring-mana-ink"
                : "bg-white text-mana-ink ring-black/10 hover:ring-mana-ink/40",
            ].join(" ")}
          >
            Todas ({productos.length})
          </button>
          {categorias.map((c) => {
            const count = productos.filter((p) => p.categoria_id === c.id).length;
            if (count === 0) return null;
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  catFilter === c.id
                    ? "bg-mana-red text-white ring-mana-red"
                    : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                ].join(" ")}
              >
                {c.nombre}{" "}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla / cards */}
      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([catId, items]) => {
          const cat = categorias.find((c) => c.id === catId);
          return (
            <div
              key={catId}
              className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-mana-cream-dark/60 border-b border-black/5">
                <h3 className="font-display font-black text-mana-ink text-sm">
                  {cat?.nombre ?? "Sin categoría"}{" "}
                  <span className="text-mana-muted font-semibold">
                    · {items.length}
                  </span>
                </h3>
              </div>

              <ul className="divide-y divide-black/5">
                {items.map((p) => {
                  const margen =
                    Number(p.precio_usd) > 0 && Number(p.costo_usd ?? 0) > 0
                      ? ((Number(p.precio_usd) - Number(p.costo_usd)) /
                          Number(p.precio_usd)) *
                        100
                      : null;
                  const isEditing = editing?.id === p.id;
                  const saving = savingId === p.id;

                  return (
                    <li
                      key={p.id}
                      className={`px-3 sm:px-4 py-3 flex items-start gap-3 ${
                        !p.disponible ? "opacity-60" : ""
                      }`}
                    >
                      {/* Thumb */}
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-mana-cream ring-1 ring-black/5 shrink-0">
                        {p.imagen_url ? (
                          <Image
                            src={p.imagen_url}
                            alt={p.nombre}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-mana-muted text-[10px]">
                            sin foto
                          </div>
                        )}
                      </div>

                      {/* Datos */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editing.nombre}
                              onChange={(e) =>
                                setEditing({ ...editing, nombre: e.target.value })
                              }
                              className="w-full rounded-lg ring-1 ring-black/15 bg-white px-2.5 py-1.5 text-sm font-bold text-mana-ink focus:ring-mana-red focus:outline-none"
                              placeholder="Nombre"
                            />
                            <textarea
                              value={editing.descripcion}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  descripcion: e.target.value,
                                })
                              }
                              rows={2}
                              className="w-full rounded-lg ring-1 ring-black/15 bg-white px-2.5 py-1.5 text-[12px] text-mana-ink focus:ring-mana-red focus:outline-none"
                              placeholder="Descripción"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-mana-muted">
                                  Precio (USD)
                                </span>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mana-muted" />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={editing.precio}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        precio: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg ring-1 ring-black/15 bg-white pl-7 pr-2 py-1.5 text-sm font-bold text-mana-ink focus:ring-mana-red focus:outline-none"
                                  />
                                </div>
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-mana-muted">
                                  Costo (USD)
                                </span>
                                <div className="relative">
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mana-muted" />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={editing.costo}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        costo: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg ring-1 ring-black/15 bg-white pl-7 pr-2 py-1.5 text-sm font-bold text-mana-ink focus:ring-mana-red focus:outline-none"
                                  />
                                </div>
                              </label>
                            </div>
                            {error && (
                              <p className="text-xs text-red-600 inline-flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {error}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={save}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-full bg-mana-success text-white px-3 py-1.5 text-xs font-bold hover:brightness-110 disabled:opacity-60"
                              >
                                {saving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Guardar
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white text-mana-ink ring-1 ring-black/10 px-3 py-1.5 text-xs font-bold hover:bg-gray-50 disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-mana-ink">
                                {p.nombre}
                              </h4>
                              {!p.disponible && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 ring-1 ring-gray-200">
                                  <EyeOff className="h-3 w-3" />
                                  Oculto
                                </span>
                              )}
                            </div>
                            {p.descripcion && (
                              <p className="text-[12px] text-mana-muted line-clamp-2">
                                {p.descripcion}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-3 flex-wrap text-[12px]">
                              <span className="font-display font-black text-mana-ink">
                                {formatUSD(Number(p.precio_usd))}
                              </span>
                              {Number(p.costo_usd ?? 0) > 0 && (
                                <span className="text-mana-muted">
                                  Costo: {formatUSD(Number(p.costo_usd))}
                                </span>
                              )}
                              {margen != null && (
                                <span
                                  className={`inline-flex items-center gap-0.5 font-bold ${
                                    margen >= 50
                                      ? "text-emerald-600"
                                      : margen >= 25
                                        ? "text-amber-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  <Percent className="h-3 w-3" />
                                  {margen.toFixed(0)}% margen
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Acciones */}
                      {!isEditing && (
                        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                          <button
                            onClick={() => startEdit(p)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 text-gray-700 px-2.5 py-1.5 text-[11px] font-bold ring-1 ring-gray-200 hover:bg-mana-yellow/30 hover:ring-mana-yellow transition disabled:opacity-60"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => toggleDisponible(p)}
                            disabled={saving}
                            title={
                              p.disponible
                                ? "Ocultar de la tienda"
                                : "Mostrar en la tienda"
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 transition disabled:opacity-60 ${
                              p.disponible
                                ? "bg-white text-mana-ink ring-black/10 hover:ring-red-300 hover:text-red-600"
                                : "bg-mana-success text-white ring-mana-success hover:brightness-110"
                            }`}
                          >
                            {p.disponible ? (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                Mostrar
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white ring-1 ring-black/5 py-10 text-center">
            <p className="text-sm text-mana-muted">
              No hay productos que coincidan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
