"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Settings,
  ListOrdered,
  LineChart,
  type LucideIcon,
} from "lucide-react";

type Props = {
  email: string | null | undefined;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activePrefix: string;
};

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Pedidos",
    icon: ListOrdered,
    activePrefix: "/admin",
  },
  {
    href: "/admin/ventas",
    label: "Ventas",
    icon: LineChart,
    activePrefix: "/admin/ventas",
  },
  {
    href: "/admin/settings",
    label: "Config.",
    icon: Settings,
    activePrefix: "/admin/settings",
  },
];

export function AdminHeader({ email }: Props) {
  const pathname = usePathname() ?? "";

  // "Pedidos" (/admin) solo queda activo cuando NO estamos en subrutas
  function isActive(item: NavItem): boolean {
    if (item.href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(item.activePrefix);
  }

  return (
    <header className="sticky top-0 z-40 bg-mana-black text-white shadow-mana-soft print:hidden">
      <div className="container flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3 min-w-0">
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
        </div>

        <nav className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 whitespace-nowrap",
                  active
                    ? "bg-mana-yellow text-mana-ink ring-mana-yellow"
                    : "bg-white/10 text-white ring-white/20 hover:bg-white/15",
                ].join(" ")}
                title={item.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <form action="/admin/logout" method="POST" className="ml-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
              title={email ?? "Salir"}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
