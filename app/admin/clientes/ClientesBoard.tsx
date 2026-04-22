"use client";

import { useMemo, useState } from "react";
import type { Pedido } from "@/types/database";
import { formatUSD } from "@/lib/utils";
import {
  Search,
  Crown,
  Phone,
  Calendar,
  ShoppingBag,
  TrendingUp,
  MessageCircle,
  X,
  Users,
} from "lucide-react";

type Props = {
  pedidos: Pedido[];
};

type Cliente = {
  telefono: string;
  nombre: string;
  pedidos: number;
  ventasBrutas: number;
  ventasNetas: number;
  propinas: number;
  devueltos: number;
  cancelados: number;
  primerPedido: string;
  ultimoPedido: string;
  ticketPromedio: number;
  metodosPago: string[];
};

function normalizePhone(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").replace(/^58/, "0");
}

function ltvScore(c: Cliente): number {
  return c.ventasNetas;
}

function daysAgo(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function ClientesBoard({ pedidos }: Props) {
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState<"ltv" | "pedidos" | "reciente">("ltv");
  const [selected, setSelected] = useState<string | null>(null);

  const clientes = useMemo<Cliente[]>(() => {
    const map = new Map<string, Cliente>();
    for (const p of pedidos) {
      const tel = normalizePhone(p.cliente_telefono);
      if (!tel) continue;
      const isRefunded = p.estado === "devuelto";
      const isCanceled = p.estado === "cancelado";
      const refundUsd = isRefunded
        ? p.devuelto_monto_usd != null
          ? Number(p.devuelto_monto_usd)
          : Number(p.total_usd)
        : 0;

      const prev = map.get(tel);
      if (!prev) {
        map.set(tel, {
          telefono: tel,
          nombre: p.cliente_nombre,
          pedidos: 1,
          ventasBrutas: isCanceled ? 0 : Number(p.total_usd),
          ventasNetas: isCanceled
            ? 0
            : Number(p.total_usd) - refundUsd,
          propinas: Number(p.propina_usd ?? 0),
          devueltos: isRefunded ? 1 : 0,
          cancelados: isCanceled ? 1 : 0,
          primerPedido: p.created_at,
          ultimoPedido: p.created_at,
          ticketPromedio: 0,
          metodosPago: [p.metodo_pago],
        });
      } else {
        prev.pedidos += 1;
        if (!isCanceled) {
          prev.ventasBrutas += Number(p.total_usd);
          prev.ventasNetas += Number(p.total_usd) - refundUsd;
        }
        prev.propinas += Number(p.propina_usd ?? 0);
        if (isRefunded) prev.devueltos += 1;
        if (isCanceled) prev.cancelados += 1;
        // `pedidos` viene ordenado desc, así que primer elemento es el más reciente
        if (new Date(p.created_at) < new Date(prev.primerPedido)) {
          prev.primerPedido = p.created_at;
        }
        if (new Date(p.created_at) > new Date(prev.ultimoPedido)) {
          prev.ultimoPedido = p.created_at;
        }
        if (!prev.metodosPago.includes(p.metodo_pago)) {
          prev.metodosPago.push(p.metodo_pago);
        }
        // El nombre más reciente se queda (más actualizado)
        if (new Date(p.created_at) >= new Date(prev.ultimoPedido)) {
          prev.nombre = p.cliente_nombre;
        }
      }
    }
    const arr = Array.from(map.values()).map((c) => ({
      ...c,
      ticketPromedio: c.pedidos > 0 ? c.ventasBrutas / c.pedidos : 0,
    }));
    return arr;
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = clientes;
    if (q) {
      arr = arr.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.telefono.includes(q.replace(/\D/g, ""))
      );
    }
    if (orden === "ltv") {
      arr = [...arr].sort((a, b) => ltvScore(b) - ltvScore(a));
    } else if (orden === "pedidos") {
      arr = [...arr].sort((a, b) => b.pedidos - a.pedidos);
    } else {
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.ultimoPedido).getTime() -
          new Date(a.ultimoPedido).getTime()
      );
    }
    return arr;
  }, [clientes, search, orden]);

  const globales = useMemo(() => {
    const total = clientes.length;
    const recurrentes = clientes.filter((c) => c.pedidos >= 2).length;
    const vip = clientes.filter((c) => c.pedidos >= 5).length;
    const top = clientes
      .slice()
      .sort((a, b) => b.ventasNetas - a.ventasNetas)[0];
    return { total, recurrentes, vip, top };
  }, [clientes]);

  const selectedCliente = useMemo(
    () =>
      selected ? clientes.find((c) => c.telefono === selected) ?? null : null,
    [selected, clientes]
  );

  const pedidosDelSeleccionado = useMemo(() => {
    if (!selected) return [];
    return pedidos.filter(
      (p) => normalizePhone(p.cliente_telefono) === selected
    );
  }, [selected, pedidos]);

  return (
    <div className="space-y-5">
      {/* KPIs globales */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiSmall
          icon={<Users className="h-4 w-4" />}
          label="Clientes"
          value={String(globales.total)}
        />
        <KpiSmall
          icon={<TrendingUp className="h-4 w-4" />}
          label="Recurrentes"
          value={String(globales.recurrentes)}
          sub="2+ pedidos"
        />
        <KpiSmall
          icon={<Crown className="h-4 w-4" />}
          label="VIP"
          value={String(globales.vip)}
          sub="5+ pedidos"
        />
        <KpiSmall
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Mejor cliente"
          value={
            globales.top ? formatUSD(globales.top.ventasNetas) : "—"
          }
          sub={globales.top?.nombre}
        />
      </section>

      {/* Filtros */}
      <section className="card-mana p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-mana-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-mana pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { id: "ltv", label: "Mayor gasto" },
                { id: "pedidos", label: "Más pedidos" },
                { id: "reciente", label: "Más recientes" },
              ] as const
            ).map((o) => {
              const active = orden === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOrden(o.id)}
                  className={[
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1",
                    active
                      ? "bg-mana-red text-white ring-mana-red shadow-mana"
                      : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                  ].join(" ")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabla de clientes */}
      {filtrados.length === 0 ? (
        <div className="card-mana py-16 text-center">
          <Users className="h-8 w-8 mx-auto text-mana-muted mb-2" />
          <p className="font-display font-bold text-mana-ink">
            {search ? "Sin resultados" : "Aún no hay clientes"}
          </p>
          <p className="text-sm text-mana-muted mt-1">
            {search
              ? "Prueba otro nombre o número."
              : "Cuando llegue el primer pedido, lo verás aquí."}
          </p>
        </div>
      ) : (
        <section className="card-mana p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mana-cream-dark text-mana-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Cliente</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">
                    Teléfono
                  </th>
                  <th className="text-center px-3 py-2">Pedidos</th>
                  <th className="text-right px-3 py-2 hidden md:table-cell">
                    Ticket prom.
                  </th>
                  <th className="text-right px-3 py-2">Total gastado</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">
                    Último
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.slice(0, 500).map((c, i) => {
                  const isVip = c.pedidos >= 5;
                  const dLast = daysAgo(c.ultimoPedido);
                  return (
                    <tr
                      key={c.telefono}
                      className="border-t border-black/5 hover:bg-mana-cream/50 cursor-pointer transition"
                      onClick={() => setSelected(c.telefono)}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {i === 0 && orden === "ltv" && (
                            <Crown className="h-3.5 w-3.5 text-mana-yellow shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-mana-ink truncate inline-flex items-center gap-1">
                              {c.nombre}
                              {isVip && (
                                <span className="chip bg-mana-yellow/30 text-mana-ink text-[9px] px-1.5 py-0">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-mana-muted sm:hidden">
                              {c.telefono}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-mana-muted">
                        {c.telefono}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-mana-ink">
                        {c.pedidos}
                        {c.devueltos > 0 && (
                          <div className="text-[10px] text-orange-600">
                            {c.devueltos} dev.
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell text-mana-ink">
                        {formatUSD(c.ticketPromedio)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="font-bold text-mana-red">
                          {formatUSD(c.ventasNetas)}
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <div className="text-xs text-mana-ink">
                          {new Date(c.ultimoPedido).toLocaleDateString(
                            "es-VE"
                          )}
                        </div>
                        <div className="text-[10px] text-mana-muted">
                          hace {dLast}d
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Drawer detalle cliente */}
      {selectedCliente && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setSelected(null)}
        >
          <aside
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-mana-glow overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between">
              <h3 className="font-display font-black text-mana-ink truncate">
                {selectedCliente.nombre}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-mana-cream rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-mana-red" />
                <a
                  href={`https://wa.me/${selectedCliente.telefono.replace(
                    /^0/,
                    "58"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mana-ink font-mono hover:text-mana-red inline-flex items-center gap-1"
                >
                  {selectedCliente.telefono}
                  <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Total gastado"
                  value={formatUSD(selectedCliente.ventasNetas)}
                />
                <MiniStat
                  label="Pedidos"
                  value={String(selectedCliente.pedidos)}
                />
                <MiniStat
                  label="Ticket prom."
                  value={formatUSD(selectedCliente.ticketPromedio)}
                />
                <MiniStat
                  label="Propinas dadas"
                  value={formatUSD(selectedCliente.propinas)}
                />
              </div>

              <div className="text-xs text-mana-muted space-y-1">
                <div className="flex justify-between">
                  <span>Primer pedido</span>
                  <span>
                    {new Date(selectedCliente.primerPedido).toLocaleDateString(
                      "es-VE"
                    )}{" "}
                    (hace {daysAgo(selectedCliente.primerPedido)}d)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Último pedido</span>
                  <span>
                    {new Date(selectedCliente.ultimoPedido).toLocaleDateString(
                      "es-VE"
                    )}{" "}
                    (hace {daysAgo(selectedCliente.ultimoPedido)}d)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Métodos usados</span>
                  <span className="text-right truncate max-w-[60%]">
                    {selectedCliente.metodosPago.join(", ")}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-mana-ink mb-2 text-sm">
                  Historial
                </h4>
                <ul className="space-y-1.5">
                  {pedidosDelSeleccionado.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-mana-cream p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-mana-ink">
                          #{String(p.numero).padStart(4, "0")}
                        </div>
                        <div className="text-mana-muted inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.created_at).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                          <span className="ml-1 chip bg-white text-mana-muted text-[9px] px-1.5 py-0">
                            {p.estado}
                          </span>
                        </div>
                      </div>
                      <div className="font-bold text-mana-ink shrink-0">
                        {formatUSD(Number(p.total_usd))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}

      <p className="text-center text-[11px] text-mana-muted">
        {clientes.length} clientes · {pedidos.length} pedidos analizados
      </p>
    </div>
  );
}

function KpiSmall({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-mana p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-mana-red/10 text-mana-red">
          {icon}
        </span>
        <span className="text-[11px] font-semibold text-mana-muted uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="font-display text-xl font-black text-mana-ink mt-1">
        {value}
      </div>
      {sub && <p className="text-[11px] text-mana-muted truncate">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-mana-cream p-3">
      <div className="text-[10px] text-mana-muted uppercase tracking-wide font-semibold">
        {label}
      </div>
      <div className="font-display font-bold text-mana-ink text-base">
        {value}
      </div>
    </div>
  );
}
