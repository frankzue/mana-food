"use client";

import { useMemo, useState } from "react";
import type { Pedido, PedidoItem, EstadoPedido } from "@/types/database";
import { formatBs, formatUSD } from "@/lib/utils";
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Truck,
  Printer,
  Download,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Star,
} from "lucide-react";

type Props = {
  pedidos: Pedido[];
  itemsByPedido: Record<string, PedidoItem[]>;
  businessName: string;
};

type RangeKey = "hoy" | "ayer" | "semana" | "mes" | "3meses" | "todo" | "custom";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "3meses", label: "3 meses" },
  { key: "todo", label: "Todo" },
  { key: "custom", label: "Rango" },
];

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRangeDates(range: RangeKey, customFrom: string, customTo: string) {
  const now = new Date();
  switch (range) {
    case "hoy":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "ayer": {
      const y = addDays(now, -1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "semana":
      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
    case "mes":
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
    case "3meses":
      return { from: startOfDay(addDays(now, -89)), to: endOfDay(now) };
    case "todo":
      return { from: new Date(0), to: endOfDay(now) };
    case "custom":
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : new Date(0),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      };
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export function VentasDashboard({
  pedidos,
  itemsByPedido,
  businessName,
}: Props) {
  const [range, setRange] = useState<RangeKey>("hoy");
  const [customFrom, setCustomFrom] = useState<string>(
    toInputDate(addDays(new Date(), -7))
  );
  const [customTo, setCustomTo] = useState<string>(toInputDate(new Date()));
  const [incluirCancelados, setIncluirCancelados] = useState<boolean>(false);

  const { from, to } = getRangeDates(range, customFrom, customTo);

  const filtrados = useMemo(() => {
    return pedidos.filter((p) => {
      const d = new Date(p.created_at);
      if (d < from || d > to) return false;
      if (!incluirCancelados && p.estado === "cancelado") return false;
      return true;
    });
  }, [pedidos, from, to, incluirCancelados]);

  // KPIs
  const kpis = useMemo(() => {
    let ventas = 0;
    let envios = 0;
    let totalBs = 0;
    let completados = 0;
    let cancelados = 0;
    let enCurso = 0;
    for (const p of filtrados) {
      ventas += Number(p.total_usd);
      envios += Number(p.envio_usd);
      totalBs += Number(p.total_bs);
      if (p.estado === "completado") completados++;
      else if (p.estado === "cancelado") cancelados++;
      else enCurso++;
    }
    const pedidos_ = filtrados.length;
    const ticketPromedio = pedidos_ > 0 ? ventas / pedidos_ : 0;
    return {
      ventas,
      envios,
      totalBs,
      pedidos: pedidos_,
      completados,
      cancelados,
      enCurso,
      ticketPromedio,
    };
  }, [filtrados]);

  // Desglose por método de pago
  const porMetodo = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const p of filtrados) {
      const m = p.metodo_pago || "Otro";
      const curr = map.get(m) ?? { total: 0, count: 0 };
      curr.total += Number(p.total_usd);
      curr.count += 1;
      map.set(m, curr);
    }
    const arr = Array.from(map.entries()).map(([metodo, v]) => ({
      metodo,
      total: v.total,
      count: v.count,
      pct: kpis.ventas > 0 ? (v.total / kpis.ventas) * 100 : 0,
    }));
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [filtrados, kpis.ventas]);

  // Top productos
  const topProductos = useMemo(() => {
    const map = new Map<
      string,
      { nombre: string; cantidad: number; total: number }
    >();
    for (const p of filtrados) {
      const items = itemsByPedido[p.id] ?? [];
      for (const it of items) {
        // Usamos solo el nombre "base" antes de " · " (modificadores)
        const base = it.producto_nombre.split(" · ")[0] ?? it.producto_nombre;
        const curr = map.get(base) ?? { nombre: base, cantidad: 0, total: 0 };
        curr.cantidad += it.cantidad;
        curr.total += Number(it.subtotal_usd);
        map.set(base, curr);
      }
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.cantidad - a.cantidad);
    return arr.slice(0, 10);
  }, [filtrados, itemsByPedido]);

  // Ventas por día (para el rango)
  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtrados) {
      const d = new Date(p.created_at);
      const key = toInputDate(d);
      map.set(key, (map.get(key) ?? 0) + Number(p.total_usd));
    }
    const arr = Array.from(map.entries()).map(([fecha, total]) => ({
      fecha,
      total,
    }));
    arr.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return arr;
  }, [filtrados]);

  const maxDia = Math.max(1, ...porDia.map((d) => d.total));

  const rangoTexto = useMemo(() => {
    if (range === "todo") {
      if (filtrados.length === 0) return "Todo el histórico";
      const oldest = filtrados.reduce((a, b) =>
        new Date(a.created_at) < new Date(b.created_at) ? a : b
      );
      const newest = filtrados[0];
      return `${formatDateShort(oldest.created_at)} – ${formatDateShort(
        newest.created_at
      )}`;
    }
    return `${formatDateShort(from.toISOString())} – ${formatDateShort(
      to.toISOString()
    )}`;
  }, [range, filtrados, from, to]);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  function handleExportCsv() {
    const header = [
      "numero",
      "fecha",
      "cliente",
      "telefono",
      "zona",
      "metodo_pago",
      "estado",
      "subtotal_usd",
      "envio_usd",
      "total_usd",
      "total_bs",
      "tasa_bs",
      "productos",
      "notas",
    ];
    const lines = [header.join(",")];
    for (const p of filtrados) {
      const items = itemsByPedido[p.id] ?? [];
      const prods = items
        .map((i) => `${i.cantidad}x ${i.producto_nombre}`)
        .join(" | ");
      const row = [
        String(p.numero),
        new Date(p.created_at).toISOString(),
        p.cliente_nombre,
        p.cliente_telefono,
        p.zona_nombre,
        p.metodo_pago,
        p.estado,
        String(p.subtotal_usd),
        String(p.envio_usd),
        String(p.total_usd),
        String(p.total_bs),
        String(p.tasa_bs),
        prods,
        (p.notas ?? "").replace(/\s+/g, " ").trim(),
      ].map((cell) => {
        const s = String(cell ?? "");
        // Escapa comillas y envuelve en comillas si tiene coma, comilla o salto
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      });
      lines.push(row.join(","));
    }
    const csv = "\ufeff" + lines.join("\n"); // BOM para Excel con acentos
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${toInputDate(from)}_a_${toInputDate(to)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Cabecera solo para imprimir */}
      <div className="hidden print:block pb-3 border-b border-black/20">
        <h1 className="font-display text-2xl font-black">
          {businessName} — Reporte de ventas
        </h1>
        <p className="text-sm">
          {rangoTexto} · Generado el{" "}
          {new Date().toLocaleString("es-VE")}
        </p>
      </div>

      {/* Filtros (ocultos al imprimir) */}
      <section className="card-mana p-4 sm:p-5 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r) => {
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={[
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1",
                    active
                      ? "bg-mana-red text-white ring-mana-red shadow-mana"
                      : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                  ].join(" ")}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-mana-muted cursor-pointer">
            <input
              type="checkbox"
              checked={incluirCancelados}
              onChange={(e) => setIncluirCancelados(e.target.checked)}
              className="h-4 w-4 rounded text-mana-red"
            />
            Incluir cancelados
          </label>
        </div>

        {range === "custom" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-mana-ink">
              Desde
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-mana mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-mana-ink">
              Hasta
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-mana mt-1"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-mana-muted inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {rangoTexto}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              disabled={filtrados.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/10 px-3 py-1.5 text-xs font-semibold text-mana-ink hover:ring-mana-red/40 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={filtrados.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-mana-yellow text-mana-ink px-3 py-1.5 text-xs font-semibold ring-1 ring-mana-yellow hover:brightness-95 transition disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<DollarSign className="h-5 w-5" />}
          label="Ventas brutas"
          value={formatUSD(kpis.ventas)}
          sub={`≈ ${formatBs(kpis.totalBs)}`}
          tone="red"
        />
        <Kpi
          icon={<Receipt className="h-5 w-5" />}
          label="Pedidos"
          value={String(kpis.pedidos)}
          sub={`${kpis.completados} completados · ${kpis.enCurso} en curso${
            incluirCancelados ? ` · ${kpis.cancelados} cancelados` : ""
          }`}
          tone="ink"
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Ticket promedio"
          value={formatUSD(kpis.ticketPromedio)}
          sub="Por pedido"
          tone="yellow"
        />
        <Kpi
          icon={<Truck className="h-5 w-5" />}
          label="Envíos cobrados"
          value={formatUSD(kpis.envios)}
          sub="Incluido en ventas"
          tone="ink"
        />
      </section>

      {filtrados.length === 0 ? (
        <div className="card-mana py-16 text-center">
          <CalendarDays className="h-8 w-8 mx-auto text-mana-muted mb-2" />
          <p className="font-display font-bold text-mana-ink">
            No hay pedidos en este rango
          </p>
          <p className="text-sm text-mana-muted mt-1">
            Ajusta el filtro o espera a recibir pedidos.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico simple por día */}
          {porDia.length > 1 && (
            <section className="card-mana p-4 sm:p-5">
              <h3 className="font-display font-bold text-mana-ink">
                Ventas por día
              </h3>
              <div className="mt-3 flex items-end gap-1 h-32">
                {porDia.map((d) => {
                  const pct = (d.total / maxDia) * 100;
                  return (
                    <div
                      key={d.fecha}
                      className="flex-1 min-w-[8px] relative group"
                      title={`${d.fecha}: ${formatUSD(d.total)}`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t bg-mana-red transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-mana-muted mt-1">
                <span>{porDia[0]?.fecha}</span>
                <span>{porDia[porDia.length - 1]?.fecha}</span>
              </div>
            </section>
          )}

          {/* Desglose por método de pago + Top productos */}
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="card-mana p-4 sm:p-5">
              <h3 className="font-display font-bold text-mana-ink">
                Desglose por método de pago
              </h3>
              <ul className="mt-3 space-y-2.5">
                {porMetodo.map((m) => (
                  <li key={m.metodo} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-mana-ink">
                        {m.metodo}
                      </span>
                      <span className="text-mana-ink font-bold">
                        {formatUSD(m.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-mana-cream-dark overflow-hidden">
                        <div
                          className="h-full bg-mana-red"
                          style={{ width: `${m.pct.toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-mana-muted w-20 text-right">
                        {m.count} pedidos · {m.pct.toFixed(0)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-mana p-4 sm:p-5">
              <h3 className="font-display font-bold text-mana-ink flex items-center gap-1.5">
                <Star className="h-4 w-4 text-mana-yellow" />
                Productos más vendidos
              </h3>
              <ul className="mt-3 space-y-1.5">
                {topProductos.map((p, idx) => (
                  <li
                    key={p.nombre}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-mana-ink">
                      <strong className="text-mana-red">#{idx + 1}</strong>{" "}
                      {p.nombre}{" "}
                      <span className="text-mana-muted">
                        × {p.cantidad}
                      </span>
                    </span>
                    <span className="text-mana-ink font-semibold shrink-0">
                      {formatUSD(p.total)}
                    </span>
                  </li>
                ))}
                {topProductos.length === 0 && (
                  <li className="text-sm text-mana-muted">Sin datos</li>
                )}
              </ul>
            </div>
          </section>

          {/* Por estado */}
          <section className="grid gap-3 sm:grid-cols-3 print:hidden">
            <StatusCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Completados"
              count={kpis.completados}
              color="bg-mana-success"
            />
            <StatusCard
              icon={<Clock className="h-4 w-4" />}
              label="En curso"
              count={kpis.enCurso}
              color="bg-mana-yellow text-mana-ink"
            />
            <StatusCard
              icon={<XCircle className="h-4 w-4" />}
              label="Cancelados"
              count={kpis.cancelados}
              color="bg-mana-muted"
            />
          </section>

          {/* Tabla de pedidos */}
          <section className="card-mana p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-black/5">
              <h3 className="font-display font-bold text-mana-ink">
                Detalle de pedidos ({filtrados.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mana-cream-dark text-mana-muted text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-left px-3 py-2">Cliente</th>
                    <th className="text-left px-3 py-2 hidden sm:table-cell">
                      Zona
                    </th>
                    <th className="text-left px-3 py-2">Método</th>
                    <th className="text-left px-3 py-2">Estado</th>
                    <th className="text-right px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-black/5 hover:bg-mana-cream/50 transition"
                    >
                      <td className="px-3 py-2 font-bold text-mana-red">
                        #{String(p.numero).padStart(4, "0")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-mana-muted">
                        {formatDateTime(p.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-mana-ink">
                          {p.cliente_nombre}
                        </div>
                        <div className="text-[11px] text-mana-muted inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {p.cliente_telefono}
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-mana-muted">
                        {p.zona_nombre}
                      </td>
                      <td className="px-3 py-2 text-mana-ink">
                        {p.metodo_pago}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={[
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            p.estado === "completado"
                              ? "bg-mana-success/15 text-mana-success"
                              : p.estado === "cancelado"
                              ? "bg-red-100 text-red-700"
                              : "bg-mana-yellow/20 text-mana-ink",
                          ].join(" ")}
                        >
                          {ESTADO_LABEL[p.estado]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="font-bold text-mana-ink">
                          {formatUSD(Number(p.total_usd))}
                        </div>
                        <div className="text-[10px] text-mana-muted">
                          {formatBs(Number(p.total_bs))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-mana-cream-dark">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-2 text-right text-xs font-semibold text-mana-muted"
                    >
                      Total del rango
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-display font-black text-mana-red">
                        {formatUSD(kpis.ventas)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="text-center text-[11px] text-mana-muted print:hidden">
        Los pedidos se guardan permanentemente en la base de datos. Mostrando
        hasta {Math.min(pedidos.length, 5000)} pedidos recientes.
      </p>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "red" | "yellow" | "ink";
}) {
  const toneClass =
    tone === "red"
      ? "bg-mana-red text-white"
      : tone === "yellow"
      ? "bg-mana-yellow text-mana-ink"
      : "bg-mana-black text-white";
  return (
    <div className="card-mana p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${toneClass}`}
        >
          {icon}
        </span>
        <span className="text-xs font-semibold text-mana-muted uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-black text-mana-ink mt-2">
        {value}
      </div>
      {sub && <p className="text-[11px] text-mana-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="card-mana p-4 flex items-center gap-3">
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white ${color}`}
      >
        {icon}
      </span>
      <div>
        <div className="font-display text-xl font-black text-mana-ink">
          {count}
        </div>
        <div className="text-xs text-mana-muted">{label}</div>
      </div>
    </div>
  );
}
