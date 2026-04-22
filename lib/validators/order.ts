import { z } from "zod";

export const orderItemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).max(99),
  modifier_ids: z.array(z.string().max(40)).max(20).optional().default([]),
  notas_item: z.string().max(150).optional().nullable(),
});

export const createOrderSchema = z
  .object({
    cliente_nombre: z
      .string()
      .trim()
      .min(2, "Nombre muy corto")
      .max(80, "Nombre muy largo"),
    cliente_telefono: z
      .string()
      .trim()
      .min(7, "Teléfono inválido")
      .max(20, "Teléfono inválido")
      .regex(/^[+\d\s-]+$/, "Teléfono con caracteres no permitidos"),
    metodo_pago: z.enum([
      "Pago Móvil",
      "Efectivo USD",
      "Efectivo Bs",
      "Transferencia Bs",
      "Zelle",
      "Binance",
    ]),
    modalidad: z.enum(["delivery", "pickup"]).default("delivery"),
    zona_id: z.string().uuid("Zona inválida").optional().nullable(),
    notas: z.string().max(300).optional().nullable(),
    propina_usd: z
      .number()
      .min(0, "Propina inválida")
      .max(1000, "Propina demasiado alta")
      .optional()
      .default(0),
    items: z.array(orderItemSchema).min(1, "El carrito está vacío"),
  })
  .refine(
    (data) => data.modalidad === "pickup" || !!data.zona_id,
    {
      message: "Zona de entrega obligatoria para delivery",
      path: ["zona_id"],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
