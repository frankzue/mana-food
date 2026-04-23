import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FinanzasSubNav } from "@/components/admin/FinanzasSubNav";
import type { Pedido, CierreCaja } from "@/types/database";
import { CajaBoard } from "./CajaBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Cierre de caja",
};

export default async function AdminCajaPage() {
  const supabase = createSupabaseServerClient();

  // Paralelizamos las 4 consultas independientes
  const [userRes, settings, pedidosRes, cierresRes] = await Promise.all([
    supabase.auth.getUser(),
    getSettings(),
    supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("cierres_caja")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(60),
  ]);
  const user = userRes.data.user;
  const pedidos = pedidosRes.data;
  const cierres = cierresRes.data;

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container-admin py-5 space-y-5">
          <div className="space-y-3">
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
                Resumen del día + cuadre contra efectivo contado físicamente.
              </p>
            </div>
            <FinanzasSubNav />
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
