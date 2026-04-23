"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { BUSINESS, isOpenNow, mapsUrl } from "@/lib/utils";

/**
 * Header del menú público.
 *
 * Diseño:
 * - Mobile/tablet (<lg): dos filas apiladas — logo + info arriba, dirección
 *   y delivery abajo. Es la versión compacta histórica.
 * - Desktop (lg+): una sola fila balanceada. Logo a la izquierda, bloque
 *   de marca (nombre + estado) al centro-izquierda, y a la derecha un
 *   grupo de "chips" con horario, dirección y tipo de servicio. Esto
 *   elimina el hueco vacío que aparecía en PC con la versión móvil.
 */
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

function StatusPill({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 ring-1",
        isOpen
          ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40"
          : "bg-white/5 text-white/50 ring-white/10",
      ].join(" ")}
      aria-live="polite"
      title={isOpen ? "Abierto · 6 PM - 4 AM" : "Cerrado · abre 6 PM"}
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
  );
}

export function Header() {
  const isOpen = isOpenNow();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#141414] via-[#1f0d10] to-[#141414] backdrop-blur-md shadow-mana-soft">
      {/* ====== Vista mobile/tablet (<lg) ====== */}
      <div className="lg:hidden">
        <div className="container flex items-center gap-3.5 py-3.5">
          <Link
            href="/"
            aria-label="Ir al inicio Maná Fast Food"
            className="flex items-center gap-3.5 min-w-0 flex-1 rounded-xl transition-transform active:scale-[0.98] hover:opacity-95"
          >
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full blur-xl opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,199,44,0.45) 0%, rgba(255,199,44,0.12) 45%, transparent 70%)",
                }}
              />
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-mana-black ring-1 ring-mana-yellow/40 shadow-[0_4px_16px_rgba(255,199,44,0.18)]">
                <Image
                  src="/logo.png"
                  alt="Maná Fast Food"
                  fill
                  sizes="64px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5 py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-display text-base sm:text-lg font-black text-white leading-none tracking-tight truncate">
                  {BUSINESS.name}
                </h1>
                <StatusPill isOpen={isOpen} />
              </div>

              <div className="flex items-center gap-2 text-[11.5px] sm:text-xs leading-none">
                <span className="inline-flex items-center gap-1 text-white/90 font-semibold shrink-0">
                  <Clock
                    className="h-3.5 w-3.5 text-mana-yellow"
                    strokeWidth={2.4}
                  />
                  6 PM – 4 AM
                </span>
                <span className="text-white/25 select-none">•</span>
                <span className="text-white/70 truncate">
                  Hecho al{" "}
                  <span className="text-mana-yellow font-semibold">momento</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="border-t border-white/5 bg-black/30">
          <div className="container">
            <div
              className="flex items-center gap-0 py-2 text-[11.5px] text-white/80 overflow-x-auto whitespace-nowrap pr-4 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver ubicación en Google Maps"
                className="inline-flex items-center gap-1.5 px-2.5 font-semibold text-white/90 hover:text-white transition-colors shrink-0"
              >
                <MapPin
                  className="h-3.5 w-3.5 text-mana-yellow"
                  strokeWidth={2.2}
                />
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {BUSINESS.addressShort}
                </span>
                <ChevronRight className="h-3 w-3 text-white/40" />
              </a>
              <span className="text-white/25 select-none px-0.5">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 font-semibold shrink-0">
                <ScooterIcon className="h-3.5 w-3.5 text-mana-yellow" />
                Delivery y Pickup
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Vista desktop (lg+) — una sola fila, balanceada ====== */}
      <div className="hidden lg:block">
        <div className="container flex items-center gap-6 py-3.5">
          {/* Izquierda: logo + marca */}
          <Link
            href="/"
            aria-label="Ir al inicio Maná Fast Food"
            className="flex items-center gap-4 min-w-0 rounded-xl transition-transform active:scale-[0.98] hover:opacity-95 shrink-0"
          >
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full blur-xl opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,199,44,0.45) 0%, rgba(255,199,44,0.12) 45%, transparent 70%)",
                }}
              />
              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-mana-black ring-1 ring-mana-yellow/40 shadow-[0_4px_16px_rgba(255,199,44,0.18)]">
                <Image
                  src="/logo.png"
                  alt="Maná Fast Food"
                  fill
                  sizes="56px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-black text-white leading-none tracking-tight">
                {BUSINESS.name}
              </h1>
              <StatusPill isOpen={isOpen} />
            </div>
          </Link>

          {/* Tagline central — ocupa el hueco que antes quedaba vacío */}
          <p className="flex-1 text-center text-[13px] text-white/75 truncate">
            Hecho al{" "}
            <span className="text-mana-yellow font-bold">momento</span>
            <span className="text-white/25 mx-2">•</span>
            <span className="text-white/60">Pedí y te llega calientico</span>
          </p>

          {/* Derecha: chips informativos (horario · dirección · delivery) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
              <Clock
                className="h-3.5 w-3.5 text-mana-yellow"
                strokeWidth={2.4}
              />
              6 PM – 4 AM
            </span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver ubicación en Google Maps"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-mana-yellow/40 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition"
            >
              <MapPin
                className="h-3.5 w-3.5 text-mana-yellow"
                strokeWidth={2.2}
              />
              <span className="max-w-[220px] truncate">
                {BUSINESS.addressShort}
              </span>
              <ChevronRight className="h-3 w-3 text-white/40" />
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mana-yellow/15 ring-1 ring-mana-yellow/40 px-3 py-1.5 text-xs font-bold text-mana-yellow">
              <ScooterIcon className="h-3.5 w-3.5" />
              Delivery y Pickup
            </span>
          </div>
        </div>
      </div>

      {/* Brand stripe común */}
      <div
        aria-hidden
        className="h-[2px] w-full bg-gradient-to-r from-mana-red via-mana-yellow to-mana-red opacity-80"
      />
    </header>
  );
}
