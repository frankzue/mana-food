import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertAdminEmailAllowed } from "@/lib/security/admin-allowlist";

export type AdminApiUser = { id: string; email: string | undefined };

/**
 * Autenticación + lista blanca de correo para rutas /api/admin/*.
 */
export async function requireAdminApi(): Promise<
  { ok: true; user: AdminApiUser } | { ok: false; response: NextResponse }
> {
  const supa = createSupabaseServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  if (!assertAdminEmailAllowed(user.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso no autorizado para este usuario" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email },
  };
}
