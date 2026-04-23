"use client";

import { useRef, useState, useEffect } from "react";
import { Flame, Clock, Bike, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: JSX.Element;
  bg: string; // tailwind gradient classes
  cta: string;
  href?: string;
  emoji: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    badge: "LA FAVORITA",
    title: "Maná Trifásica",
    subtitle: "150gr carne + 150gr pollo + chuleta ahumada. La bomba de sabor.",
    icon: <Flame className="h-4 w-4" />,
    bg: "from-mana-red via-mana-red-dark to-mana-black",
    cta: "Ver ahora",
    href: "#cat-hamburguesas-especiales",
    emoji: "🍔",
  },
  {
    id: "2",
    badge: "NOVEDAD",
    title: "Tripapas Maná",
    subtitle: "Papas con carne, pollo, chuleta, quesos, tocineta y todas las salsas.",
    icon: <Sparkles className="h-4 w-4" />,
    bg: "from-mana-yellow-dark via-mana-yellow to-mana-red",
    cta: "Probar",
    href: "#cat-salchipapas",
    emoji: "🍟",
  },
  {
    id: "3",
    badge: "ENVÍO EXPRESS",
    title: "Delivery en todo C. Bolívar",
    subtitle: "10 zonas cubiertas, envío desde $1. Pedí con 1 click.",
    icon: <Bike className="h-4 w-4" />,
    bg: "from-mana-black via-mana-red-dark to-mana-red",
    cta: "Ver zonas",
    href: "/checkout",
    emoji: "🛵",
  },
  {
    id: "4",
    badge: "ABIERTO AHORA",
    title: "Todos los días · 6 PM — 4 AM",
    subtitle: "Hecho al momento. Pedí antes de que se agote.",
    icon: <Clock className="h-4 w-4" />,
    bg: "from-mana-red via-mana-red-dark to-mana-yellow-dark",
    cta: "Ver menú",
    href: "#cat-hamburguesas",
    emoji: "🔥",
  },
];

export function PromoSlider() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance cada 5s — usamos scrollTo horizontal para NO mover el scroll vertical.
  // Pausa cuando el usuario interactúa (hover/touch), respetando su foco.
  useEffect(() => {
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el || paused) return;
      if (document.hidden) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!inView) return;

      const next = (index + 1) % SLIDES.length;
      const child = el.children[next] as HTMLElement | undefined;
      if (!child) return;
      const targetLeft =
        child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: targetLeft, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, [index, paused]);

  // Tracking del slide activo vía IntersectionObserver
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number(visible.target.getAttribute("data-idx"));
          if (!Number.isNaN(idx)) setIndex(idx);
        }
      },
      { root: el, threshold: [0.5, 0.75, 1] }
    );
    Array.from(el.children).forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-mana-cream pt-3 pb-3 lg:pt-4 lg:pb-4">
      {/* ====== MOBILE/TABLET (<lg): carrusel scroll-snap ====== */}
      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {SLIDES.map((s, i) => (
          <a
            key={s.id}
            href={s.href ?? "#"}
            data-idx={i}
            className={`snap-center shrink-0 w-[92%] sm:w-[85%] md:w-[70%] rounded-3xl overflow-hidden relative bg-gradient-to-br ${s.bg} text-white shadow-mana cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow`}
          >
            <div className="flex items-center gap-3 p-5 sm:p-6 min-h-[170px] sm:min-h-[200px]">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm ring-1 ring-white/20 px-2.5 py-1 text-[10px] sm:text-xs font-black text-white tracking-[0.12em] shadow-sm">
                  <span className="text-mana-yellow">{s.icon}</span>
                  {s.badge}
                </span>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-black leading-tight mt-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 mt-1.5 line-clamp-2">
                  {s.subtitle}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-white text-mana-red px-3.5 py-1.5 text-xs font-bold shadow-mana-soft">
                  <Zap className="h-3.5 w-3.5" /> {s.cta}
                </span>
              </div>

              <motion.div
                className="text-6xl sm:text-7xl md:text-8xl shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                animate={{ rotate: [0, -6, 6, 0], y: [0, -4, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {s.emoji}
              </motion.div>
            </div>

            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 100%, #FFC72C 0%, transparent 45%)",
              }}
            />
          </a>
        ))}
      </div>

      {/* Dots sólo en mobile */}
      <div className="lg:hidden flex items-center justify-center gap-1.5 mt-3">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-6 bg-mana-red"
                : "w-1.5 bg-mana-red/25"
            }`}
          />
        ))}
      </div>

      {/* ====== DESKTOP (lg+): dos promos HERO grandes lado a lado
              con altura fija compacta. Se muestran siempre las 2 primeras
              (LA FAVORITA + NOVEDAD) y a la derecha un pequeño sidebar
              con accesos directos (envío + horario) para aprovechar el
              ancho sin hacer los banners gigantes. ====== */}
      <div className="hidden lg:block container">
        <div className="grid grid-cols-12 gap-3">
          {SLIDES.slice(0, 2).map((s) => (
            <a
              key={s.id}
              href={s.href ?? "#"}
              className={`col-span-5 rounded-2xl overflow-hidden relative bg-gradient-to-br ${s.bg} text-white shadow-mana-soft hover:shadow-mana transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow`}
            >
              <div className="flex items-center gap-4 px-5 py-4 min-h-[120px]">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm ring-1 ring-white/20 px-2 py-0.5 text-[10px] font-black text-white tracking-[0.12em]">
                    <span className="text-mana-yellow">{s.icon}</span>
                    {s.badge}
                  </span>
                  <h3 className="font-display text-xl font-black leading-tight mt-1.5 truncate">
                    {s.title}
                  </h3>
                  <p className="text-[12px] text-white/80 mt-1 line-clamp-1">
                    {s.subtitle}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-white text-mana-red px-3 py-1 text-[11px] font-bold shadow-mana-soft">
                    <Zap className="h-3 w-3" /> {s.cta}
                  </span>
                </div>
                <motion.div
                  className="text-5xl shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                  animate={{ rotate: [0, -6, 6, 0], y: [0, -3, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {s.emoji}
                </motion.div>
              </div>
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 100%, #FFC72C 0%, transparent 45%)",
                }}
              />
            </a>
          ))}

          {/* Sidebar de accesos (ENVÍO + HORARIO) */}
          <div className="col-span-2 grid grid-rows-2 gap-3">
            {SLIDES.slice(2).map((s) => (
              <a
                key={s.id}
                href={s.href ?? "#"}
                className={`rounded-2xl overflow-hidden relative bg-gradient-to-br ${s.bg} text-white shadow-mana-soft hover:shadow-mana transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow flex items-center gap-2 px-3 py-2`}
              >
                <div className="text-2xl shrink-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
                  {s.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-mana-yellow leading-none">
                    {s.badge}
                  </p>
                  <p className="text-[12px] font-bold leading-tight mt-0.5 line-clamp-2">
                    {s.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
