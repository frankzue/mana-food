"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  resultsCount: number;
};

export function SearchBar({ value, onChange, resultsCount }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const isSearching = value.trim().length > 0;

  return (
    <section className="bg-mana-cream pt-2 pb-2">
      <div className="container">
        {/* En desktop centramos el buscador y limitamos su ancho para que
            no se vea como una barra vacia de extremo a extremo. Tambien
            usamos un estilo mas "premium" con bordes redondeados grandes,
            sombra suave y foco en amarillo marca. */}
        <div className="relative mx-auto w-full lg:max-w-2xl">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mana-muted"
          />
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar hamburguesa, hot dog, papas…"
            aria-label="Buscar productos"
            className="w-full rounded-full bg-white pl-11 pr-24 py-2.5 lg:py-3 text-sm font-medium text-mana-ink shadow-mana-soft ring-1 ring-black/5 placeholder:text-mana-muted/80 focus:outline-none focus:ring-2 focus:ring-mana-yellow focus:ring-offset-2 focus:ring-offset-mana-cream focus:bg-white transition"
          />

          {/* Sufijo: badge con contador cuando se busca, o atajo Ctrl+K */}
          {isSearching ? (
            <>
              {resultsCount > 0 && (
                <span className="hidden sm:inline-flex absolute right-12 top-1/2 -translate-y-1/2 items-center rounded-full bg-mana-yellow/25 ring-1 ring-mana-yellow/50 px-2 py-0.5 text-[11px] font-bold text-mana-ink">
                  {resultsCount} resultado{resultsCount === 1 ? "" : "s"}
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-mana-cream-dark text-mana-ink transition hover:bg-mana-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
              >
                <X className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            </>
          ) : (
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md bg-white ring-1 ring-black/10 px-1.5 py-0.5 text-[10px] font-bold text-mana-muted shadow-sm lg:inline-flex">
              <span className="text-[11px] leading-none">⌘</span>K
            </kbd>
          )}
        </div>

        {isSearching && resultsCount === 0 && (
          <p className="mx-auto mt-1.5 w-full lg:max-w-2xl text-xs text-mana-muted">
            Sin resultados. Prueba con otra palabra.
          </p>
        )}
      </div>
    </section>
  );
}
