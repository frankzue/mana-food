"use client";

import { useEffect, useState } from "react";
import type { Categoria } from "@/types/database";

type Props = {
  categorias: Categoria[];
};

export function CategoryTabs({ categorias }: Props) {
  const [active, setActive] = useState<string | null>(
    categorias[0]?.slug ?? null
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.getAttribute("data-cat-slug");
          if (id) setActive(id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    categorias.forEach((c) => {
      const el = document.getElementById(`cat-${c.slug}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categorias]);

  const scrollToCategory = (slug: string) => {
    const el = document.getElementById(`cat-${slug}`);
    if (!el) return;
    const offset = 130;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      className="hidden lg:block sticky top-[92px] z-30 bg-mana-cream/95 backdrop-blur-md border-b border-black/5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]"
      aria-label="Categorías"
    >
      <div className="container">
        <ul className="flex gap-2.5 overflow-x-auto py-4 scrollbar-thin">
          {categorias.map((c) => {
            const isActive = c.slug === active;
            return (
              <li key={c.id}>
                <button
                  onClick={() => scrollToCategory(c.slug)}
                  className={[
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-mana-red text-white shadow-mana"
                      : "bg-white text-mana-ink hover:bg-mana-yellow/30 ring-1 ring-black/5",
                  ].join(" ")}
                >
                  {c.nombre}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
