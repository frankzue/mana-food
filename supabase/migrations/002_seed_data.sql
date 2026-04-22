-- =========================================================
-- Maná Fast Food · Seed de datos (menú real + zonas + config)
-- =========================================================

-- ---------- CONFIGURACIÓN INICIAL ----------
insert into public.configuracion (key, value) values
  ('tasa_bs',             '36.50'),
  ('iva',                 '0.16'),
  ('whatsapp_encargado',  '+584120000000'),
  ('nombre_negocio',      'Maná Fast Food'),
  ('moneda_local_simbolo','Bs'),
  ('horario',             'Todos los días de 6:00 PM a 4:00 AM'),
  ('direccion',           'Av. 17 de Diciembre, Frente a la Firestone, 1er Local'),
  ('ciudad',              'Ciudad Bolívar, Venezuela')
on conflict (key) do nothing;

-- ---------- ZONAS DE CIUDAD BOLÍVAR ----------
insert into public.zonas_delivery (nombre, costo_envio_usd, orden) values
  ('Av. 17 de Diciembre (cercanías)', 1.00,  1),
  ('Casco Histórico / Centro',        1.50,  2),
  ('Paseo Orinoco',                    1.50,  3),
  ('Alta Vista',                       2.00,  4),
  ('Los Próceres',                     2.00,  5),
  ('Andrés Eloy Blanco',               2.50,  6),
  ('La Sabanita',                      2.50,  7),
  ('Vista Hermosa',                    3.00,  8),
  ('Marhuanta',                        3.00,  9),
  ('Perro Seco / Santa Fe',            3.50, 10)
on conflict do nothing;

-- ---------- CATEGORÍAS ----------
insert into public.categorias (nombre, slug, orden) values
  ('Hamburguesas',             'hamburguesas',             1),
  ('Hamburguesas Especiales',  'hamburguesas-especiales',  2),
  ('Hot Dog',                  'hot-dog',                  3),
  ('Enrollados',               'enrollados',               4),
  ('Pepitos',                  'pepitos',                  5),
  ('Salchipapas & Especiales', 'salchipapas',              6),
  ('Extras',                   'extras',                   7),
  ('Bebidas',                  'bebidas',                  8)
on conflict (slug) do nothing;

-- ---------- PRODUCTOS ----------
-- Placeholders de Unsplash por categoría. Se reemplazan luego por las fotos IA.
do $$
declare
  cat_hamburguesas      uuid := (select id from public.categorias where slug = 'hamburguesas');
  cat_especiales        uuid := (select id from public.categorias where slug = 'hamburguesas-especiales');
  cat_hotdog            uuid := (select id from public.categorias where slug = 'hot-dog');
  cat_enrollados        uuid := (select id from public.categorias where slug = 'enrollados');
  cat_pepitos           uuid := (select id from public.categorias where slug = 'pepitos');
  cat_salchipapas       uuid := (select id from public.categorias where slug = 'salchipapas');
  cat_extras            uuid := (select id from public.categorias where slug = 'extras');
  cat_bebidas           uuid := (select id from public.categorias where slug = 'bebidas');

  img_hamburguesa       text := 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80';
  img_hamburguesa2      text := 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80';
  img_hotdog            text := 'https://images.unsplash.com/photo-1612392061787-2d078b3e573b?w=800&q=80';
  img_enrollado         text := 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80';
  img_pepito            text := 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80';
  img_salchipapa        text := 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80';
  img_extras            text := 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&q=80';
  img_bebida            text := 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80';
begin

  -- Hamburguesas
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_hamburguesas, 'Sencilla',              'Pan Maná, 150gr de carne res y cerdo, queso amarillo gouda, tocineta, papas de perro, lechuga, cebolla, tomate, salsas tradicionales y especiales.', 5.50, img_hamburguesa, 1),
    (cat_hamburguesas, 'Maná Burger',           'Pan Maná, 150gr de carne res y cerdo, queso amarillo gouda, tocineta, papas de perro, lechuga, cebolla, tomate, salsas tradicionales y especiales.', 7.00, img_hamburguesa2, 2),
    (cat_hamburguesas, 'Maná Super Crispy',     '150gr de pollo crispy, queso amarillo gouda, tocineta, vegetales frescos y nuestras salsas especiales.',                                              7.00, img_hamburguesa, 3),
    (cat_hamburguesas, 'Maná Mixta',            '150gr de carne res y cerdo, pollo, queso amarillo gouda, tocineta, vegetales y salsas especiales.',                                                  9.50, img_hamburguesa2, 4),
    (cat_hamburguesas, 'Maná Chuleta-Crispy',   'Pollo crispy, chuleta ahumada, queso amarillo gouda, tocineta, vegetales y salsas.',                                                                 9.50, img_hamburguesa, 5),
    (cat_hamburguesas, 'Maná Ahumada',          'Chuleta ahumada, 150gr de carne res y cerdo, queso amarillo gouda, tocineta, vegetales y salsas.',                                                  9.50, img_hamburguesa2, 6),
    (cat_hamburguesas, 'Maná Chuleta Ahumada', 'Chuleta ahumada, queso amarillo gouda, tocineta, vegetales frescos y nuestras salsas.',                                                             7.50, img_hamburguesa, 7);

  -- Hamburguesas Especiales
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_especiales, 'Maná Chicken Grill',  '150gr de pollo grill, queso amarillo gouda, tocineta, vegetales y salsas especiales.',                                     7.00, img_hamburguesa,  1),
    (cat_especiales, 'Maná Cheese',         '150gr de carne res y cerdo, queso amarillo gouda fundido extra, tocineta y salsas especiales.',                             8.50, img_hamburguesa2, 2),
    (cat_especiales, 'Maná Cheese Crispy',  '150gr de pollo crispy, queso amarillo gouda fundido extra, tocineta y salsas especiales.',                                  8.00, img_hamburguesa,  3),
    (cat_especiales, 'Maná Trifásica',      '150gr de carne, 150gr de pollo, chuleta ahumada, queso gouda, tocineta y todo lo bueno.',                                  12.00, img_hamburguesa2, 4);

  -- Hot Dog
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_hotdog, 'Maná Sencillo',        'Salchicha nacional, repollo, cebolla, papitas y salsas.',                                             1.80, img_hotdog, 1),
    (cat_hotdog, 'Maná Dog',             'Salchicha nacional, repollo, cebolla, papas, queso amarillo, tocineta y salsas.',                     3.50, img_hotdog, 2),
    (cat_hotdog, 'Maná Classic',         'Con queso parmesano, repollo, cebolla, papas y salsas especiales.',                                    3.50, img_hotdog, 3),
    (cat_hotdog, 'Maná Especial',        'Salchicha especial, queso, tocineta, vegetales frescos y nuestras salsas.',                            5.50, img_hotdog, 4),
    (cat_hotdog, 'Especial Maná Classic','Nuestra salchicha especial con parmesano, tocineta, vegetales y salsas gourmet.',                      6.00, img_hotdog, 5);

  -- Enrollados
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_enrollados, 'Enrollado Mixto',           'Enrollado relleno de carne y pollo, queso, vegetales y salsas especiales.',             12.00, img_enrollado, 1),
    (cat_enrollados, 'Doble Proteína',            'Enrollado XL con doble porción de proteína, quesos, tocineta y salsas.',                22.00, img_enrollado, 2),
    (cat_enrollados, 'Especial Chuleta Ahumada',  'Enrollado con chuleta ahumada, queso gouda, vegetales y salsas gourmet.',              15.00, img_enrollado, 3);

  -- Pepitos
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_pepitos, 'Pepiperro',       'El clásico pepito con carne, queso, papas y todas las salsas.',         8.00,  img_pepito, 1),
    (cat_pepitos, 'Mixto Pepimaná',  'Pepito mixto con carne y pollo, quesos, tocineta y salsas especiales.', 12.00, img_pepito, 2);

  -- Salchipapas & Especiales
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_salchipapas, 'Salchipapa',       'Papas fritas crocantes con salchicha, quesos y salsas.',                        9.00,  img_salchipapa, 1),
    (cat_salchipapas, 'Tender de Pollo',  'Tenders de pollo crispy acompañados de papas y salsas.',                      11.00, img_salchipapa, 2),
    (cat_salchipapas, 'Papas Mixtas',     'Papas con carne, pollo, quesos, tocineta y salsas.',                          11.50, img_salchipapa, 3),
    (cat_salchipapas, 'Tripapas Maná',    'La bomba: papas con carne, pollo, chuleta, quesos, tocineta y todas las salsas.', 13.00, img_salchipapa, 4);

  -- Extras
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_extras, 'Ración de papas 200gr',   'Porción generosa de papas fritas crocantes.', 3.00, img_extras, 1),
    (cat_extras, 'Tocineta',                 'Porción extra de tocineta crujiente.',        2.00, img_extras, 2),
    (cat_extras, 'Queso',                    'Porción extra de queso amarillo gouda.',      1.50, img_extras, 3),
    (cat_extras, 'Salchicha',                'Salchicha extra.',                            2.00, img_extras, 4),
    (cat_extras, 'Pollo',                    'Porción extra de pollo.',                     3.00, img_extras, 5),
    (cat_extras, 'Queso parmesano Kraft',    'Porción extra de queso parmesano.',           2.50, img_extras, 6);

  -- Bebidas (precio placeholder $2.00 según confirmación)
  insert into public.productos (categoria_id, nombre, descripcion, precio_usd, imagen_url, orden) values
    (cat_bebidas, 'Refresco',            'Refresco frío.',               2.00, img_bebida, 1),
    (cat_bebidas, 'Nestea',              'Té helado Nestea.',            2.00, img_bebida, 2),
    (cat_bebidas, 'Jugo de Parchita',    'Jugo natural de parchita.',    2.00, img_bebida, 3);

end $$;
