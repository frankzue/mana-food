"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  PedidoConItems,
  Pedido,
  PedidoItem,
  EstadoPedido,
} from "@/types/database";
import { OrderCard } from "./OrderCard";
import { AnimatePresence } from "framer-motion";
import { Bell, RefreshCw } from "lucide-react";

type Props = {
  initialPedidos: PedidoConItems[];
  businessName: string;
};

const FILTERS: { key: EstadoPedido | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "nuevo", label: "Nuevos" },
  { key: "contactado", label: "Contactados" },
  { key: "completado", label: "Completados" },
  { key: "cancelado", label: "Cancelados" },
];

export function OrdersBoard({ initialPedidos, businessName }: Props) {
  const [pedidos, setPedidos] = useState<PedidoConItems[]>(initialPedidos);
  const [filter, setFilter] = useState<EstadoPedido | "todos">("todos");
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setPedidos(initialPedidos);
  }, [initialPedidos]);

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
          if (soundOn) playPing();
          setFlash(true);
          setTimeout(() => setFlash(false), 1500);
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
    };
  }, [soundOn]);

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ${
              soundOn
                ? "bg-mana-yellow text-mana-ink ring-mana-yellow"
                : "bg-white text-mana-muted ring-black/10"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
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
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function playPing() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  } catch {
    // silent
  }
}
