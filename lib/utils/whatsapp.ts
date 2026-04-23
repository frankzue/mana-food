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
 * Mensaje completo para WhatsApp — versión compacta.
 *
 * Principios de diseño:
 *  · Cabe en una sola pantalla de celular (≈20 líneas).
 *  · USD y Bs siempre en líneas separadas (nunca pegados con "·").
 *  · Total presentado UNA sola vez con las dos monedas claramente distintas.
 *  · Sin líneas decorativas largas que ocupan espacio sin aportar.
 *  · CTA claro: "paga y envía comprobante" o "avisa antes si algo no cuadra".
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
  const numero = String(pedido.numero).padStart(4, "0");
  const primerNombre = firstName(pedido.cliente_nombre);

  const L: string[] = [];

  // 1) Saludo + confirmación (compacto en 2 líneas)
  L.push(
    `Hola ${pedido.cliente_nombre} 👋 Soy del equipo de *${businessName}*.`
  );
  L.push(
    `Recibimos tu pedido *#${numero}* 🍔 — revisa los datos antes de pagar:`
  );
  L.push("");

  // 2) Productos
  L.push("*🧾 Tu pedido:*");
  for (const it of pedido.items) {
    L.push(
      `•  ${it.cantidad}×  ${it.producto_nombre}  —  ${formatUSD(
        Number(it.subtotal_usd)
      )}`
    );
  }
  L.push("");

  // 3) Entrega + desglose corto (una línea por concepto)
  L.push(
    `*📍 Entrega:* ${
      esDelivery
        ? `Delivery → ${pedido.zona_nombre}`
        : `Retiro en tienda (${pedido.zona_nombre})`
    }`
  );
  if (pedido.notas && pedido.notas.trim()) {
    L.push(`*📝 Nota:* ${pedido.notas.trim()}`);
  }
  L.push(
    `*🧮 Subtotal:* ${formatUSD(Number(pedido.subtotal_usd))} _(IVA incluido)_`
  );
  L.push(`*🚚 Envío:*    ${formatUSD(Number(pedido.envio_usd))}`);
  if (propina > 0) {
    L.push(`*🙌 Propina:*  ${formatUSD(propina)}`);
  }
  L.push("");

  // 4) TOTAL — bloque único, cifras separadas, tasa como subnota
  L.push("*💵 TOTAL A PAGAR*");
  L.push(`   USD:  *${formatUSD(totalUsd)}*`);
  L.push(`   Bs:   *${formatBs(totalBs)}*`);
  L.push(`   _Tasa BCV: 1 USD = ${tasaBs.toFixed(2)} Bs_`);
  L.push("");

  // 5) Método + datos de pago (sin repetir el total)
  L.push(`*💳 Método:* ${pedido.metodo_pago}`);
  if (payment) {
    const pagoInfo = getPaymentInstructions(pedido.metodo_pago, payment);
    if (pagoInfo) {
      L.push(pagoInfo);
    }
  }
  L.push("");

  // 6) CTA condensado en 2 líneas (una positiva, una de excepción)
  L.push(
    "✅ Si todo está bien, paga y envíanos el *comprobante* por este chat."
  );
  L.push(
    "⚠️ Si algo no cuadra (producto, dirección, monto), avísanos *antes* de pagar."
  );
  L.push("");
  L.push(`¡Gracias, ${primerNombre}! 🙌`);

  return L.join("\n");
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
