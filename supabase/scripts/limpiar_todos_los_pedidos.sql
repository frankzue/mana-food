-- =========================================================
-- Vaciar pedidos y líneas (clientes derivan de pedidos)
-- Ejecutar UNA VEZ en Supabase → SQL Editor
-- =========================================================
-- Borra todo el historial de pedidos. pedido_items se elimina en cascada.
-- Reinicia el contador `numero` (bigserial) desde 1.
-- NO toca productos, categorías, configuración ni cierres de caja.
-- =========================================================

truncate table public.pedidos restart identity cascade;

-- Verificación (debe dar 0):
-- select count(*) from public.pedidos;
-- select count(*) from public.pedido_items;
