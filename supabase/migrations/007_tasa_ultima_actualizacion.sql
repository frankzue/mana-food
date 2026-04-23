-- Última vez que cambió el valor numérico de tasa_bs (la API lo mantiene).
-- Evita falsos avisos cuando solo se guardan pagos u otros campos.

insert into public.configuracion (key, value, updated_at)
select
  'tasa_bs_ultima_actualizacion',
  coalesce(
    (select updated_at::text from public.configuracion where key = 'tasa_bs' limit 1),
    now()::text
  ),
  now()
where not exists (
  select 1 from public.configuracion c where c.key = 'tasa_bs_ultima_actualizacion'
);

-- Campana admin: escuchar cambios en configuracion (tasa) en tiempo real
alter publication supabase_realtime add table public.configuracion;
