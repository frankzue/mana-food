import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/productos
 * Actualiza campos editables de un producto: precio, costo, disponibilidad,
 * nombre y descripción. Sólo admins autenticados.
 */

const patchSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(120).optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  precio_usd: z
    .number()
    .finite()
    .nonnegative()
    .max(10_000)
    .optional(),
  costo_usd: z
    .number()
    .finite()
    .nonnegative()
    .max(10_000)
    .optional(),
  disponible: z.boolean().optional(),
  orden: z.number().int().min(0).max(9999).optional(),
});

export async function PATCH(request: Request) {
  try {
    const supaAuth = createSupabaseServerClient();
    const {
      data: { user },
    } = await supaAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nada para actualizar" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("productos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/admin/productos", error);
      return NextResponse.json(
        {
          error: "No se pudo actualizar el producto",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, producto: data });
  } catch (err) {
    console.error("PATCH /api/admin/productos", err);
    return NextResponse.json(
      { error: "Error inesperado del servidor" },
      { status: 500 }
    );
  }
}
