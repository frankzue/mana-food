import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FinanzasSubNav } from "@/components/admin/FinanzasSubNav";
import type { Pedido, PedidoItem } from "@/types/database";
import { VentasDashboard, type ProductoCostEntry } from "./VentasDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Ventas y reportes",
};

// Tope razonable: 1500 pedidos cubren varios meses de histórico.
// Antes eran 5000, pero traer + ordenar ese volumen + sus items añadía
// segundos innecesarios a cada visita. Si algún día se supera, se pagina.
const MAX_PEDIDOS = 1500;

export default async function AdminVentasPage() {
  const supabase = createSupabaseServerClient();

  // Paralelizamos user, settings, pedidos y productos (son independientes)
  const [userRes, settings, pedidosRes, productosCostoRes] = await Promise.all([
    supabase.auth.getUser(),
    getSettings(),
    supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_PEDIDOS),
    supabase.from("productos").select("nombre, precio_usd, costo_usd"),
  ]);
  const user = userRes.data.user;
  const pedidos = pedidosRes.data;
  const productosCosto = productosCostoRes.data;

  const ids = (pedidos ?? []).map((p: Pedido) => p.id);
  let itemsByPedido: Record<string, PedidoItem[]> = {};
  if (ids.length > 0) {
    const { data: items } = await supabase
      .from("pedido_items")
      .select("*")
      .in("pedido_id", ids);
    for (const it of items ?? []) {
      (itemsByPedido[it.pedido_id] ??= []).push(it as PedidoItem);
    }
  }

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
          <div className="print:hidden space-y-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-mana-muted hover:text-mana-ink transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
            </Link>
            <div>
              <h2 className="font-display text-2xl font-black text-mana-ink flex items-center gap-2">
                <LineChart className="h-6 w-6 text-mana-red" />
                Finanzas
              </h2>
              <p className="text-sm text-mana-muted">
                Reportes de ventas, margen y cierres diarios.
              </p>
            </div>
            <FinanzasSubNav />
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
