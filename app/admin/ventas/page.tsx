import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Pedido, PedidoItem } from "@/types/database";
import { VentasDashboard, type ProductoCostEntry } from "./VentasDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Ventas y reportes",
};

const MAX_PEDIDOS = 5000;

export default async function AdminVentasPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getSettings();

  // Traemos todo el histórico (tope 5000) con sus items para poder calcular
  // top productos y hacer filtros por fecha en cliente.
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_PEDIDOS);

  const ids = (pedidos ?? []).map((p: Pedido) => p.id);
  let itemsByPedido: Record<string, PedidoItem[]> = {};
  if (ids.length > 0) {
    // Supabase limita por defecto a 1000 filas; para 5000 pedidos podemos
    // necesitar múltiples fetches. Por ahora tope simple.
    const { data: items } = await supabase
      .from("pedido_items")
      .select("*")
      .in("pedido_id", ids);
    for (const it of items ?? []) {
      (itemsByPedido[it.pedido_id] ??= []).push(it as PedidoItem);
    }
  }

  // Productos con costo para calcular margen (opcional; columna existe desde migración 006)
  const { data: productosCosto } = await supabase
    .from("productos")
    .select("nombre, precio_usd, costo_usd");
  const productosCostoMap: Record<string, ProductoCostEntry> = {};
  for (const p of (productosCosto ?? []) as any[]) {
    productosCostoMap[p.nombre] = {
      precio_usd: Number(p.precio_usd ?? 0),
      costo_usd: Number(p.costo_usd ?? 0),
    };
  }

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container py-5 space-y-5 print:py-0">
          <div className="print:hidden">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-mana-muted hover:text-mana-ink transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
            </Link>
            <h2 className="font-display text-2xl font-black text-mana-ink mt-1 flex items-center gap-2">
              <LineChart className="h-6 w-6 text-mana-red" />
              Ventas y reportes
            </h2>
            <p className="text-sm text-mana-muted">
              Todos los pedidos están guardados en la base de datos
              permanentemente.
            </p>
          </div>

          <VentasDashboard
            pedidos={(pedidos ?? []) as Pedido[]}
            itemsByPedido={itemsByPedido}
            productosCosto={productosCostoMap}
            businessName={settings.nombre_negocio}
          />
        </div>
      </main>
    </>
  );
}
