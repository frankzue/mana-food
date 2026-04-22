"use client";

import { useRef } from "react";
import type { Producto } from "@/types/database";
import { ProductCardFloating } from "./ProductCardFloating";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  productos: Producto[];
  tasaBs: number;
  onOpenDetail?: (p: Producto) => void;
};

export function FeaturedRow({
  title,
  subtitle,
  productos,
  tasaBs,
  onOpenDetail,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (productos.length === 0) return null;

  return (
    <section className="bg-mana-cream py-4">
      <div className="container">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-mana-red" />
              <h2 className="font-display text-xl sm:text-2xl font-black text-mana-ink">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-mana-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="hidden sm:flex gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Anterior"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/10 shadow-mana-soft hover:shadow-mana transition active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Siguiente"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/10 shadow-mana-soft hover:shadow-mana transition active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {productos.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[44%] xs:w-[40%] sm:w-[32%] md:w-[26%] lg:w-[20%]"
            >
              <ProductCardFloating
                producto={p}
                tasaBs={tasaBs}
                onOpenDetail={onOpenDetail}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
