"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Wallet } from "lucide-react";

/**
 * Sub-navegación compartida entre las páginas de "Finanzas":
 *   · /admin/ventas  → Reportes de ventas (rango, KPIs, PDF)
 *   · /admin/caja    → Cierre de caja diario (cuadre físico)
 *
 * Mantener ambas bajo un mismo encabezado reduce la carga cognitiva del
 * empleado y libera espacio del nav principal (quedaron 4 pestañas en lugar de 5).
 */
export function FinanzasSubNav() {
  const pathname = usePathname() ?? "";
  const isVentas = pathname.startsWith("/admin/ventas");
  const isCaja = pathname.startsWith("/admin/caja");

  const tabs: Array<{
    href: string;
    label: string;
    hint: string;
    icon: typeof LineChart;
    active: boolean;
  }> = [
    {
      href: "/admin/ventas",
      label: "Reportes",
      hint: "Ventas por rango, margen y PDF",
      icon: LineChart,
      active: isVentas,
    },
    {
      href: "/admin/caja",
      label: "Cierre de caja",
      hint: "Cuadre físico del día",
      icon: Wallet,
      active: isCaja,
    },
  ];

  return (
    <div className="rounded-full bg-white ring-1 ring-black/5 shadow-sm p-1 inline-flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap",
              t.active
                ? "bg-mana-red text-white shadow-sm"
                : "text-mana-ink hover:bg-mana-cream-dark",
            ].join(" ")}
            title={t.hint}
            aria-current={t.active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
