export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
  created_at: string;
};

export type Producto = {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio_usd: number;
  costo_usd?: number; // Opcional: existe desde migración 006 (para margen)
  imagen_url: string | null;
  disponible: boolean;
  orden: number;
  created_at: string;
};

export type ProductoConCategoria = Producto & {
  categoria: Pick<Categoria, "id" | "nombre" | "slug">;
};

export type ZonaDelivery = {
  id: string;
  nombre: string;
  costo_envio_usd: number;
  activo: boolean;
  orden: number;
};

export type Configuracion = {
  key: string;
  value: string;
  updated_at: string;
};

export type EstadoPedido =
  | "nuevo"
  | "contactado"
  | "pagado"
  | "completado"
  | "cancelado"
  | "devuelto";

export type Pedido = {
  id: string;
  numero: number;
  cliente_nombre: string;
  cliente_telefono: string;
  metodo_pago: string;
  zona_id: string | null;
  zona_nombre: string;
  subtotal_usd: number;
  iva_usd: number;
  envio_usd: number;
  propina_usd?: number; // Opcional: existe desde la migración 006
  total_usd: number;
  tasa_bs: number;
  total_bs: number;
  estado: EstadoPedido;
  notas: string | null;
  created_at: string;
  // Devoluciones (opcionales; existen desde la migración 005)
  devuelto_at?: string | null;
  devuelto_monto_usd?: number | null;
  motivo_devolucion?: string | null;
};

// Cierre de caja diario (migración 006)
export type CierreCaja = {
  id: string;
  fecha: string; // YYYY-MM-DD
  cerrado_at: string;
  cerrado_por: string | null;
  ventas_brutas_usd: number;
  devoluciones_usd: number;
  ventas_netas_usd: number;
  propinas_usd: number;
  envios_usd: number;
  pedidos_count: number;
  completados_count: number;
  devueltos_count: number;
  cancelados_count: number;
  desglose_metodo: Record<string, { total: number; count: number }>;
  efectivo_usd_contado: number | null;
  efectivo_bs_contado: number | null;
  tasa_bs: number | null;
  diferencia_usd: number | null;
  notas: string | null;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  producto_nombre: string;
  precio_unit_usd: number;
  cantidad: number;
  subtotal_usd: number;
};

export type PedidoConItems = Pedido & {
  items: PedidoItem[];
};

export type SettingsMap = {
  tasa_bs: number;
  iva: number;
  whatsapp_encargado: string;
  nombre_negocio: string;
  moneda_local_simbolo: string;
  horario: string;
  direccion: string;
  ciudad: string;
  // Datos de pago que el admin copia al mensaje de WhatsApp.
  // Se configuran en la tabla `configuracion` con estas mismas keys.
  pago_pagomovil: string;
  pago_zelle: string;
  pago_binance: string;
  pago_transferencia: string;
  pago_efectivo_usd: string;
  pago_efectivo_bs: string;
};
