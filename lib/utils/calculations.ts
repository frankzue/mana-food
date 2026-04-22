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
}): TotalsBreakdown {
  const subtotal_usd = calcularSubtotal(params.items);
  const iva_usd = round2(subtotal_usd * params.iva_rate);
  const envio_usd = round2(params.envio_usd);
  const total_usd = round2(subtotal_usd + iva_usd + envio_usd);
  const total_bs = round2(total_usd * params.tasa_bs);

  return {
    subtotal_usd,
    iva_usd,
    envio_usd,
    total_usd,
    total_bs,
    tasa_bs: params.tasa_bs,
    iva_rate: params.iva_rate,
  };
}
