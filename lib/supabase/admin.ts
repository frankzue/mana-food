import { createClient } from "@supabase/supabase-js";

/**
 * Cliente admin con service_role key.
 * SOLO usar dentro de API Routes o Server Components (nunca exponer al cliente).
 * Bypasea RLS: úsalo con cuidado.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
