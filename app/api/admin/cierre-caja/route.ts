import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { guardAdminMutation } from "@/lib/security/admin-api-guard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  ventas_brutas_usd: z.number().min(0),
  devoluciones_usd: z.number().min(0),
  ventas_netas_usd: z.number().min(0),
  propinas_usd: z.number().min(0),
  envios_usd: z.number().min(0),
  pedidos_count: z.number().int().min(0),
  completados_count: z.number().int().min(0),
  devueltos_count: z.number().int().min(0),
  cancelados_count: z.number().int().min(0),
  desglose_metodo: z.record(
    z.string(),
    z.object({ total: z.number(), count: z.number().int() })
  ),
  efectivo_usd_contado: z.number().nullable().optional(),
  efectivo_bs_contado: z.number().nullable().optional(),
  tasa_bs: z.number().nullable().optional(),
  diferencia_usd: z.number().nullable().optional(),
  notas: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const gate = await guardAdminMutation(request);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("cierres_caja")
      .upsert(
        {
          ...parsed.data,
          cerrado_por: gate.user.email ?? null,
          cerrado_at: new Date().toISOString(),
        },
        { onConflict: "fecha" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("POST /api/admin/cierre-caja", error);
      return NextResponse.json(
        { error: "No se pudo guardar el cierre" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("POST /api/admin/cierre-caja", err);
    return NextResponse.json(
      { error: "Error inesperado del servidor" },
      { status: 500 }
    );
  }
}
