import { round2 } from "@/lib/utils";

export type CartLine = {
  producto_id: string;
  nombre: string;
  precio_unit_usd: number;
  cantidad: number;
};

export type TotalsBreakdown = {
  subtotal_usd: number;
  iva_usd: number;
  envio_usd: number;
  propina_usd: number;
  total_usd: number;
  total_bs: number;
  tasa_bs: number;
  iva_rate: number;
};

export function calcularSubtotal(items: CartLine[]): number {
  return round2(
    items.reduce((sum, it) => sum + it.precio_unit_usd * it.cantidad, 0)
  );
}

export function calcularTotales(params: {
  items: CartLine[];
  envio_usd: number;
  tasa_bs: number;
  iva_rate: number;
  propina_usd?: number;
}): TotalsBreakdown {
  // Los precios del menú ya incluyen el IVA, así que NO lo sumamos al total.
  // iva_usd queda en 0 (no es un cargo extra) y total = subtotal + envio + propina.
  const subtotal_usd = calcularSubtotal(params.items);
  const iva_usd = 0;
  const envio_usd = round2(params.envio_usd);
  const propina_usd = round2(Math.max(0, params.propina_usd ?? 0));
  const total_usd = round2(subtotal_usd + envio_usd + propina_usd);
  const total_bs = round2(total_usd * params.tasa_bs);

  return {
    subtotal_usd,
    iva_usd,
    envio_usd,
    propina_usd,
    total_usd,
    total_bs,
    tasa_bs: params.tasa_bs,
    iva_rate: params.iva_rate,
  };
}
