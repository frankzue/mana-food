import { NextResponse } from "next/server";
import { getRequestClientIp } from "@/lib/security/client-ip";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  requireAdminApi,
  type AdminApiUser,
} from "@/lib/security/require-admin-api";

/** Límite por IP e instancia (serverless); mitiga abuso de service role. */
const ADMIN_RATE_MAX = 100;
const ADMIN_RATE_WINDOW_MS = 60_000;

export async function guardAdminMutation(request: Request): Promise<
  { ok: true; user: AdminApiUser } | { ok: false; response: NextResponse }
> {
  const ip = getRequestClientIp(request);
  const rl = checkRateLimit(
    `admin:${ip}`,
    ADMIN_RATE_MAX,
    ADMIN_RATE_WINDOW_MS
  );
  if (!rl.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      ),
    };
  }
  return requireAdminApi();
}
