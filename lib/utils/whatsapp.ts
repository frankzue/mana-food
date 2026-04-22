import type { PedidoConItems, SettingsMap } from "@/types/database";
import { formatBs, formatUSD } from "@/lib/utils";
import { formatPaymentBlock } from "@/lib/payment-data";

export type PaymentDetails = Pick<
  SettingsMap,
  | "pago_pagomovil"
  | "pago_zelle"
  | "pago_binance"
  | "pago_transferencia"
  | "pago_efectivo_usd"
  | "pago_efectivo_bs"
>;

/**
 * Devuelve el texto con los datos de pago para el método elegido.
 * Si no hay datos configurados, devuelve null (no se añade la sección).
 *
 * Auto-detecta JSON estructurado y lo formatea. Si el valor es texto
 * legacy (antes del rediseño) lo respeta tal cual.
 */
export function getPaymentInstructions(
  metodoPago: string,
  details: PaymentDetails
): string | null {
  const m = metodoPago.toLowerCase();
  if (m.includes("pago móvil") || m.includes("pago movil")) {
    return formatPaymentBlock("pagomovil", details.pago_pagomovil) || null;
  }
  if (m.includes("zelle")) {
    return formatPaymentBlock("zelle", details.pago_zelle) || null;
  }
  if (m.includes("binance")) {
    return formatPaymentBlock("binance", details.pago_binance) || null;
  }
  if (m.includes("transferencia")) {
    return formatPaymentBlock("transferencia", details.pago_transferencia) || null;
  }
  if (m.includes("efectivo") && m.includes("usd")) {
    return formatPaymentBlock("efectivo", details.pago_efectivo_usd) || null;
  }
  if (m.includes("efectivo") && m.includes("bs")) {
    return formatPaymentBlock("efectivo", details.pago_efectivo_bs) || null;
  }
  return null;
}

/**
 * Mensaje completo para WhatsApp. Incluye saludo, detalle del pedido,
 * totales y datos de pago según el método elegido.
 */
export function buildWhatsAppMessage(
  pedido: PedidoConItems,
  businessName = "Maná Fast Food",
  payment?: PaymentDetails
): string {
  const lines: string[] = [];
  lines.push(`Hola ${pedido.cliente_nombre} 👋`);
  lines.push("");
  lines.push(
    `Te escribimos de *${businessName}*. Recibimos tu pedido *#${String(
      pedido.numero
    ).padStart(4, "0")}* con éxito. 🍔`
  );
  lines.push("");
  lines.push("*🧾 Detalle:*");
  for (const it of pedido.items) {
    lines.push(
      `• ${it.cantidad}× ${it.producto_nombre} — ${formatUSD(
        Number(it.subtotal_usd)
      )}`
    );
  }
  lines.push("");
  lines.push(`Subtotal: ${formatUSD(Number(pedido.subtotal_usd))} _(IVA incluido)_`);
  lines.push(
    `Envío (${pedido.zona_nombre}): ${formatUSD(Number(pedido.envio_usd))}`
  );
  const propina = Number(pedido.propina_usd ?? 0);
  if (propina > 0) {
    lines.push(`Propina: ${formatUSD(propina)} 🙌`);
  }
  lines.push(
    `*Total: ${formatUSD(Number(pedido.total_usd))} · ${formatBs(
      Number(pedido.total_bs)
    )}*`
  );
  lines.push("");
  lines.push(`*Método de pago:* ${pedido.metodo_pago}`);

  if (payment) {
    const pagoInfo = getPaymentInstructions(pedido.metodo_pago, payment);
    if (pagoInfo) {
      lines.push("");
      lines.push("*💳 Datos para el pago:*");
      lines.push(pagoInfo);
    }
  }

  lines.push("");
  lines.push(
    "Por favor envíanos el comprobante de pago por este medio para confirmar y despachar tu pedido. ¡Gracias por elegirnos! 🙌"
  );
  return lines.join("\n");
}

/**
 * Genera el link wa.me para que el ENCARGADO abra el chat con el CLIENTE.
 * El número destino es el del CLIENTE; el mensaje ya viene escrito.
 */
export function buildWhatsAppLink(
  clientPhone: string,
  message: string
): string {
  const clean = clientPhone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
