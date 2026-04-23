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
  { key: "pagado", label: "Pagados" },
  { key: "completado", label: "Completados" },
  { key: "devuelto", label: "Devueltos" },
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
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
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
 * Notificación tipo campana musical: 3 notas de un arpegio mayor
 * (E5 → B5 → E6) con ataque rápido y decaimiento largo tipo "bell".
 *
 * Se arma con Web Audio (sin archivos externos). Cada nota mezcla el
 * tono fundamental + su octava superior con ganancias distintas para
 * imitar el timbre de una campanita bonita en vez de un beep electrónico.
 */
function playAlertPattern() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const now = ctx.currentTime;

    // Compresor suave para que no se empaste ni sature
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    // Notas del acorde: E5, B5, E6 (quinta justa + octava). Suena agradable
    // y claro sin ser estridente — tipo notificación moderna.
    const notes = [
      { at: 0.0, freq: 659.25 }, // E5
      { at: 0.14, freq: 987.77 }, // B5
      { at: 0.3, freq: 1318.51 }, // E6
    ];

    for (const n of notes) {
      playBellNote(ctx, master, n.freq, n.at);
    }
  } catch {
    // silent
  }
}

/**
 * Sintetiza una nota tipo "bell" con dos osciladores (fundamental + octava)
 * y una envolvente ADSR corta para lograr el clásico "ding" limpio.
 */
function playBellNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number
) {
  const now = ctx.currentTime;
  const t0 = now + when;
  const dur = 0.9;

  // Fundamental (sinusoidal, limpia)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.008); // ataque rápido
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // decaimiento largo
  osc.connect(gain).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);

  // Armónico (octava superior, más suave) → brillo metálico de campana
  const harm = ctx.createOscillator();
  harm.type = "sine";
  harm.frequency.setValueAtTime(freq * 2, t0);
  const hGain = ctx.createGain();
  hGain.gain.setValueAtTime(0.0001, t0);
  hGain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.004);
  hGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
  harm.connect(hGain).connect(dest);
  harm.start(t0);
  harm.stop(t0 + dur * 0.6 + 0.02);
}
