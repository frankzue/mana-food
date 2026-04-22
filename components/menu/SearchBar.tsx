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
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mana-muted"
          />
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar hamburguesa, hot dog, papas..."
            aria-label="Buscar productos"
            className="w-full rounded-full bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-mana-ink shadow-mana-soft ring-1 ring-black/5 placeholder:text-mana-muted focus:outline-none focus:ring-2 focus:ring-mana-red/30 focus:bg-white"
          />
          {isSearching ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-mana-cream-dark text-mana-ink transition hover:bg-mana-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded bg-mana-cream-dark px-1.5 py-0.5 text-[10px] font-bold text-mana-muted sm:inline-block">
              Ctrl K
            </kbd>
          )}
        </div>

        {isSearching && (
          <p className="mt-1.5 text-xs text-mana-muted">
            {resultsCount === 0
              ? "Sin resultados. Prueba con otra palabra."
              : `${resultsCount} ${resultsCount === 1 ? "producto" : "productos"} encontrados`}
          </p>
        )}
      </div>
    </section>
  );
}
