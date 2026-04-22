import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  tasa_bs: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Tasa inválida")
    .refine((v) => Number(v) > 0, "La tasa debe ser mayor a 0"),
  iva: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "IVA inválido")
    .refine((v) => {
      const n = Number(v);
      return n >= 0 && n <= 1;
    }, "El IVA debe estar entre 0 y 1 (ej: 0.16 = 16%)"),
  whatsapp_encargado: z.string().trim().min(5).max(30),
  // Aceptamos JSON estructurado o texto legacy hasta 2000 chars.
  pago_pagomovil: z.string().trim().max(2000).default(""),
  pago_zelle: z.string().trim().max(2000).default(""),
  pago_binance: z.string().trim().max(2000).default(""),
  pago_transferencia: z.string().trim().max(2000).default(""),
  pago_efectivo_usd: z.string().trim().max(2000).default(""),
  pago_efectivo_bs: z.string().trim().max(2000).default(""),
});

export async function PUT(request: Request) {
  try {
    // 1. Auth: solo admins (authenticated) pueden editar
    const supaAuth = createSupabaseServerClient();
    const {
      data: { user },
    } = await supaAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Validación de inputs
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Upsert con service role (bypass RLS, más predecible)
    const admin = createSupabaseAdminClient();
    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from("configuracion")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("PUT /api/admin/settings", error);
      return NextResponse.json(
        { error: "No se pudo guardar la configuración" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/admin/settings", err);
    return NextResponse.json(
      { error: "Error inesperado del servidor" },
      { status: 500 }
    );
  }
}
