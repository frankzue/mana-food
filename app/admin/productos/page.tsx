import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Producto, Categoria } from "@/types/database";
import { ProductosBoard } from "./ProductosBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel · Productos",
};

export default async function AdminProductosPage() {
  const supabase = createSupabaseServerClient();

  const [userRes, categoriasRes, productosRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("categorias").select("*").order("orden", { ascending: true }),
    supabase
      .from("productos")
      .select("*")
      .order("orden", { ascending: true }),
  ]);
  const user = userRes.data.user;

  return (
    <>
      <AdminHeader email={user?.email} />
      <main className="min-h-screen bg-mana-cream">
        <div className="container-admin py-5 space-y-5">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-mana-muted hover:text-mana-ink transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a pedidos
            </Link>
            <h2 className="font-display text-2xl font-black text-mana-ink mt-1 flex items-center gap-2">
              <Package className="h-6 w-6 text-mana-red" />
              Productos
            </h2>
            <p className="text-sm text-mana-muted">
              Edita precios, costos y disponibilidad. Los cambios se reflejan al
              instante en la tienda.
            </p>
          </div>

          <ProductosBoard
            productos={(productosRes.data ?? []) as Producto[]}
            categorias={(categoriasRes.data ?? []) as Categoria[]}
          />
        </div>
      </main>
    </>
  );
}
