-- =========================================================
-- Migration 006 — Nivel 1 quick wins
--   · Estado "pagado" (entre contactado y completado)
--   · Propinas en pedidos (propina_usd)
--   · Costo de productos (para margen) → productos.costo_usd
--   · Cierres de caja diarios (tabla cierres_caja)
-- =========================================================

-- 1) Nuevo estado "pagado"
alter table public.pedidos drop constraint if exists pedidos_estado_check;
alter table public.pedidos
  add constraint pedidos_estado_check
  check (estado in ('nuevo','contactado','pagado','completado','cancelado','devuelto'));

-- 2) Propinas (NO modifica total_usd histórico; solo suma en pedidos nuevos)
alter table public.pedidos
  add column if not exists propina_usd numeric(10,2) not null default 0;

-- 3) Costo por producto (para calcular margen real)
alter table public.productos
  add column if not exists costo_usd numeric(10,2) not null default 0;

-- 4) Cierres de caja diarios
create table if not exists public.cierres_caja (
  id                     uuid primary key default gen_random_uuid(),
  fecha                  date not null unique,
  cerrado_at             timestamptz not null default now(),
  cerrado_por            text,
  ventas_brutas_usd      numeric(10,2) not null default 0,
  devoluciones_usd       numeric(10,2) not null default 0,
  ventas_netas_usd       numeric(10,2) not null default 0,
  propinas_usd           numeric(10,2) not null default 0,
  envios_usd             numeric(10,2) not null default 0,
  pedidos_count          int not null default 0,
  completados_count      int not null default 0,
  devueltos_count        int not null default 0,
  cancelados_count       int not null default 0,
  desglose_metodo        jsonb not null default '{}'::jsonb,
  efectivo_usd_contado   numeric(10,2),
  efectivo_bs_contado    numeric(12,2),
  tasa_bs                numeric(10,2),
  diferencia_usd         numeric(10,2),
  notas                  text
);
create index if not exists idx_cierres_caja_fecha on public.cierres_caja(fecha desc);

-- RLS para cierres_caja: solo admins autenticados
alter table public.cierres_caja enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cierres_caja'
      and policyname = 'admins gestionan cierres'
  ) then
    create policy "admins gestionan cierres"
      on public.cierres_caja for all to authenticated
      using (true) with check (true);
  end if;
end $$;
