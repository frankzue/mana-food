"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Settings,
  ListOrdered,
  LineChart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdminBell } from "./AdminBell";

type Props = {
  email: string | null | undefined;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activePrefix: string;
};

type NavItemWithAliases = NavItem & {
  /** Otros prefijos que también deben activar este item (ej. Finanzas engloba Ventas y Caja). */
  alsoActiveOn?: string[];
};

const NAV: NavItemWithAliases[] = [
  {
    href: "/admin",
    label: "Pedidos",
    icon: ListOrdered,
    activePrefix: "/admin",
  },
  {
    // "Finanzas" agrupa Ventas (reportes) y Caja (cierre diario): son el mismo
    // tema (dinero) y comparten sub-navegación en sus páginas.
    // Por defecto lleva a Ventas, que es la vista más usada.
    href: "/admin/ventas",
    label: "Finanzas",
    icon: LineChart,
    activePrefix: "/admin/ventas",
    alsoActiveOn: ["/admin/caja"],
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    icon: Users,
    activePrefix: "/admin/clientes",
  },
  {
    href: "/admin/settings",
    label: "Config",
    icon: Settings,
    activePrefix: "/admin/settings",
  },
];

export function AdminHeader({ email }: Props) {
  const pathname = usePathname() ?? "";

  // "Pedidos" (/admin) solo queda activo cuando NO estamos en subrutas
  function isActive(item: NavItemWithAliases): boolean {
    if (item.href === "/admin") {
      return pathname === "/admin";
    }
    if (pathname.startsWith(item.activePrefix)) return true;
    if (item.alsoActiveOn?.some((p) => pathname.startsWith(p))) return true;
    return false;
  }

  return (
    <header className="sticky top-0 z-40 bg-mana-black text-white shadow-mana-soft print:hidden">
      <div className="container flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-mana-black ring-2 ring-mana-yellow/40">
            <Image
              src="/logo.png"
              alt="Maná"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-display text-lg font-black truncate">
              <span className="text-mana-red">MANÁ</span>{" "}
              <span className="text-mana-yellow">Panel</span>
            </h1>
            <p className="text-[11px] text-white/60 truncate">
              Pedidos en tiempo real
            </p>
          </div>
          {/* Campana de pendientes: nuevos + pagos/entregas olvidadas.
              Se renderiza al lado del logo para ser lo primero que ve el
              trabajador al abrir el panel. */}
          <AdminBell />
        </div>

        {/* Nav compacta:
            - En móvil, sólo la pestaña ACTIVA muestra su etiqueta (el resto
              quedan como iconos redondos). Así caben 4 pestañas + Salir en un
              Samsung S23+ sin cortarse.
            - En desktop (sm:) todas muestran icono + texto como siempre. */}
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition ring-1 whitespace-nowrap",
                  active
                    ? "bg-mana-yellow text-mana-ink ring-mana-yellow px-3"
                    : "bg-white/10 text-white ring-white/20 hover:bg-white/15 px-2 sm:px-3",
                ].join(" ")}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span
                  className={active ? "" : "hidden sm:inline"}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <form action="/admin/logout" method="POST" className="ml-0.5 sm:ml-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-2 sm:px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
              title={email ? `Salir (${email})` : "Salir"}
              aria-label="Salir"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
