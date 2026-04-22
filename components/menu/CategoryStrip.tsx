"use client";

import type { Categoria } from "@/types/database";

const ICON_BY_SLUG: Record<string, string> = {
  "hamburguesas": "🍔",
  "hamburguesas-especiales": "🍔",
  "hot-dog": "🌭",
  "enrollados": "🌯",
  "pepitos": "🥖",
  "salchipapas": "🍟",
  "extras": "🧀",
  "bebidas": "🥤",
};

type Props = {
  categorias: Categoria[];
};

export function CategoryStrip({ categorias }: Props) {
  const scrollTo = (slug: string) => {
    const el = document.getElementById(`cat-${slug}`);
    if (!el) return;
    const offset = 130;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section className="bg-mana-cream">
      <div className="container py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm font-bold text-mana-ink uppercase tracking-wider">
            Categorías
          </h2>
          <span className="text-[11px] text-mana-muted">
            Desliza para ver más →
          </span>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {categorias.map((c, i) => (
            <button
              key={c.id}
              onClick={() => scrollTo(c.slug)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-mana-yellow/30 via-white to-mana-red/10 ring-2 ring-white shadow-mana-soft flex items-center justify-center text-3xl sm:text-4xl transition-all group-hover:shadow-mana group-hover:scale-105 group-active:scale-95">
                <span className="drop-shadow-sm">
                  {ICON_BY_SLUG[c.slug] ?? "🍽️"}
                </span>
                <div className="absolute inset-0 rounded-full ring-0 group-hover:ring-2 ring-mana-red/30 transition-all" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-mana-ink text-center max-w-[80px] leading-tight">
                {c.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
