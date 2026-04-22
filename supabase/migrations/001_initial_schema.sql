-- =========================================================
-- Maná Fast Food · Schema inicial
-- Ejecutar en Supabase SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- CATEGORIES ----------
create table if not exists public.categorias (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  slug         text unique not null,
  orden        int  not null default 0,
  activo       bool not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists public.productos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references public.categorias(id) on delete restrict,
  nombre        text not null,
  descripcion   text,
  precio_usd    numeric(10,2) not null check (precio_usd >= 0),
  imagen_url    text,
  disponible    bool not null default true,
  orden         int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_productos_categoria on public.productos(categoria_id);

-- ---------- DELIVERY ZONES ----------
create table if not exists public.zonas_delivery (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  costo_envio_usd    numeric(10,2) not null check (costo_envio_usd >= 0),
  activo             bool not null default true,
  orden              int  not null default 0
);

-- ---------- SETTINGS (key/value) ----------
create table if not exists public.configuracion (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

-- ---------- ORDERS ----------
create table if not exists public.pedidos (
  id                  uuid primary key default gen_random_uuid(),
  numero              bigserial unique,
  cliente_nombre      text not null,
  cliente_telefono    text not null,
  metodo_pago         text not null,
  zona_id             uuid references public.zonas_delivery(id) on delete set null,
  zona_nombre         text not null,
  subtotal_usd        numeric(10,2) not null,
  iva_usd             numeric(10,2) not null,
  envio_usd           numeric(10,2) not null,
  total_usd           numeric(10,2) not null,
  tasa_bs             numeric(10,2) not null,
  total_bs            numeric(12,2) not null,
  estado              text not null default 'nuevo' check (estado in ('nuevo','contactado','completado','cancelado')),
  notas               text,
  created_at          timestamptz not null default now()
);
create index if not exists idx_pedidos_created on public.pedidos(created_at desc);
create index if not exists idx_pedidos_estado on public.pedidos(estado);

-- ---------- ORDER ITEMS ----------
create table if not exists public.pedido_items (
  id                 uuid primary key default gen_random_uuid(),
  pedido_id          uuid not null references public.pedidos(id) on delete cascade,
  producto_id        uuid references public.productos(id) on delete set null,
  producto_nombre    text not null,
  precio_unit_usd    numeric(10,2) not null,
  cantidad           int  not null check (cantidad > 0),
  subtotal_usd       numeric(10,2) not null
);
create index if not exists idx_pedido_items_pedido on public.pedido_items(pedido_id);

-- =========================================================
-- REALTIME: publicar cambios de pedidos y items
-- =========================================================
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.pedido_items;

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table public.categorias      enable row level security;
alter table public.productos       enable row level security;
alter table public.zonas_delivery  enable row level security;
alter table public.configuracion   enable row level security;
alter table public.pedidos         enable row level security;
alter table public.pedido_items    enable row level security;

-- Lectura pública del catálogo y configuración
create policy "lectura pública categorias"
  on public.categorias for select using (activo = true);

create policy "lectura pública productos"
  on public.productos for select using (disponible = true);

create policy "lectura pública zonas"
  on public.zonas_delivery for select using (activo = true);

create policy "lectura pública configuracion"
  on public.configuracion for select using (true);

-- El panel admin usa service_role (bypass RLS), por lo que los INSERT/UPDATE
-- de pedidos los hará la API Route con service_role.
-- Bloqueamos escritura pública por defecto.

-- Cualquier autenticado puede leer pedidos (panel admin)
create policy "admins leen pedidos"
  on public.pedidos for select to authenticated using (true);

create policy "admins actualizan pedidos"
  on public.pedidos for update to authenticated using (true);

create policy "admins leen items"
  on public.pedido_items for select to authenticated using (true);

create policy "admins gestionan catalogo - categorias"
  on public.categorias for all to authenticated using (true) with check (true);

create policy "admins gestionan catalogo - productos"
  on public.productos for all to authenticated using (true) with check (true);

create policy "admins gestionan zonas"
  on public.zonas_delivery for all to authenticated using (true) with check (true);

create policy "admins gestionan configuracion"
  on public.configuracion for all to authenticated using (true) with check (true);
