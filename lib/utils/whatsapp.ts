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
 * totales con tasa BCV, datos de pago y cierre profesional con checklist.
 */
export function buildWhatsAppMessage(
  pedido: PedidoConItems,
  businessName = "Maná Fast Food",
  payment?: PaymentDetails
): string {
  const totalUsd = Number(pedido.total_usd);
  const totalBs = Number(pedido.total_bs);
  const tasaBs = Number(pedido.tasa_bs);
  const propina = Number(pedido.propina_usd ?? 0);
  const esDelivery = pedido.zona_id != null;

  const lines: string[] = [];
  lines.push(`Hola ${pedido.cliente_nombre} 👋`);
  lines.push("");
  lines.push(
    `Te escribimos de *${businessName}*. Recibimos tu pedido *#${String(
      pedido.numero
    ).padStart(4, "0")}* con éxito. 🍔`
  );
  lines.push("");

  // Detalle
  lines.push("*🧾 Detalle del pedido:*");
  for (const it of pedido.items) {
    lines.push(
      `• ${it.cantidad}× ${it.producto_nombre} — ${formatUSD(
        Number(it.subtotal_usd)
      )}`
    );
  }
  lines.push("");

  // Entrega (zona y notas) — así el cliente confirma que la dirección está correcta
  lines.push(
    `*📍 Entrega:* ${
      esDelivery
        ? `Delivery · ${pedido.zona_nombre}`
        : `Retiro en tienda · ${pedido.zona_nombre}`
    }`
  );
  if (pedido.notas && pedido.notas.trim()) {
    lines.push(`_Nota:_ ${pedido.notas.trim()}`);
  }
  lines.push("");

  // Totales
  lines.push(`Subtotal: ${formatUSD(Number(pedido.subtotal_usd))} _(IVA incluido)_`);
  lines.push(
    `Envío (${pedido.zona_nombre}): ${formatUSD(Number(pedido.envio_usd))}`
  );
  if (propina > 0) {
    lines.push(`Propina: ${formatUSD(propina)} 🙌`);
  }
  lines.push(`*Total a pagar: ${formatUSD(totalUsd)}*`);
  lines.push(
    `_Tasa BCV: 1 USD = ${tasaBs.toFixed(2)} Bs · al cambio = ${formatBs(
      totalBs
    )}_`
  );
  lines.push("");

  // Método + datos de pago
  lines.push(`*💳 Método de pago:* ${pedido.metodo_pago}`);
  if (payment) {
    const pagoInfo = getPaymentInstructions(pedido.metodo_pago, payment);
    if (pagoInfo) {
      lines.push("");
      lines.push("*Datos para el pago:*");
      lines.push(pagoInfo);
      lines.push("");
      lines.push(
        `*Monto a pagar:* ${formatUSD(totalUsd)} · ${formatBs(totalBs)}`
      );
    }
  }

  // Cierre: checklist de revisión antes del pago
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━");
  lines.push("*Antes de pagar, confirma que todo esté correcto:*");
  lines.push("✅ Productos y cantidades");
  lines.push(
    esDelivery ? "✅ Zona de entrega y dirección" : "✅ Hora de retiro"
  );
  lines.push("✅ Método de pago y total");
  lines.push("");
  lines.push(
    "Si todo está en orden, realiza el pago y envíanos el *comprobante* por este mismo chat para confirmar y despachar tu pedido."
  );
  lines.push("");
  lines.push(
    "Si necesitas cambiar algo (producto, dirección, hora), respóndenos *antes* de pagar y lo ajustamos. 🙌"
  );
  lines.push("");
  lines.push(`¡Gracias por preferirnos, ${firstName(pedido.cliente_nombre)}!`);
  return lines.join("\n");
}

function firstName(full: string): string {
  return (full ?? "").trim().split(/\s+/)[0] ?? "";
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
