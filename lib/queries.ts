import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Categoria,
  Producto,
  ZonaDelivery,
  SettingsMap,
  PedidoConItems,
} from "@/types/database";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  MOCK_SETTINGS,
  MOCK_ZONAS,
} from "@/lib/mock-data";

function hasSupabaseEnv(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSettings(): Promise<SettingsMap> {
  if (!hasSupabaseEnv()) return MOCK_SETTINGS;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.from("configuracion").select("key, value");
    if (!data || data.length === 0) return MOCK_SETTINGS;

    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = row.value;

    return {
      tasa_bs: parseFloat(map.tasa_bs ?? String(MOCK_SETTINGS.tasa_bs)),
      iva: parseFloat(map.iva ?? String(MOCK_SETTINGS.iva)),
      whatsapp_encargado:
        map.whatsapp_encargado ?? MOCK_SETTINGS.whatsapp_encargado,
      nombre_negocio: map.nombre_negocio ?? MOCK_SETTINGS.nombre_negocio,
      moneda_local_simbolo:
        map.moneda_local_simbolo ?? MOCK_SETTINGS.moneda_local_simbolo,
      horario: map.horario ?? MOCK_SETTINGS.horario,
      direccion: map.direccion ?? MOCK_SETTINGS.direccion,
      ciudad: map.ciudad ?? MOCK_SETTINGS.ciudad,
    };
  } catch {
    return MOCK_SETTINGS;
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!hasSupabaseEnv()) return MOCK_CATEGORIAS;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (!data || data.length === 0) return MOCK_CATEGORIAS;
    return data as Categoria[];
  } catch {
    return MOCK_CATEGORIAS;
  }
}

export async function getProductos(): Promise<Producto[]> {
  if (!hasSupabaseEnv()) return MOCK_PRODUCTOS;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("disponible", true)
      .order("orden", { ascending: true });
    if (!data || data.length === 0) return MOCK_PRODUCTOS;
    return data.map((p) => ({
      ...p,
      precio_usd: Number(p.precio_usd),
    })) as Producto[];
  } catch {
    return MOCK_PRODUCTOS;
  }
}

export async function getZonas(): Promise<ZonaDelivery[]> {
  if (!hasSupabaseEnv()) return MOCK_ZONAS;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("zonas_delivery")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (!data || data.length === 0) return MOCK_ZONAS;
    return data.map((z) => ({
      ...z,
      costo_envio_usd: Number(z.costo_envio_usd),
    })) as ZonaDelivery[];
  } catch {
    return MOCK_ZONAS;
  }
}

export async function getPedidoConItems(
  id: string
): Promise<PedidoConItems | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!pedido) return null;

    const { data: items } = await supabase
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", id);

    return {
      ...(pedido as any),
      items: (items ?? []) as any,
    } as PedidoConItems;
  } catch {
    return null;
  }
}

export function isDemoMode(): boolean {
  return !hasSupabaseEnv();
}
