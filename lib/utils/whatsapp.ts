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
 * Mensaje completo para WhatsApp.
 *
 * Diseño (claridad ante todo):
 *  · Cada monto en su propia línea (USD y Bs nunca "pegados" con ·).
 *  · "Total a pagar" separado visualmente con USD grande y la conversión
 *    en Bs debajo entre paréntesis → imposible confundir las cifras.
 *  · En el bloque de pago repetimos "Monto a pagar" por si el cliente solo
 *    lee esa sección al momento de transferir.
 *  · Cierre profesional: lista de verificación ANTES del pago +
 *    instrucciones claras si necesita cambios.
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

  const L: string[] = [];

  // Saludo
  L.push(`Hola ${pedido.cliente_nombre} 👋`);
  L.push("");
  L.push(
    `Soy del equipo de *${businessName}*. Recibimos tu pedido *#${numero}* correctamente. 🍔`
  );
  L.push(
    "Antes de procesarlo, por favor revisa los siguientes datos para confirmar que todo esté en orden."
  );
  L.push("");

  // 1) DETALLE
  L.push("*🧾 Tu pedido:*");
  for (const it of pedido.items) {
    L.push(
      `•  ${it.cantidad}×  ${it.producto_nombre}  —  ${formatUSD(
        Number(it.subtotal_usd)
      )}`
    );
  }
  L.push("");

  // 2) ENTREGA
  L.push(
    `*📍 Entrega:*  ${
      esDelivery
        ? `Delivery → ${pedido.zona_nombre}`
        : `Retiro en tienda (${pedido.zona_nombre})`
    }`
  );
  if (pedido.notas && pedido.notas.trim()) {
    L.push(`*📝 Nota:*  ${pedido.notas.trim()}`);
  }
  L.push("");

  // 3) DESGLOSE DE PAGO
  L.push("*🧮 Desglose:*");
  L.push(
    `   Subtotal  —  ${formatUSD(Number(pedido.subtotal_usd))}  _(IVA incluido)_`
  );
  L.push(
    `   Envío     —  ${formatUSD(Number(pedido.envio_usd))}`
  );
  if (propina > 0) {
    L.push(`   Propina   —  ${formatUSD(propina)}  🙌`);
  }
  L.push("");

  // 4) TOTAL — presentado en dos líneas, muy legible
  L.push("━━━━━━━━━━━━━━━━━━━━");
  L.push(`*💵 TOTAL A PAGAR:*   *${formatUSD(totalUsd)}*`);
  L.push(`_Al cambio BCV:_      *${formatBs(totalBs)}*`);
  L.push(`_Tasa del día:_        1 USD  =  ${tasaBs.toFixed(2)} Bs`);
  L.push("━━━━━━━━━━━━━━━━━━━━");
  L.push("");

  // 5) MÉTODO + DATOS DE PAGO
  L.push(`*💳 Método de pago:*  ${pedido.metodo_pago}`);
  if (payment) {
    const pagoInfo = getPaymentInstructions(pedido.metodo_pago, payment);
    if (pagoInfo) {
      L.push("");
      L.push("*Datos para realizar el pago:*");
      L.push(pagoInfo);
      L.push("");
      // Repetimos el monto en el bloque de pago, con cifras separadas
      // en líneas distintas para máxima claridad.
      L.push("*👉 Monto exacto a transferir:*");
      L.push(`   •  En dólares:    *${formatUSD(totalUsd)}*`);
      L.push(`   •  En bolívares:  *${formatBs(totalBs)}*`);
    }
  }

  // 6) CIERRE — checklist + instrucciones
  L.push("");
  L.push("─────────────────────");
  L.push("*Por favor confirma que todo esté correcto:*");
  L.push("");
  L.push("  ✅  Productos y cantidades");
  L.push(
    esDelivery
      ? "  ✅  Dirección y zona de entrega"
      : "  ✅  Hora para retirar el pedido"
  );
  L.push("  ✅  Método de pago y monto");
  L.push("");
  L.push(
    "👉 Si *todo* está correcto, realiza el pago y envíanos el *comprobante* por este mismo chat. Con eso confirmamos y despachamos."
  );
  L.push("");
  L.push(
    "⚠️ Si necesitas *ajustar algo* (producto, dirección, hora, método), respóndenos *antes* de pagar y lo cambiamos sin problema."
  );
  L.push("");
  L.push(
    `¡Gracias por elegirnos, ${firstName(pedido.cliente_nombre)}! 🙌`
  );

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
