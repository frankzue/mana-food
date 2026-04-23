"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Pedido } from "@/types/database";

/**
 * Campana de pendientes en el header del admin.
 *
 * Monitorea en tiempo real los pedidos con atención requerida:
 *   · Nuevos sin contactar
 *   · Contactados sin confirmar pago (> 30 min)
 *   · Pagados sin marcar entregados (> 45 min)
 *
 * El badge rojo muestra el total. Al tocar la campana se abre un
 * popover con la lista y atajo directo a cada pedido.
 *
 * Fuente de datos: Supabase realtime sobre la tabla `pedidos`, igual
 * que el board principal. Así aparece un pendiente al instante sin
 * tener que abrir la pestaña de Pedidos.
 */

type Pendiente = {
  id: string;
  numero: number;
  cliente_nombre: string;
  created_at: string;
  estado: Pedido["estado"];
  tipo: "nuevo" | "pago_pendiente" | "entrega_pendiente";
};

const UMBRAL_PAGO_MIN = 30; // min tras "contactado" para avisar
const UMBRAL_ENTREGA_MIN = 45; // min tras "pagado" para avisar

export function AdminBell() {
  const [open, setOpen] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Cargar estado inicial + suscribirse a cambios
  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function load() {
      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .in("estado", ["nuevo", "contactado", "pagado"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (active) {
        setPedidos((data ?? []) as Pedido[]);
        setLoaded(true);
      }
    }
    load();

    const channel = supabase
      .channel("bell-pendientes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const p = payload.new as Pedido;
            setPedidos((prev) => [p, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const p = payload.new as Pedido;
            setPedidos((prev) =>
              prev.map((x) => (x.id === p.id ? { ...x, ...p } : x))
            );
          } else if (payload.eventType === "DELETE") {
            const p = payload.old as Pedido;
            setPedidos((prev) => prev.filter((x) => x.id !== p.id));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Refresca cada 60 s aunque no haya cambios en DB, para re-calcular
  // cuáles cruzaron el umbral de tiempo (pago/entrega pendientes).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const pendientes = useMemo<Pendiente[]>(() => {
    const now = Date.now();
    const out: Pendiente[] = [];
    for (const p of pedidos) {
      const createdMs = new Date(p.created_at).getTime();
      const minutos = Math.floor((now - createdMs) / 60_000);
      if (p.estado === "nuevo") {
        out.push({
          id: p.id,
          numero: p.numero,
          cliente_nombre: p.cliente_nombre,
          created_at: p.created_at,
          estado: p.estado,
          tipo: "nuevo",
        });
      } else if (p.estado === "contactado" && minutos >= UMBRAL_PAGO_MIN) {
        out.push({
          id: p.id,
          numero: p.numero,
          cliente_nombre: p.cliente_nombre,
          created_at: p.created_at,
          estado: p.estado,
          tipo: "pago_pendiente",
        });
      } else if (p.estado === "pagado" && minutos >= UMBRAL_ENTREGA_MIN) {
        out.push({
          id: p.id,
          numero: p.numero,
          cliente_nombre: p.cliente_nombre,
          created_at: p.created_at,
          estado: p.estado,
          tipo: "entrega_pendiente",
        });
      }
    }
    return out.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // `tick` fuerza recálculo periódico de minutos transcurridos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, tick]);

  const count = pendientes.length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${count} pendientes`}
        className={[
          "relative inline-flex items-center justify-center rounded-full h-9 w-9 ring-1 transition",
          count > 0
            ? "bg-mana-yellow text-mana-ink ring-mana-yellow hover:brightness-95"
            : "bg-white/10 text-white ring-white/20 hover:bg-white/15",
        ].join(" ")}
        title="Pendientes"
      >
        <Bell className={count > 0 ? "h-4 w-4" : "h-4 w-4 opacity-90"} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-mana-red text-white text-[10px] font-black leading-[18px] text-center ring-2 ring-mana-black">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pendientes"
          className="absolute right-0 mt-2 w-[86vw] max-w-sm rounded-2xl bg-white text-mana-ink shadow-mana-glow ring-1 ring-black/10 overflow-hidden z-50"
        >
          <div className="px-4 py-3 bg-mana-cream-dark border-b border-black/5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-mana-red" />
            <h3 className="font-display font-black text-sm">Pendientes</h3>
            <span className="ml-auto text-[11px] font-semibold text-mana-muted">
              {count} {count === 1 ? "recordatorio" : "recordatorios"}
            </span>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {!loaded ? (
              <div className="p-5 text-center text-sm text-mana-muted">
                Cargando…
              </div>
            ) : count === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-mana-success mx-auto mb-2" />
                <p className="font-bold text-sm">Todo al día</p>
                <p className="text-xs text-mana-muted mt-1">
                  No hay pedidos pendientes en este momento.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {pendientes.map((p) => (
                  <li key={p.id}>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-mana-cream transition"
                    >
                      <PendienteRow p={p} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PendienteRow({ p }: { p: Pendiente }) {
  const { icon, label, tone } = toneFor(p.tipo);
  const mins = Math.max(0, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 60_000));
  const hace =
    mins < 1 ? "ahora" : mins < 60 ? `hace ${mins} min` : `hace ${Math.floor(mins / 60)} h ${mins % 60} min`;

  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid place-items-center h-8 w-8 rounded-full shrink-0 ${tone.bg} ${tone.text}`}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-black text-sm">
            #{String(p.numero).padStart(4, "0")}
          </span>
          <span className="text-xs text-mana-muted truncate">
            · {p.cliente_nombre}
          </span>
        </div>
        <div className={`text-xs font-semibold ${tone.text}`}>{label}</div>
        <div className="text-[11px] text-mana-muted inline-flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" />
          {hace}
        </div>
      </div>
    </div>
  );
}

function toneFor(tipo: Pendiente["tipo"]) {
  switch (tipo) {
    case "nuevo":
      return {
        icon: <Bell className="h-4 w-4" />,
        label: "Nuevo pedido — contactar al cliente",
        tone: { bg: "bg-mana-red/10", text: "text-mana-red" },
      };
    case "pago_pendiente":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Esperando confirmación de pago",
        tone: { bg: "bg-amber-100", text: "text-amber-700" },
      };
    case "entrega_pendiente":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Pagado — falta marcar entregado",
        tone: { bg: "bg-blue-100", text: "text-blue-700" },
      };
  }
}
