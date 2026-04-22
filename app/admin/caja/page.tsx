import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Pedido, CierreCaja } from "@/types/database";
import { CajaBoard } from "./CajaBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Cierre de caja",
};

export default async function AdminCajaPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getSettings();

  // Últimos 400 pedidos (cubre varios días)
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(400);

  const { data: cierres } = await supabase
    .from("cierres_caja")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(60);

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
              <Wallet className="h-6 w-6 text-mana-red" />
              Cierre de caja
            </h2>
            <p className="text-sm text-mana-muted">
              Resumen del día + cuadre contra efectivo contado físicamente.
            </p>
          </div>

          <CajaBoard
            pedidos={(pedidos ?? []) as Pedido[]}
            cierres={(cierres ?? []) as CierreCaja[]}
            tasaBs={settings.tasa_bs}
            businessName={settings.nombre_negocio}
          />
        </div>
      </main>
    </>
  );
}
