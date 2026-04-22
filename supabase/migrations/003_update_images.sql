-- =========================================================
-- Maná Fast Food · Actualizar imagen_url a WebPs locales
-- Reemplaza las URLs de Unsplash del seed inicial por las
-- imágenes optimizadas en /public/productos/*.webp
-- =========================================================

-- Hamburguesas (categoría cat_hamburguesas + especiales)
update public.productos set imagen_url = '/productos/hamburguesa-especial.webp'
where nombre in (
  'Sencilla',
  'Maná Burger',
  'Maná Super Crispy',
  'Maná Mixta',
  'Maná Chuleta-Crispy',
  'Maná Ahumada',
  'Maná Chuleta Ahumada',
  'Maná Chicken Grill',
  'Maná Cheese',
  'Maná Cheese Crispy',
  'Maná Trifásica'
);

-- Hot Dogs (alternando 2 imágenes)
update public.productos set imagen_url = '/productos/hot-dog.webp'
where nombre in ('Maná Sencillo', 'Maná Classic', 'Especial Maná Classic');

update public.productos set imagen_url = '/productos/hot-dog-2.webp'
where nombre in ('Maná Dog', 'Maná Especial');

-- Enrollados
update public.productos set imagen_url = '/productos/enrollado.webp'
where nombre in (
  'Enrollado Mixto',
  'Doble Proteína',
  'Especial Chuleta Ahumada'
);

-- Pepitos
update public.productos set imagen_url = '/productos/pepito.webp'
where nombre in ('Pepiperro', 'Mixto Pepimaná');

-- Salchipapas & Especiales
update public.productos set imagen_url = '/productos/salchipapas.webp'
where nombre in (
  'Salchipapa',
  'Tender de Pollo',
  'Papas Mixtas',
  'Tripapas Maná'
);

-- Extras
update public.productos set imagen_url = '/productos/papas-extra.webp'      where nombre = 'Ración de papas 200gr';
update public.productos set imagen_url = '/productos/tocineta-extra.webp'   where nombre = 'Tocineta';
update public.productos set imagen_url = '/productos/gouda-extra.webp'      where nombre = 'Queso';
update public.productos set imagen_url = '/productos/salchichas-extra.webp' where nombre = 'Salchicha';
update public.productos set imagen_url = '/productos/pollo-extra.webp'      where nombre = 'Pollo';
update public.productos set imagen_url = '/productos/parmesano-extra.webp'  where nombre = 'Queso parmesano Kraft';

-- Bebidas
update public.productos set imagen_url = '/productos/refresco.webp' where nombre = 'Refresco';
update public.productos set imagen_url = '/productos/nestea.webp'   where nombre = 'Nestea';
update public.productos set imagen_url = '/productos/parchita.webp' where nombre = 'Jugo de Parchita';

-- Verificación: mostrar cuántos productos quedan con URLs de Unsplash (debería ser 0)
select count(*) as productos_con_unsplash
from public.productos
where imagen_url like '%unsplash%';
