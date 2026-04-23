/**
 * Lista blanca opcional de correos que pueden usar el panel admin.
 *
 * Si no defines variables de entorno, cualquier usuario autenticado en
 * Supabase puede entrar (comportamiento anterior). En producción se
 * recomienda fijar ADMIN_EMAIL o ADMIN_EMAILS.
 *
 * ADMIN_EMAILS=uno@x.com,dos@x.com  (coma, sin espacios raros)
 * ADMIN_EMAIL=uno@x.com             (un solo correo; legacy)
 */

function normalizeList(): string[] | null {
  const multi = process.env.ADMIN_EMAILS?.trim();
  if (multi) {
    const parts = multi
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return parts.length > 0 ? parts : null;
  }
  const single = process.env.ADMIN_EMAIL?.trim();
  if (single) return [single.toLowerCase()];
  return null;
}

let cached: string[] | null | undefined;

function allowedEmails(): string[] | null {
  if (cached !== undefined) return cached;
  cached = normalizeList();
  return cached;
}

/** Invalida caché (solo tests). */
export function __resetAdminAllowlistCache() {
  cached = undefined;
}

export function isAdminEmailAllowlistConfigured(): boolean {
  const a = allowedEmails();
  return a != null && a.length > 0;
}

export function assertAdminEmailAllowed(email: string | null | undefined): boolean {
  const allowed = allowedEmails();
  if (!allowed) return true;
  if (!email) return false;
  return allowed.includes(email.trim().toLowerCase());
}
