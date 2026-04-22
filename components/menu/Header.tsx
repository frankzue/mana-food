"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { BUSINESS, isOpenNow, mapsUrl } from "@/lib/utils";

/** Ícono inline de scooter/moto delivery en estilo lucide (stroke). */
function ScooterIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M5.5 17.5H3.5V14l2.5-3h5l2 3h3" />
      <path d="M13.5 11l1-4h3l1.5 4.5" />
    </svg>
  );
}

export function Header() {
  const isOpen = isOpenNow();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#141414] via-[#1f0d10] to-[#141414] backdrop-blur-md shadow-mana-soft">
      {/* Fila principal: logo + nombre + tagline + estado */}
      <div className="container flex items-center gap-3 py-2.5">
        <Link
          href="/"
          aria-label="Ir al inicio Maná Fast Food"
          className="flex items-center gap-3 min-w-0 rounded-xl transition-transform active:scale-[0.97] hover:opacity-95"
        >
          {/* Halo amarillo detrás del logo (glow de marca) */}
          <div className="relative shrink-0">
            <div
              aria-hidden
              className="absolute inset-0 -m-2 rounded-full blur-xl opacity-70"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,199,44,0.45) 0%, rgba(255,199,44,0.12) 45%, transparent 70%)",
              }}
            />
            <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-mana-black ring-1 ring-mana-yellow/40 shadow-[0_4px_16px_rgba(255,199,44,0.18)]">
              <Image
                src="/logo.png"
                alt="Maná Fast Food"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-display text-[15px] sm:text-base font-black text-white leading-none tracking-tight truncate">
                {BUSINESS.name}
              </h1>
              {/* Status en mini-pill: dot + palabra sobre fondo sutil */}
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ring-1",
                  isOpen
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                    : "bg-white/5 text-white/50 ring-white/10",
                ].join(" ")}
                aria-live="polite"
                title={
                  isOpen ? "Abierto · hasta 4 AM" : "Cerrado · abre 6 PM"
                }
              >
                <span className="relative flex h-1.5 w-1.5">
                  {isOpen && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={[
                      "relative inline-flex h-1.5 w-1.5 rounded-full",
                      isOpen ? "bg-emerald-400" : "bg-white/40",
                    ].join(" ")}
                  />
                </span>
                {isOpen ? "Abierto" : "Cerrado"}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-white/65 leading-none truncate">
              Hecho al{" "}
              <span className="text-mana-yellow font-semibold">momento</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Fila secundaria: chips funcionales + dirección clickeable */}
      <div className="border-t border-white/5 bg-black/30">
        <div className="container">
          <div
            className="flex items-center gap-0 py-1.5 text-[11px] text-white/80 overflow-x-auto whitespace-nowrap pr-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Dirección: chip clickeable que abre Google Maps */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver ubicación en Google Maps"
              className="inline-flex items-center gap-1.5 px-2.5 font-semibold text-white/90 hover:text-white transition-colors shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 text-mana-yellow" strokeWidth={2.2} />
              <span className="truncate max-w-[170px] sm:max-w-none">
                {BUSINESS.addressShort}
              </span>
              <ChevronRight className="h-3 w-3 text-white/40" />
            </a>
            <span className="text-white/25 select-none px-0.5">•</span>

            <span className="inline-flex items-center gap-1.5 px-2.5 font-semibold shrink-0">
              <ScooterIcon className="h-3.5 w-3.5 text-mana-yellow" />
              Delivery y Pickup
            </span>
            <span className="text-white/25 select-none px-0.5">•</span>

            <span className="inline-flex items-center gap-1.5 px-2.5 font-semibold shrink-0">
              <Clock className="h-3.5 w-3.5 text-mana-yellow" strokeWidth={2.2} />
              6 PM - 4 AM
            </span>
          </div>
        </div>
      </div>

      {/* Brand stripe: línea decorativa roja→amarilla→roja como acento de marca */}
      <div
        aria-hidden
        className="h-[2px] w-full bg-gradient-to-r from-mana-red via-mana-yellow to-mana-red opacity-80"
      />
    </header>
  );
}
