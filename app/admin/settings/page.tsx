import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Configuración",
};

export default async function AdminSettingsPage() {
  const supabase = createSupabaseServerClient();

  const [userRes, settings] = await Promise.all([
    supabase.auth.getUser(),
    getSettings(),
  ]);
  const user = userRes.data.user;

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container-admin py-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs text-mana-muted hover:text-mana-ink transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
              </Link>
              <h2 className="font-display text-2xl font-black text-mana-ink mt-1 flex items-center gap-2">
                <Settings className="h-6 w-6 text-mana-red" />
                Configuración
              </h2>
              <p className="text-sm text-mana-muted">
                Tasa BCV, IVA y datos de pago para enviar por WhatsApp.
              </p>
            </div>
          </div>

          <SettingsForm initial={settings} />
        </div>
      </main>
    </>
  );
}
