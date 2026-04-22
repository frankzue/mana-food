import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type {
  Pedido,
  PedidoConItems,
  PedidoItem,
} from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Pedidos en tiempo real",
};

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getSettings();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (pedidos ?? []).map((p) => p.id);
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

  const initial: PedidoConItems[] = (pedidos ?? []).map((p: Pedido) => ({
    ...p,
    items: itemsByPedido[p.id] ?? [],
  }));

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container py-5 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black text-mana-ink">
              Pedidos
            </h2>
            <p className="text-sm text-mana-muted">
              Los nuevos pedidos aparecen automáticamente.
            </p>
          </div>
          <OrdersBoard
            initialPedidos={initial}
            businessName={settings.nombre_negocio}
          />
        </div>
      </main>
    </>
  );
}
