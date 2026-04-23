"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  PedidoConItems,
  EstadoPedido,
  PedidoItem,
} from "@/types/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import type { PaymentDetails } from "@/lib/utils/whatsapp";
import {
  Clock,
  User,
  MapPin,
  CreditCard,
  GripVertical,
  Bell,
  MessageCircle,
  Wallet,
  CheckCircle2,
  X,
} from "lucide-react";
import { OrderCard } from "./OrderCard";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Tablero Kanban para pedidos.
 * Columnas: Nuevo · Contactado · Pagado · Completado.
 * Drag-and-drop entre columnas → actualiza el estado en Supabase.
 * Click en una tarjeta → abre el OrderCard completo en un panel lateral.
 */

type Props = {
  pedidos: PedidoConItems[];
  businessName: string;
  payment: PaymentDetails;
};

type ColKey = Extract<
  EstadoPedido,
  "nuevo" | "contactado" | "pagado" | "completado"
>;

type ColumnDef = {
  key: ColKey;
  label: string;
  accent: string; // clase para el borde superior
  icon: React.ComponentType<{ className?: string }>;
  badge: string; // clase del chip del contador
};

const COLUMNS: ColumnDef[] = [
  {
    key: "nuevo",
    label: "Nuevos",
    accent: "border-t-mana-red",
    icon: Bell,
    badge: "bg-mana-red text-white",
  },
  {
    key: "contactado",
    label: "Contactados",
    accent: "border-t-mana-yellow",
    icon: MessageCircle,
    badge: "bg-mana-yellow text-mana-ink",
  },
  {
    key: "pagado",
    label: "Pagados",
    accent: "border-t-blue-500",
    icon: Wallet,
    badge: "bg-blue-500 text-white",
  },
  {
    key: "completado",
    label: "Completados",
    accent: "border-t-mana-success",
    icon: CheckCircle2,
    badge: "bg-mana-success text-white",
  },
];

export function KanbanBoard({ pedidos, businessName, payment }: Props) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PedidoConItems | null>(null);

  // Optimistic estado: si arrastras una tarjeta, la movemos localmente antes
  // de que Supabase confirme para que la UI responda al instante.
  const [overrides, setOverrides] = useState<Record<string, EstadoPedido>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Distancia mínima antes de activar drag → permite hacer click sin arrastrar
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const efectivos = useMemo(
    () =>
      pedidos.map((p) =>
        overrides[p.id] ? { ...p, estado: overrides[p.id] } : p
      ),
    [pedidos, overrides]
  );

  const grouped = useMemo(() => {
    const g: Record<ColKey, PedidoConItems[]> = {
      nuevo: [],
      contactado: [],
      pagado: [],
      completado: [],
    };
    for (const p of efectivos) {
      if (p.estado === "nuevo" || p.estado === "contactado" || p.estado === "pagado" || p.estado === "completado") {
        g[p.estado].push(p);
      }
    }
    // Más reciente arriba
    for (const k of Object.keys(g) as ColKey[]) {
      g[k].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return g;
  }, [efectivos]);

  function handleDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const pedidoId = String(active.id);
    const destino = String(over.id) as ColKey;
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;
    const estadoActual = overrides[pedidoId] ?? pedido.estado;
    if (estadoActual === destino) return;

    // Optimistic
    setOverrides((prev) => ({ ...prev, [pedidoId]: destino }));

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: destino })
        .eq("id", pedidoId);
      if (error) {
        // Rollback en caso de fallo
        setOverrides((prev) => {
          const { [pedidoId]: _drop, ...rest } = prev;
          return rest;
        });
      }
      router.refresh();
    });
  }

  const pedidoDragging =
    draggingId != null ? pedidos.find((p) => p.id === draggingId) ?? null : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              pedidos={grouped[col.key]}
              onOpenDetail={setDetail}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180 }}>
          {pedidoDragging ? (
            <div className="w-[280px] rotate-[-2deg]">
              <KanbanCard pedido={pedidoDragging} preview />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DetailSheet
        pedido={detail}
        businessName={businessName}
        payment={payment}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

// =========================================================
// COLUMNA
// =========================================================
function KanbanColumn({
  col,
  pedidos,
  onOpenDetail,
}: {
  col: ColumnDef;
  pedidos: PedidoConItems[];
  onOpenDetail: (p: PedidoConItems) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });
  const Icon = col.icon;

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl bg-white ring-1 ring-black/5 shadow-sm border-t-4 overflow-hidden flex flex-col min-h-[200px] transition",
        col.accent,
        isOver ? "ring-2 ring-mana-red/30 shadow-mana-soft" : "",
      ].join(" ")}
    >
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-black/5">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${col.badge}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="font-display font-black text-sm text-mana-ink">
          {col.label}
        </h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-black ${col.badge}`}>
          {pedidos.length}
        </span>
      </div>

      <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
        {pedidos.length === 0 ? (
          <p className="text-[11px] text-center text-mana-muted py-6 italic">
            Arrastra aquí
          </p>
        ) : (
          pedidos.map((p) => (
            <KanbanCard
              key={p.id}
              pedido={p}
              onOpen={() => onOpenDetail(p)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =========================================================
// TARJETA (draggable)
// =========================================================
function KanbanCard({
  pedido,
  preview = false,
  onOpen,
}: {
  pedido: PedidoConItems;
  preview?: boolean;
  onOpen?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pedido.id,
    disabled: preview,
  });

  const tiempo = useMemo(() => {
    const mins = Math.floor(
      (Date.now() - new Date(pedido.created_at).getTime()) / 60_000
    );
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  }, [pedido.created_at]);

  const cantidadItems = pedido.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={[
        "group rounded-xl bg-white ring-1 ring-black/10 shadow-sm hover:shadow-mana-soft transition select-none",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <button
          {...listeners}
          className="px-1.5 py-2 text-mana-muted hover:text-mana-ink cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastrar"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Contenido clickable para abrir detalle */}
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left px-2 py-2 min-w-0"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-sm text-mana-red">
              #{String(pedido.numero).padStart(4, "0")}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-mana-muted">
              <Clock className="h-3 w-3" />
              {tiempo}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-mana-ink truncate">
            <User className="h-3 w-3 text-mana-red shrink-0" />
            <span className="font-semibold truncate">{pedido.cliente_nombre}</span>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-mana-muted truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{pedido.zona_nombre}</span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10.5px] rounded-full bg-mana-cream px-2 py-0.5 ring-1 ring-black/5 text-mana-ink">
              <CreditCard className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{pedido.metodo_pago}</span>
            </span>
            <span className="text-[10.5px] text-mana-muted">
              {cantidadItems} × item{cantidadItems === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display font-black text-base text-mana-ink">
              {formatUSD(Number(pedido.total_usd))}
            </span>
            {Number(pedido.propina_usd ?? 0) > 0 && (
              <span className="text-[10px] text-mana-red font-bold">
                +propina
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

// =========================================================
// DETAIL SHEET — reusa OrderCard dentro de un side-panel
// =========================================================
function DetailSheet({
  pedido,
  businessName,
  payment,
  onClose,
}: {
  pedido: PedidoConItems | null;
  businessName: string;
  payment: PaymentDetails;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {pedido && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-black/40"
        >
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full sm:w-[440px] max-w-full bg-mana-cream shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-mana-cream/95 backdrop-blur border-b border-black/5 flex items-center justify-between px-4 py-3">
              <h3 className="font-display font-black text-mana-ink">
                Pedido #{String(pedido.numero).padStart(4, "0")}
              </h3>
              <button
                onClick={onClose}
                className="grid place-items-center h-8 w-8 rounded-full bg-white ring-1 ring-black/10 hover:bg-mana-cream-dark"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <OrderCard
                pedido={pedido}
                businessName={businessName}
                payment={payment}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
