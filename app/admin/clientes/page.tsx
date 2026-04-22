import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Pedido } from "@/types/database";
import { ClientesBoard } from "./ClientesBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Clientes",
};

const MAX_PEDIDOS = 5000;

export default async function AdminClientesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_PEDIDOS);

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container py-5 space-y-5">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-mana-muted hover:text-mana-ink transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
            </Link>
            <h2 className="font-display text-2xl font-black text-mana-ink mt-1 flex items-center gap-2">
              <Users className="h-6 w-6 text-mana-red" />
              Clientes
            </h2>
            <p className="text-sm text-mana-muted">
              Agrupados por número de teléfono. Clic en una fila para ver su
              historial.
            </p>
          </div>

          <ClientesBoard pedidos={(pedidos ?? []) as Pedido[]} />
        </div>
      </main>
    </>
  );
}
