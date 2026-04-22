"use client";

import type { PedidoConItems, EstadoPedido } from "@/types/database";
import { formatBs, formatUSD } from "@/lib/utils";
import {
  buildWhatsAppLink,
  buildWhatsAppMessage,
  type PaymentDetails,
} from "@/lib/utils/whatsapp";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  User,
  MapPin,
  CreditCard,
  StickyNote,
  XCircle,
  Copy,
  Check,
  Undo2,
  AlertTriangle,
  Wallet,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  pedido: PedidoConItems;
  businessName: string;
  payment: PaymentDetails;
};

const estadoConfig: Record<
  EstadoPedido,
  { label: string; bg: string; text: string }
> = {
  nuevo: {
    label: "Nuevo",
    bg: "bg-mana-red",
    text: "text-white",
  },
  contactado: {
    label: "Contactado",
    bg: "bg-mana-yellow",
    text: "text-mana-ink",
  },
  pagado: {
    label: "Pagado",
    bg: "bg-blue-500",
    text: "text-white",
  },
  completado: {
    label: "Completado",
    bg: "bg-mana-success",
    text: "text-white",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-mana-muted",
    text: "text-white",
  },
  devuelto: {
    label: "Devuelto",
    bg: "bg-orange-500",
    text: "text-white",
  },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderCard({ pedido, businessName, payment }: Props) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundMonto, setRefundMonto] = useState<string>(
    String(Number(pedido.total_usd ?? 0).toFixed(2))
  );
  const [refundMotivo, setRefundMotivo] = useState<string>("");
  const router = useRouter();

  const estado = estadoConfig[pedido.estado];

  function updateEstado(nuevoEstado: EstadoPedido) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("pedidos")
        .update({ estado: nuevoEstado })
        .eq("id", pedido.id);
      router.refresh();
    });
  }

  function registrarDevolucion() {
    const monto = Number(refundMonto);
    if (!isFinite(monto) || monto <= 0) return;
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("pedidos")
        .update({
          estado: "devuelto",
          devuelto_at: new Date().toISOString(),
          devuelto_monto_usd: monto,
          motivo_devolucion: refundMotivo.trim() || null,
        })
        .eq("id", pedido.id);
      setShowRefund(false);
      router.refresh();
    });
  }

  function handleContactar() {
    const msg = buildWhatsAppMessage(pedido, businessName, payment);
    const link = buildWhatsAppLink(pedido.cliente_telefono, msg);
    window.open(link, "_blank", "noopener,noreferrer");
    if (pedido.estado === "nuevo") updateEstado("contactado");
  }

  async function handleCopy() {
    const msg = buildWhatsAppMessage(pedido, businessName, payment);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(msg);
      } else {
        // Fallback para contextos sin Clipboard API
        const ta = document.createElement("textarea");
        ta.value = msg;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // silent
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="card-mana p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black text-mana-red">
              #{String(pedido.numero).padStart(4, "0")}
            </span>
            <span
              className={`chip ${estado.bg} ${estado.text}`}
            >
              {estado.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-mana-muted mt-1">
            <Clock className="h-3 w-3" />
            {formatTime(pedido.created_at)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-black text-mana-ink">
            {formatUSD(Number(pedido.total_usd))}
          </div>
          <div className="text-xs text-mana-muted">
            {formatBs(Number(pedido.total_bs))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5 text-mana-ink">
          <User className="h-3.5 w-3.5 text-mana-red shrink-0" />
          <strong className="truncate">{pedido.cliente_nombre}</strong>
        </span>
        <span className="flex items-center gap-1.5 text-mana-ink">
          <Phone className="h-3.5 w-3.5 text-mana-red shrink-0" />
          <span className="truncate">{pedido.cliente_telefono}</span>
        </span>
        <span className="flex items-center gap-1.5 text-mana-ink col-span-2">
          <MapPin className="h-3.5 w-3.5 text-mana-red shrink-0" />
          <span className="truncate">{pedido.zona_nombre}</span>
        </span>
        <span className="flex items-center gap-1.5 text-mana-ink col-span-2">
          <CreditCard className="h-3.5 w-3.5 text-mana-red shrink-0" />
          <span className="truncate">{pedido.metodo_pago}</span>
        </span>
      </div>

      <div className="rounded-xl bg-mana-cream p-3">
        <p className="text-xs font-bold text-mana-muted mb-1.5 uppercase tracking-wide">
          Pedido
        </p>
        <ul className="space-y-1 text-sm">
          {pedido.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-2">
              <span className="text-mana-ink truncate">
                <strong>{it.cantidad}×</strong> {it.producto_nombre}
              </span>
              <span className="font-semibold text-mana-ink shrink-0">
                {formatUSD(Number(it.subtotal_usd))}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-dashed border-black/10 mt-2 pt-2 text-xs text-mana-muted space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatUSD(Number(pedido.subtotal_usd))}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{formatUSD(Number(pedido.envio_usd))}</span>
          </div>
          {Number(pedido.propina_usd ?? 0) > 0 && (
            <div className="flex justify-between text-mana-red font-semibold">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" /> Propina
              </span>
              <span>{formatUSD(Number(pedido.propina_usd))}</span>
            </div>
          )}
          <p className="italic pt-0.5">* IVA incluido</p>
        </div>
      </div>

      {pedido.notas && (
        <div className="flex gap-2 text-sm bg-mana-yellow/20 ring-1 ring-mana-yellow/40 rounded-xl p-2.5">
          <StickyNote className="h-4 w-4 text-mana-red shrink-0 mt-0.5" />
          <p className="text-mana-ink">{pedido.notas}</p>
        </div>
      )}

      {/* Acciones: UI guiada por el estado del pedido.
          Mostramos UNA acción principal (la que corresponde hacer ahora),
          y en una fila chica debajo las opciones secundarias (WhatsApp, Cancelar, Devolver).
          Así el empleado no duda sobre qué botón es el siguiente paso. */}
      <OrderActions
        estado={pedido.estado}
        isPending={isPending}
        onContactar={handleContactar}
        onMarcarPagado={() => updateEstado("pagado")}
        onMarcarEntregado={() => updateEstado("completado")}
        onCancelar={() => updateEstado("cancelado")}
        onAbrirDevolucion={() => setShowRefund(true)}
        onCopiar={handleCopy}
        copied={copied}
      />

      {pedido.estado === "devuelto" && (
        <div className="flex gap-2 rounded-xl bg-orange-50 ring-1 ring-orange-200 p-2.5 text-xs text-orange-900">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">
              Devolución registrada
              {pedido.devuelto_monto_usd != null && (
                <> · {formatUSD(Number(pedido.devuelto_monto_usd))}</>
              )}
            </div>
            {pedido.motivo_devolucion && (
              <div>Motivo: {pedido.motivo_devolucion}</div>
            )}
            {pedido.devuelto_at && (
              <div className="text-orange-700/80">
                {new Date(pedido.devuelto_at).toLocaleString("es-VE")}
              </div>
            )}
          </div>
        </div>
      )}

      {showRefund && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setShowRefund(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-mana-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Undo2 className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-display font-black text-mana-ink">
                  Registrar devolución
                </h4>
                <p className="text-[11px] text-mana-muted">
                  Pedido #{String(pedido.numero).padStart(4, "0")} ·{" "}
                  {formatUSD(Number(pedido.total_usd))}
                </p>
              </div>
            </div>

            <label className="block text-xs font-semibold text-mana-ink mb-1">
              Monto devuelto (USD)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={refundMonto}
              onChange={(e) => setRefundMonto(e.target.value)}
              className="input-mana mb-3"
              placeholder="0.00"
            />

            <label className="block text-xs font-semibold text-mana-ink mb-1">
              Motivo
            </label>
            <select
              value={refundMotivo}
              onChange={(e) => setRefundMotivo(e.target.value)}
              className="input-mana mb-3"
            >
              <option value="">— Selecciona —</option>
              <option value="Producto incorrecto">Producto incorrecto</option>
              <option value="Producto en mal estado">
                Producto en mal estado
              </option>
              <option value="Demora en la entrega">Demora en la entrega</option>
              <option value="Cliente insatisfecho">Cliente insatisfecho</option>
              <option value="Pago duplicado">Pago duplicado</option>
              <option value="Otro">Otro</option>
            </select>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRefund(false)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-mana-ink ring-1 ring-black/10 hover:bg-mana-cream"
              >
                Cancelar
              </button>
              <button
                onClick={registrarDevolucion}
                disabled={isPending || !Number(refundMonto)}
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-mana-soft hover:brightness-95 disabled:opacity-50"
              >
                Confirmar devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}

// =========================================================
// OrderActions — UI guiada según el estado del pedido
// =========================================================
/**
 * El patrón: un botón GRANDE que es "el siguiente paso obvio",
 * un botón de WhatsApp secundario siempre disponible,
 * y los iconos chicos (copiar/devolver/cancelar) que son excepciones.
 *
 * El empleado nunca duda qué hacer: mira el botón grande y lo pulsa.
 */
function OrderActions({
  estado,
  isPending,
  onContactar,
  onMarcarPagado,
  onMarcarEntregado,
  onCancelar,
  onAbrirDevolucion,
  onCopiar,
  copied,
}: {
  estado: EstadoPedido;
  isPending: boolean;
  onContactar: () => void;
  onMarcarPagado: () => void;
  onMarcarEntregado: () => void;
  onCancelar: () => void;
  onAbrirDevolucion: () => void;
  onCopiar: () => void;
  copied: boolean;
}) {
  // Determina la acción principal según el estado del pedido.
  type Primary = {
    label: string;
    sub: string;
    icon: React.ReactNode;
    bg: string;
    onClick: () => void;
  };

  let primary: Primary;
  switch (estado) {
    case "nuevo":
      primary = {
        label: "Contactar por WhatsApp",
        sub: "Saludar al cliente y enviarle los datos de pago",
        icon: <MessageCircle className="h-5 w-5" />,
        bg: "bg-[#25D366] hover:brightness-95",
        onClick: onContactar,
      };
      break;
    case "contactado":
      primary = {
        label: "Confirmar que pagó",
        sub: "Cuando recibas la transferencia / comprobante",
        icon: <Wallet className="h-5 w-5" />,
        bg: "bg-blue-500 hover:bg-blue-600",
        onClick: onMarcarPagado,
      };
      break;
    case "pagado":
      primary = {
        label: "Marcar entregado",
        sub: "Cuando el pedido salga o sea retirado",
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-mana-success hover:brightness-95",
        onClick: onMarcarEntregado,
      };
      break;
    case "completado":
    case "cancelado":
    case "devuelto":
      // Sin "siguiente paso" → no se muestra botón grande principal.
      primary = {
        label: "",
        sub: "",
        icon: null,
        bg: "",
        onClick: () => {},
      };
      break;
  }

  const showPrimary =
    estado === "nuevo" || estado === "contactado" || estado === "pagado";

  // WhatsApp secundario: siempre accesible excepto en cancelado (no tiene sentido)
  const showWhatsApp = estado !== "cancelado";

  // Botones de excepción
  const showCancelar =
    estado !== "cancelado" &&
    estado !== "completado" &&
    estado !== "devuelto";
  const showDevolver = estado === "pagado" || estado === "completado";

  return (
    <div className="pt-1 space-y-2">
      {showPrimary && (
        <button
          onClick={primary.onClick}
          disabled={isPending}
          className={[
            "w-full rounded-xl px-4 py-3.5 text-left text-white shadow-mana-soft transition active:scale-[0.99] disabled:opacity-50",
            primary.bg,
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-9 w-9 rounded-full bg-white/20 shrink-0">
              {primary.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                Siguiente paso
              </div>
              <div className="font-bold text-sm leading-tight">
                {primary.label}
              </div>
              <div className="text-[11px] opacity-85 leading-tight mt-0.5 truncate">
                {primary.sub}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Fila secundaria: WhatsApp + iconos de excepción */}
      <div className="flex items-center gap-1.5">
        {showWhatsApp && (
          <button
            onClick={onContactar}
            className={[
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ring-1 active:scale-[0.98]",
              // Si el botón principal YA ES WhatsApp, este queda en outline
              estado === "nuevo"
                ? "bg-white text-[#128C7E] ring-[#25D366]/40 hover:ring-[#25D366]"
                : "bg-[#25D366] text-white ring-[#25D366] hover:brightness-95",
            ].join(" ")}
            title="Abrir chat de WhatsApp con el cliente"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
          </button>
        )}

        <button
          onClick={onCopiar}
          className={[
            "inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-bold transition ring-1 active:scale-[0.98]",
            copied
              ? "bg-mana-success text-white ring-mana-success"
              : "bg-white text-mana-muted ring-black/10 hover:text-mana-ink hover:ring-mana-ink/30",
          ].join(" ")}
          title="Copiar el mensaje completo (por si WhatsApp no abre)"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex-1" />

        {showDevolver && (
          <button
            onClick={onAbrirDevolucion}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-[11px] font-bold text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50 transition active:scale-[0.98] disabled:opacity-50"
            title="Registrar devolución de dinero"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Devolver</span>
          </button>
        )}
        {showCancelar && (
          <button
            onClick={onCancelar}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-[11px] font-bold text-mana-muted ring-1 ring-black/10 hover:text-red-600 hover:ring-red-300 hover:bg-red-50 transition active:scale-[0.98] disabled:opacity-50"
            title="Cancelar pedido"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>
        )}
      </div>
    </div>
  );
}
