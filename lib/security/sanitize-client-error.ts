/**
 * Evita filtrar detalles internos (Postgres, stack) al cliente en producción.
 */

export function publicOrderErrorPayload(
  message: string,
  detail?: {
    detalle?: string | null;
    hint?: string | null;
    code?: string | null;
  }
) {
  if (process.env.NODE_ENV === "production") {
    return { error: message };
  }
  return {
    error: message,
    detalle: detail?.detalle ?? null,
    hint: detail?.hint ?? null,
    code: detail?.code ?? null,
  };
}
