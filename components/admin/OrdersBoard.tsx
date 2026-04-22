"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  PedidoConItems,
  Pedido,
  PedidoItem,
  EstadoPedido,
} from "@/types/database";
import type { PaymentDetails } from "@/lib/utils/whatsapp";
import { OrderCard } from "./OrderCard";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, RefreshCw, PartyPopper, X } from "lucide-react";
import { formatUSD } from "@/lib/utils";

type Props = {
  initialPedidos: PedidoConItems[];
  businessName: string;
  payment: PaymentDetails;
};

const FILTERS: { key: EstadoPedido | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "nuevo", label: "Nuevos" },
  { key: "contactado", label: "Contactados" },
  { key: "completado", label: "Completados" },
  { key: "cancelado", label: "Cancelados" },
];

type Toast = {
  id: string;
  numero: number;
  cliente: string;
  total: number;
};

export function OrdersBoard({
  initialPedidos,
  businessName,
  payment,
}: Props) {
  const [pedidos, setPedidos] = useState<PedidoConItems[]>(initialPedidos);
  const [filter, setFilter] = useState<EstadoPedido | "todos">("todos");
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");
  const titleBlinkRef = useRef<number | null>(null);
  const originalTitleRef = useRef<string>("");

  useEffect(() => {
    setPedidos(initialPedidos);
  }, [initialPedidos]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title;
    }
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("realtime-pedidos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        async (payload) => {
          const nuevo = payload.new as Pedido;
          const { data: items } = await supabase
            .from("pedido_items")
            .select("*")
            .eq("pedido_id", nuevo.id);

          const full: PedidoConItems = {
            ...nuevo,
            items: (items ?? []) as PedidoItem[],
          };

          setPedidos((prev) => [full, ...prev]);
          if (soundOn) playAlertPattern();
          setFlash(true);
          setTimeout(() => setFlash(false), 1500);

          const t: Toast = {
            id: nuevo.id,
            numero: nuevo.numero,
            cliente: nuevo.cliente_nombre,
            total: Number(nuevo.total_usd),
          };
          setToast(t);
          setTimeout(
            () => setToast((curr) => (curr?.id === t.id ? null : curr)),
            8000
          );

          notifyDesktop(t);
          startTitleBlink(t.numero);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        (payload) => {
          const upd = payload.new as Pedido;
          setPedidos((prev) =>
            prev.map((p) =>
              p.id === upd.id ? { ...p, ...upd, items: p.items } : p
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedido_items" },
        (payload) => {
          const it = payload.new as PedidoItem;
          setPedidos((prev) =>
            prev.map((p) =>
              p.id === it.pedido_id
                ? {
                    ...p,
                    items: p.items.find((x) => x.id === it.id)
                      ? p.items
                      : [...p.items, it],
                  }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopTitleBlink();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  // Parar el título parpadeando cuando el admin vuelve a la pestaña
  useEffect(() => {
    function onFocus() {
      stopTitleBlink();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function startTitleBlink(numero: number) {
    if (typeof document === "undefined") return;
    stopTitleBlink();
    if (!document.hidden) return; // solo parpadea si no está mirando la pestaña
    let toggle = false;
    const base = originalTitleRef.current || document.title;
    const alt = `🔔 Nuevo pedido #${String(numero).padStart(4, "0")} · ${base}`;
    titleBlinkRef.current = window.setInterval(() => {
      document.title = toggle ? base : alt;
      toggle = !toggle;
    }, 900) as unknown as number;
  }

  function stopTitleBlink() {
    if (titleBlinkRef.current !== null) {
      window.clearInterval(titleBlinkRef.current);
      titleBlinkRef.current = null;
    }
    if (originalTitleRef.current && typeof document !== "undefined") {
      document.title = originalTitleRef.current;
    }
  }

  async function requestNotif() {
    if (typeof Notification === "undefined") return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    } catch {
      // silent
    }
  }

  function notifyDesktop(t: Toast) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(`🔔 Nuevo pedido #${String(t.numero).padStart(4, "0")}`, {
        body: `${t.cliente} · ${formatUSD(t.total)} — ${businessName}`,
        tag: `pedido-${t.id}`,
      });
    } catch {
      // silent
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: pedidos.length };
    for (const p of pedidos) c[p.estado] = (c[p.estado] ?? 0) + 1;
    return c;
  }, [pedidos]);

  const visible =
    filter === "todos" ? pedidos : pedidos.filter((p) => p.estado === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1",
                  active
                    ? "bg-mana-red text-white ring-mana-red shadow-mana"
                    : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                ].join(" ")}
              >
                {f.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-black/5 text-mana-muted"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {notifPermission !== "granted" && (
            <button
              onClick={requestNotif}
              className="inline-flex items-center gap-1.5 rounded-full bg-mana-red text-white ring-1 ring-mana-red px-3 py-1.5 text-xs font-semibold hover:brightness-110 transition"
              title="Activar notificaciones del navegador"
            >
              <Bell className="h-3.5 w-3.5" />
              Activar alertas
            </button>
          )}
          <button
            onClick={() => setSoundOn((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ${
              soundOn
                ? "bg-mana-yellow text-mana-ink ring-mana-yellow"
                : "bg-white text-mana-muted ring-black/10"
            }`}
            title={soundOn ? "Desactivar sonido" : "Activar sonido"}
          >
            {soundOn ? (
              <Bell className="h-3.5 w-3.5" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            Sonido: {soundOn ? "ON" : "OFF"}
          </button>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              flash
                ? "bg-mana-success text-white animate-pulse"
                : "bg-white text-mana-muted ring-1 ring-black/10"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                flash ? "bg-white" : "bg-mana-success"
              } animate-pulse`}
            />
            En vivo
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card-mana py-16 text-center">
          <RefreshCw className="h-8 w-8 mx-auto text-mana-muted mb-2" />
          <p className="font-display font-bold text-mana-ink">
            No hay pedidos en esta vista
          </p>
          <p className="text-sm text-mana-muted mt-1">
            Cuando entre uno nuevo, aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <OrderCard
                key={p.id}
                pedido={p}
                businessName={businessName}
                payment={payment}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Toast de nuevo pedido */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-md rounded-2xl bg-mana-red text-white shadow-mana ring-1 ring-white/10 px-4 py-3 flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <PartyPopper className="h-6 w-6 text-mana-yellow shrink-0 animate-bounce-in" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-black text-sm leading-tight">
                ¡Nuevo pedido #{String(toast.numero).padStart(4, "0")}!
              </p>
              <p className="text-[12px] text-white/80 truncate">
                {toast.cliente} · {formatUSD(toast.total)}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              aria-label="Cerrar notificación"
              className="p-1 rounded-full hover:bg-white/15 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Patrón de sonido más notorio: 3 pings ascendentes.
 * Se arma con Web Audio; no requiere archivos externos.
 */
function playAlertPattern() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const now = ctx.currentTime;
    const beeps: { at: number; f1: number; f2: number; dur: number }[] = [
      { at: 0.0, f1: 880, f2: 1320, dur: 0.22 },
      { at: 0.28, f1: 980, f2: 1480, dur: 0.22 },
      { at: 0.58, f1: 1100, f2: 1760, dur: 0.32 },
    ];
    for (const b of beeps) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(b.f1, now + b.at);
      o.frequency.exponentialRampToValueAtTime(b.f2, now + b.at + b.dur * 0.75);
      g.gain.setValueAtTime(0.0001, now + b.at);
      g.gain.exponentialRampToValueAtTime(0.35, now + b.at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + b.at + b.dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + b.at);
      o.stop(now + b.at + b.dur + 0.05);
    }
  } catch {
    // silent
  }
}
