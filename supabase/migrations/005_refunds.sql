-- =========================================================
-- Migration 005 — Devoluciones (refunds)
-- =========================================================
-- Añade soporte para registrar devoluciones (totales o parciales)
-- de un pedido. No elimina datos históricos: la devolución queda
-- registrada aparte para poder calcular ventas netas.
-- =========================================================

-- 1) Nuevo estado "devuelto" en el check constraint
alter table public.pedidos drop constraint if exists pedidos_estado_check;
alter table public.pedidos
  add constraint pedidos_estado_check
  check (estado in ('nuevo','contactado','completado','cancelado','devuelto'));

-- 2) Columnas de devolución
alter table public.pedidos
  add column if not exists devuelto_at           timestamptz,
  add column if not exists devuelto_monto_usd    numeric(10,2),
  add column if not exists motivo_devolucion     text;

-- 3) Índice para reportes rápidos de devoluciones
create index if not exists idx_pedidos_devuelto_at
  on public.pedidos(devuelto_at)
  where devuelto_at is not null;
