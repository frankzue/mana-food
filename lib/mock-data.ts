import type {
  Categoria,
  Producto,
  ZonaDelivery,
  SettingsMap,
} from "@/types/database";

export const MOCK_SETTINGS: SettingsMap = {
  tasa_bs: 36.5,
  iva: 0.16,
  whatsapp_encargado: "+584120000000",
  nombre_negocio: "Maná Fast Food",
  moneda_local_simbolo: "Bs",
  horario: "Todos los días de 6:00 PM a 4:00 AM",
  direccion: "Av. 17 de Diciembre, Frente a la Firestone, 1er Local",
  ciudad: "Ciudad Bolívar, Venezuela",
  pago_pagomovil: "",
  pago_zelle: "",
  pago_binance: "",
  pago_transferencia: "",
  pago_efectivo_usd: "",
  pago_efectivo_bs: "",
};

export const MOCK_CATEGORIAS: Categoria[] = [
  { id: "cat-1", nombre: "Hamburguesas",             slug: "hamburguesas",            orden: 1, activo: true, created_at: "" },
  { id: "cat-2", nombre: "Hamburguesas Especiales",  slug: "hamburguesas-especiales", orden: 2, activo: true, created_at: "" },
  { id: "cat-3", nombre: "Hot Dog",                  slug: "hot-dog",                 orden: 3, activo: true, created_at: "" },
  { id: "cat-4", nombre: "Enrollados",               slug: "enrollados",              orden: 4, activo: true, created_at: "" },
  { id: "cat-5", nombre: "Pepitos",                  slug: "pepitos",                 orden: 5, activo: true, created_at: "" },
  { id: "cat-6", nombre: "Salchipapas & Especiales", slug: "salchipapas",             orden: 6, activo: true, created_at: "" },
  { id: "cat-7", nombre: "Extras",                   slug: "extras",                  orden: 7, activo: true, created_at: "" },
  { id: "cat-8", nombre: "Bebidas",                  slug: "bebidas",                 orden: 8, activo: true, created_at: "" },
];

// WebP locales en /public/productos/ (optimizadas desde PNG, ~900px, q=82).
// Para productos sin imagen real, dejamos null y el card muestra emoji grande.
const IMG = {
  hamburguesa:       "/productos/hamburguesa-especial.webp",
  hamburguesaEsp:    "/productos/hamburguesa-especial.webp",
  hotdog1:           "/productos/hot-dog.webp",
  hotdog2:           "/productos/hot-dog-2.webp",
  pepito:            "/productos/pepito.webp",
  enrollado:         "/productos/enrollado.webp",
  salchipapas:       "/productos/salchipapas.webp",
  papasExtra:        "/productos/papas-extra.webp",
  tocinetaExtra:     "/productos/tocineta-extra.webp",
  goudaExtra:        "/productos/gouda-extra.webp",
  salchichasExtra:   "/productos/salchichas-extra.webp",
  polloExtra:        "/productos/pollo-extra.webp",
  parmesanoExtra:    "/productos/parmesano-extra.webp",
  refresco:          "/productos/refresco.webp",
  nestea:            "/productos/nestea.webp",
  parchita:          "/productos/parchita.webp",
};

function mk(
  id: string,
  categoria_id: string,
  nombre: string,
  descripcion: string,
  precio_usd: number,
  imagen_url: string | null,
  orden: number
): Producto {
  return {
    id,
    categoria_id,
    nombre,
    descripcion,
    precio_usd,
    imagen_url,
    disponible: true,
    orden,
    created_at: "",
  };
}

export const MOCK_PRODUCTOS: Producto[] = [
  // Hamburguesas (nueva imagen Hamburguesa-especial.png)
  mk("p-1",  "cat-1", "Sencilla",              "Pan Maná, 150gr de carne res y cerdo, queso amarillo gouda, tocineta, papas de perro, lechuga, cebolla, tomate, salsas tradicionales y especiales.", 5.50,  IMG.hamburguesa, 1),
  mk("p-2",  "cat-1", "Maná Burger",           "Pan Maná, 150gr de carne res y cerdo, queso gouda, tocineta, papas, vegetales frescos y salsas especiales.",                                         7.00,  IMG.hamburguesa, 2),
  mk("p-3",  "cat-1", "Maná Super Crispy",     "150gr de pollo crispy, queso gouda, tocineta, vegetales frescos y salsas especiales.",                                                              7.00,  IMG.hamburguesa, 3),
  mk("p-4",  "cat-1", "Maná Mixta",            "150gr de carne res y cerdo + pollo, queso gouda, tocineta, vegetales y salsas.",                                                                     9.50,  IMG.hamburguesa, 4),
  mk("p-5",  "cat-1", "Maná Chuleta-Crispy",   "Pollo crispy, chuleta ahumada, queso gouda, tocineta, vegetales y salsas.",                                                                          9.50,  IMG.hamburguesa, 5),
  mk("p-6",  "cat-1", "Maná Ahumada",          "Chuleta ahumada, 150gr de carne res y cerdo, queso gouda, tocineta, vegetales y salsas.",                                                            9.50,  IMG.hamburguesa, 6),
  mk("p-7",  "cat-1", "Maná Chuleta Ahumada",  "Chuleta ahumada, queso gouda, tocineta, vegetales y salsas.",                                                                                        7.50,  IMG.hamburguesa, 7),

  // Hamburguesas Especiales
  mk("p-8",  "cat-2", "Maná Chicken Grill",    "150gr de pollo grill, queso gouda, tocineta, vegetales y salsas especiales.",                                                                       7.00,  IMG.hamburguesaEsp, 1),
  mk("p-9",  "cat-2", "Maná Cheese",           "150gr de carne res y cerdo, queso gouda fundido extra, tocineta y salsas especiales.",                                                              8.50,  IMG.hamburguesaEsp, 2),
  mk("p-10", "cat-2", "Maná Cheese Crispy",    "150gr de pollo crispy, queso gouda fundido extra, tocineta y salsas especiales.",                                                                   8.00,  IMG.hamburguesaEsp, 3),
  mk("p-11", "cat-2", "Maná Trifásica",        "150gr de carne, 150gr de pollo, chuleta ahumada, queso gouda, tocineta y todo lo bueno.",                                                           12.00, IMG.hamburguesaEsp, 4),

  // Hot Dog (alternando hot_dog.png y hot_dog_2.png)
  mk("p-12", "cat-3", "Maná Sencillo",         "Salchicha nacional, repollo, cebolla, papitas y salsas.",                                                                                           1.80,  IMG.hotdog1, 1),
  mk("p-13", "cat-3", "Maná Dog",              "Salchicha nacional, repollo, cebolla, papas, queso amarillo, tocineta y salsas.",                                                                   3.50,  IMG.hotdog2, 2),
  mk("p-14", "cat-3", "Maná Classic",          "Queso parmesano, repollo, cebolla, papas y salsas especiales.",                                                                                     3.50,  IMG.hotdog1, 3),
  mk("p-15", "cat-3", "Maná Especial",         "Salchicha especial, queso, tocineta, vegetales frescos y salsas.",                                                                                  5.50,  IMG.hotdog2, 4),
  mk("p-16", "cat-3", "Especial Maná Classic", "Nuestra salchicha especial con parmesano, tocineta, vegetales y salsas gourmet.",                                                                   6.00,  IMG.hotdog1, 5),

  // Enrollados
  mk("p-17", "cat-4", "Enrollado Mixto",              "Enrollado relleno de carne y pollo, queso, vegetales y salsas especiales.",          12.00, IMG.enrollado, 1),
  mk("p-18", "cat-4", "Doble Proteína",               "Enrollado XL con doble porción de proteína, quesos, tocineta y salsas.",             22.00, IMG.enrollado, 2),
  mk("p-19", "cat-4", "Especial Chuleta Ahumada",     "Enrollado con chuleta ahumada, queso gouda, vegetales y salsas gourmet.",            15.00, IMG.enrollado, 3),

  // Pepitos
  mk("p-20", "cat-5", "Pepiperro",      "El clásico pepito con carne, queso, papas y todas las salsas.",         8.00,  IMG.pepito, 1),
  mk("p-21", "cat-5", "Mixto Pepimaná", "Pepito mixto con carne y pollo, quesos, tocineta y salsas especiales.", 12.00, IMG.pepito, 2),

  // Salchipapas
  mk("p-22", "cat-6", "Salchipapa",      "Papas fritas crocantes con salchicha, quesos y salsas.",                              9.00,  IMG.salchipapas, 1),
  mk("p-23", "cat-6", "Tender de Pollo", "Tenders de pollo crispy acompañados de papas y salsas.",                              11.00, IMG.salchipapas, 2),
  mk("p-24", "cat-6", "Papas Mixtas",    "Papas con carne, pollo, quesos, tocineta y salsas.",                                  11.50, IMG.salchipapas, 3),
  mk("p-25", "cat-6", "Tripapas Maná",   "La bomba: papas con carne, pollo, chuleta, quesos, tocineta y todas las salsas.",     13.00, IMG.salchipapas, 4),

  // Extras
  mk("p-26", "cat-7", "Ración de papas 200gr", "Porción generosa de papas fritas crocantes.", 3.00, IMG.papasExtra,      1),
  mk("p-27", "cat-7", "Tocineta",              "Porción extra de tocineta crujiente.",        2.00, IMG.tocinetaExtra,   2),
  mk("p-28", "cat-7", "Queso",                 "Porción extra de queso amarillo gouda.",      1.50, IMG.goudaExtra,      3),
  mk("p-29", "cat-7", "Salchicha",             "Salchicha extra.",                            2.00, IMG.salchichasExtra, 4),
  mk("p-30", "cat-7", "Pollo",                 "Porción extra de pollo.",                     3.00, IMG.polloExtra,      5),
  mk("p-31", "cat-7", "Queso parmesano Kraft", "Porción extra de queso parmesano.",           2.50, IMG.parmesanoExtra,  6),

  // Bebidas
  mk("p-32", "cat-8", "Refresco",         "Refresco frío.",             2.00, IMG.refresco, 1),
  mk("p-33", "cat-8", "Nestea",           "Té helado Nestea.",          2.00, IMG.nestea,   2),
  mk("p-34", "cat-8", "Jugo de Parchita", "Jugo natural de parchita.",  2.00, IMG.parchita, 3),
];

export const MOCK_ZONAS: ZonaDelivery[] = [
  { id: "z-1",  nombre: "Av. 17 de Diciembre (cercanías)", costo_envio_usd: 1.00, activo: true, orden: 1 },
  { id: "z-2",  nombre: "Casco Histórico / Centro",         costo_envio_usd: 1.50, activo: true, orden: 2 },
  { id: "z-3",  nombre: "Paseo Orinoco",                    costo_envio_usd: 1.50, activo: true, orden: 3 },
  { id: "z-4",  nombre: "Alta Vista",                       costo_envio_usd: 2.00, activo: true, orden: 4 },
  { id: "z-5",  nombre: "Los Próceres",                     costo_envio_usd: 2.00, activo: true, orden: 5 },
  { id: "z-6",  nombre: "Andrés Eloy Blanco",               costo_envio_usd: 2.50, activo: true, orden: 6 },
  { id: "z-7",  nombre: "La Sabanita",                      costo_envio_usd: 2.50, activo: true, orden: 7 },
  { id: "z-8",  nombre: "Vista Hermosa",                    costo_envio_usd: 2.50, activo: true, orden: 8 },
  { id: "z-9",  nombre: "Marhuanta",                        costo_envio_usd: 3.00, activo: true, orden: 9 },
  { id: "z-10", nombre: "Perro Seco / Santa Fe",            costo_envio_usd: 3.50, activo: true, orden: 10 },
];
