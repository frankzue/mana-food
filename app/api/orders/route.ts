import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validators/order";
import { calcularTotales, type CartLine } from "@/lib/utils/calculations";
import { MODIFIER_CATALOG, summarizeModifiers } from "@/lib/modifiers";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientIp } from "@/lib/security/client-ip";
import { isOrdersPostOriginAllowed } from "@/lib/security/orders-origin";
import { publicOrderErrorPayload } from "@/lib/security/sanitize-client-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 5;

export async function POST(request: Request) {
  try {
    if (!isOrdersPostOriginAllowed(request)) {
      return NextResponse.json(
        { error: "Solicitud no permitida desde este origen." },
        { status: 403 }
      );
    }

    const ip = getRequestClientIp(request);
    const rl = checkRateLimit(`orders:${ip}`, RATE_MAX, RATE_WINDOW_MS);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Demasiados pedidos en poco tiempo. Espera un minuto.",
          retry_after_sec: rl.retryAfterSec,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createSupabaseAdminClient();

    const productIds = input.items.map((i) => i.producto_id);

    const queries: any[] = [
      supabase
        .from("productos")
        .select("id, nombre, precio_usd, disponible")
        .in("id", productIds),
      supabase.from("configuracion").select("key, value").in("key", ["tasa_bs", "iva"]),
    ];

    if (input.modalidad === "delivery") {
      queries.push(
        supabase
          .from("zonas_delivery")
          .select("id, nombre, costo_envio_usd, activo")
          .eq("id", input.zona_id)
          .maybeSingle()
      );
    }

    const results: any[] = await Promise.all(queries);
    const { data: productos, error: pErr } = results[0];
    const { data: config } = results[1];
    const zonaResult = input.modalidad === "delivery" ? results[2] : null;

    if (pErr || !productos || productos.length !== input.items.length) {
      return NextResponse.json(
        { error: "Uno o más productos no existen" },
        { status: 400 }
      );
    }

    if (
      input.modalidad === "delivery" &&
      (!zonaResult?.data || zonaResult.error || !zonaResult.data.activo)
    ) {
      return NextResponse.json(
        { error: "Zona de delivery inválida" },
        { status: 400 }
      );
    }

    type ProductoRow = {
      id: string;
      nombre: string;
      precio_usd: number;
      disponible: boolean;
    };
    const productosMap = new Map<string, ProductoRow>(
      productos.map((p: any) => [
        p.id,
        { ...p, precio_usd: Number(p.precio_usd) } as ProductoRow,
      ])
    );

    for (const it of input.items) {
      const prod = productosMap.get(it.producto_id);
      if (!prod || !prod.disponible) {
        return NextResponse.json(
          { error: `Producto no disponible: ${prod?.nombre ?? it.producto_id}` },
          { status: 400 }
        );
      }
    }

    const settingsMap = new Map<string, string>(
      ((config ?? []) as any[]).map((c) => [String(c.key), String(c.value)])
    );
    const iva_rate = parseFloat(settingsMap.get("iva") ?? "0.16");
    const tasa_bs = parseFloat(settingsMap.get("tasa_bs") ?? "36.50");

    const zonaData = zonaResult?.data;
    const envio_usd =
      input.modalidad === "delivery" ? Number(zonaData?.costo_envio_usd ?? 0) : 0;
    const zona_id = input.modalidad === "delivery" ? zonaData?.id ?? null : null;
    const zona_nombre =
      input.modalidad === "delivery"
        ? zonaData?.nombre ?? "Delivery"
        : "Retiro en tienda";

    // Resuelve modificadores contra el catálogo canónico: el cliente solo envía ids,
    // los precios los fija el servidor (inmune a manipulación).
    const cartLines: CartLine[] = input.items.map((it) => {
      const p = productosMap.get(it.producto_id)!;
      const modifierIds = it.modifier_ids ?? [];
      const modsPrice = modifierIds.reduce((sum, id) => {
        const mod = MODIFIER_CATALOG[id];
        return sum + (mod ? mod.price_usd : 0);
      }, 0);
      const modsLabel = summarizeModifiers(modifierIds);
      const nombre = modsLabel ? `${p.nombre} · ${modsLabel}` : p.nombre;
      return {
        producto_id: p.id,
        nombre,
        precio_unit_usd: Number((p.precio_usd + modsPrice).toFixed(2)),
        cantidad: it.cantidad,
      };
    });

    const totales = calcularTotales({
      items: cartLines,
      envio_usd,
      tasa_bs,
      iva_rate,
      propina_usd: input.propina_usd ?? 0,
    });

    const notasArr: string[] = [];
    if (input.notas) notasArr.push(input.notas.trim());
    input.items.forEach((it, idx) => {
      if (it.notas_item) {
        notasArr.push(`(Item ${idx + 1}) ${it.notas_item.trim()}`);
      }
    });
    const notasFinal = notasArr.length > 0 ? notasArr.join(" | ") : null;

    const { data: pedido, error: insertErr } = await supabase
      .from("pedidos")
      .insert({
        cliente_nombre: input.cliente_nombre,
        cliente_telefono: input.cliente_telefono,
        metodo_pago: input.metodo_pago,
        zona_id,
        zona_nombre,
        subtotal_usd: totales.subtotal_usd,
        iva_usd: totales.iva_usd,
        envio_usd: totales.envio_usd,
        propina_usd: totales.propina_usd,
        total_usd: totales.total_usd,
        tasa_bs: totales.tasa_bs,
        total_bs: totales.total_bs,
        estado: "nuevo",
        notas: notasFinal,
      })
      .select("id, numero")
      .single();

    if (insertErr || !pedido) {
      console.error("Error insertando pedido", insertErr);
      return NextResponse.json(
        publicOrderErrorPayload("No se pudo crear el pedido", {
          detalle: insertErr?.message ?? null,
          hint: insertErr?.hint ?? null,
          code: insertErr?.code ?? null,
        }),
        { status: 500 }
      );
    }

    const itemsRows = cartLines.map((cl) => ({
      pedido_id: pedido.id,
      producto_id: cl.producto_id,
      producto_nombre: cl.nombre,
      precio_unit_usd: cl.precio_unit_usd,
      cantidad: cl.cantidad,
      subtotal_usd: Math.round(cl.precio_unit_usd * cl.cantidad * 100) / 100,
    }));

    const { error: itemsErr } = await supabase
      .from("pedido_items")
      .insert(itemsRows);

    if (itemsErr) {
      console.error("Error insertando items", itemsErr);
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      return NextResponse.json(
        publicOrderErrorPayload("No se pudieron crear los items del pedido", {
          detalle: itemsErr.message,
          hint: itemsErr.hint ?? null,
          code: itemsErr.code ?? null,
        }),
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        pedido_id: pedido.id,
        numero: pedido.numero,
        total_usd: totales.total_usd,
        total_bs: totales.total_bs,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/orders", err);
    return NextResponse.json(
      { error: "Error inesperado del servidor" },
      { status: 500 }
    );
  }
}
