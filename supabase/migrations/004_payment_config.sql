-- =========================================================
-- Maná Fast Food · Datos de pago para WhatsApp
-- Estos valores se inyectan en el mensaje que el admin
-- copia/envía al cliente según el método de pago elegido.
-- EDITA los valores con tus datos reales (cédula, nro, etc.)
-- =========================================================

insert into public.configuracion (key, value) values
  ('pago_pagomovil',
   'Banco: 0102 Venezuela
C.I.: V-12345678
Teléfono: 0412-1234567
Titular: Maná Fast Food C.A.'),

  ('pago_zelle',
   'Email: pagos@manafastfood.com
Titular: Mana Fast Food
Banco: Bank of America'),

  ('pago_binance',
   'BinanceID: 123456789
Red: USDT (BEP20 / TRC20)'),

  ('pago_transferencia',
   'Banco: 0134 Banesco
Cuenta: 0134-0000-00-0000000000
Titular: Maná Fast Food C.A.
RIF: J-00000000-0'),

  ('pago_efectivo_usd',
   'Se paga en efectivo al entregar. Trae el monto exacto si es posible.'),

  ('pago_efectivo_bs',
   'Se paga en efectivo al entregar. Monto calculado a la tasa del día.')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();
