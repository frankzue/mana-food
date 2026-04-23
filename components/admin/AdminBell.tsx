"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Clock, AlertTriangle, CheckCircle2, Banknote } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Pedido } from "@/types/database";
import {
  shouldAlertStaleTasaBcV,
  tasaBcVReminderMessage,
} from "@/lib/utils/bcv-tasa-reminder";

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
 * Además, lun–vie después de las 16:00 (hora Caracas), si la tasa BCV no
 * se ha actualizado hoy (valor distinto guardado en configuración), se
 * añade un recordatorio con enlace a Configuración. Fin de semana no avisa.
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
  const [ultimaTasaIso, setUltimaTasaIso] = useState<string | null>(null);
  const [tasaMetaLoaded, setTasaMetaLoaded] = useState(false);
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

    async function loadTasaMeta() {
      const { data } = await supabase
        .from("configuracion")
        .select("value")
        .eq("key", "tasa_bs_ultima_actualizacion")
        .maybeSingle();
      if (active) {
        setUltimaTasaIso(data?.value?.trim() ?? null);
        setTasaMetaLoaded(true);
      }
    }
    loadTasaMeta();

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracion" },
        (payload) => {
          const row = payload.new as { key?: string; value?: string } | null;
          if (row?.key === "tasa_bs_ultima_actualizacion" && row.value != null) {
            setUltimaTasaIso(String(row.value).trim());
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

  const tasaStale =
    tasaMetaLoaded && shouldAlertStaleTasaBcV(new Date(), ultimaTasaIso);
  const count = pendientes.length + (tasaStale ? 1 : 0);
  const allLoaded = loaded && tasaMetaLoaded;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${count} pendientes`}
        aria-expanded={open}
        className={[
          "relative inline-flex items-center justify-center rounded-full h-9 w-9 ring-1 transition",
          count > 0
            ? "bg-mana-yellow text-mana-ink ring-mana-yellow hover:brightness-95"
            : "bg-white/10 text-white ring-white/20 hover:bg-white/15",
        ].join(" ")}
        title="Pendientes"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-mana-red text-white text-[10px] font-black leading-[18px] text-center ring-2 ring-mana-black">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Popover
          - En móvil se fija al viewport con márgenes laterales (left-3 / right-3)
            para que nunca se salga de pantalla.
          - En sm: vuelve a anclarse a la izquierda del botón (crece hacia la
            derecha, donde sobra espacio en el header). */}
      {open && (
        <div
          role="dialog"
          aria-label="Pendientes"
          className="fixed left-3 right-3 top-[64px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-[22rem] rounded-2xl bg-white text-mana-ink shadow-2xl ring-1 ring-black/5 overflow-hidden z-50"
        >
          <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-mana-ink">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-black text-sm leading-tight">
                Pendientes
              </h3>
              <p className="text-[11px] text-gray-500 leading-tight">
                {count === 0
                  ? "Al día"
                  : `${count} ${count === 1 ? "recordatorio" : "recordatorios"}`}
              </p>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto bg-white">
            {!allLoaded ? (
              <div className="p-6 text-center text-sm text-gray-400">
                Cargando…
              </div>
            ) : count === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="font-bold text-sm text-mana-ink">Todo al día</p>
                <p className="text-xs text-gray-500 mt-1">
                  No hay pedidos pendientes en este momento.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {tasaStale && (
                  <li key="tasa-bcv-reminder">
                    <Link
                      href="/admin/settings#config-tasa-bcv"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-violet-50/80 transition bg-violet-50/40"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid place-items-center h-9 w-9 rounded-full shrink-0 ring-1 bg-violet-100 text-violet-800 ring-violet-200">
                          <Banknote className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-black text-sm text-mana-ink">
                            Tasa BCV del día
                          </div>
                          <p className="text-[12.5px] font-semibold text-violet-800 mt-0.5 leading-snug">
                            Aún no actualizada hoy (hora Caracas). Revisa después de la publicación del
                            BCV (lun–vie ~15:00–16:00).
                          </p>
                          <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                            {tasaBcVReminderMessage()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )}
                {pendientes.map((p) => (
                  <li key={p.id}>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <PendienteRow p={p} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {count > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2 flex flex-col gap-1.5 text-center">
              {tasaStale && (
                <Link
                  href="/admin/settings#config-tasa-bcv"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-bold text-violet-700 hover:underline"
                >
                  Ir a Configuración · Tasa BCV →
                </Link>
              )}
              {pendientes.length > 0 && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-bold text-mana-red hover:underline"
                >
                  Ver todos los pedidos →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PendienteRow({ p }: { p: Pendiente }) {
  const { icon, label, tone } = toneFor(p.tipo);
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(p.created_at).getTime()) / 60_000)
  );
  const hace =
    mins < 1
      ? "ahora"
      : mins < 60
        ? `hace ${mins} min`
        : `hace ${Math.floor(mins / 60)} h ${mins % 60} min`;

  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid place-items-center h-9 w-9 rounded-full shrink-0 ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-sm text-mana-ink">
            #{String(p.numero).padStart(4, "0")}
          </span>
          <span className="text-xs text-gray-600 truncate">
            {p.cliente_nombre}
          </span>
          <span className="ml-auto text-[10px] text-gray-400 inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {hace}
          </span>
        </div>
        <div className={`text-[12.5px] font-semibold mt-0.5 ${tone.text}`}>
          {label}
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
        label: "Contactar al cliente",
        tone: {
          bg: "bg-rose-50",
          text: "text-rose-600",
          ring: "ring-rose-100",
        },
      };
    case "pago_pendiente":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Esperando confirmación de pago",
        tone: {
          bg: "bg-amber-50",
          text: "text-amber-700",
          ring: "ring-amber-100",
        },
      };
    case "entrega_pendiente":
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Pagado · falta marcar entregado",
        tone: {
          bg: "bg-sky-50",
          text: "text-sky-700",
          ring: "ring-sky-100",
        },
      };
  }
}
