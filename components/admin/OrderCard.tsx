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
          <p className="italic pt-0.5">* IVA incluido</p>
        </div>
      </div>

      {pedido.notas && (
        <div className="flex gap-2 text-sm bg-mana-yellow/20 ring-1 ring-mana-yellow/40 rounded-xl p-2.5">
          <StickyNote className="h-4 w-4 text-mana-red shrink-0 mt-0.5" />
          <p className="text-mana-ink">{pedido.notas}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={handleContactar}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 font-semibold text-white shadow-mana-soft transition hover:brightness-95 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" /> Contactar Cliente
        </button>

        <button
          onClick={handleCopy}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition ring-1 active:scale-95",
            copied
              ? "bg-mana-success text-white ring-mana-success"
              : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
          ].join(" ")}
          title="Copiar resumen del pedido (con datos de pago) para pegar en WhatsApp"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar
            </>
          )}
        </button>

        {pedido.estado !== "completado" && (
          <button
            onClick={() => updateEstado("completado")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-mana-success px-3 py-2.5 text-sm font-semibold text-white shadow-mana-soft transition hover:brightness-95 active:scale-95 disabled:opacity-50"
            title="Marcar completado"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}

        {pedido.estado !== "cancelado" && pedido.estado !== "completado" && (
          <button
            onClick={() => updateEstado("cancelado")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-mana-muted ring-1 ring-black/10 px-3 py-2.5 text-sm font-semibold transition hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50"
            title="Cancelar"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.article>
  );
}
