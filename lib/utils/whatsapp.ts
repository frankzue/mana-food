import type { PedidoConItems } from "@/types/database";
import { formatBs, formatUSD } from "@/lib/utils";

export function buildWhatsAppMessage(
  pedido: PedidoConItems,
  businessName = "Maná Fast Food"
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
  lines.push(`Subtotal: ${formatUSD(Number(pedido.subtotal_usd))}`);
  lines.push(`IVA: ${formatUSD(Number(pedido.iva_usd))}`);
  lines.push(
    `Envío (${pedido.zona_nombre}): ${formatUSD(Number(pedido.envio_usd))}`
  );
  lines.push(
    `*Total: ${formatUSD(Number(pedido.total_usd))} · ${formatBs(
      Number(pedido.total_bs)
    )}*`
  );
  lines.push("");
  lines.push(`Método de pago elegido: *${pedido.metodo_pago}*`);
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
