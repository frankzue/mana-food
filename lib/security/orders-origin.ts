/**
 * Comprueba que POST /api/orders provenga de un origen esperado (anti-CSRF
 * básico y abuso desde otros sitios). En desarrollo permite localhost.
 */

function collectAllowedOrigins(): Set<string> {
  const set = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      set.add(new URL(site).origin);
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      set.add(new URL(`https://${vercel}`).origin);
    } catch {
      /* ignore */
    }
  }
  const extra = process.env.EXTRA_ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(/[,;\s]+/)) {
      const p = part.trim();
      if (!p) continue;
      try {
        set.add(new URL(p).origin);
      } catch {
        /* ignore */
      }
    }
  }
  if (process.env.NODE_ENV !== "production") {
    set.add("http://localhost:3000");
    set.add("http://127.0.0.1:3000");
  }
  return set;
}

let cachedOrigins: Set<string> | undefined;

function allowedOrigins(): Set<string> {
  if (!cachedOrigins) cachedOrigins = collectAllowedOrigins();
  return cachedOrigins;
}

/**
 * true = permitir el request.
 * Si no hay NEXT_PUBLIC_SITE_URL en prod, se exige al menos Sec-Fetch-Site same-origin.
 */
export function isOrdersPostOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const allowed = allowedOrigins();
  if (origin) {
    if (allowed.size === 0 && process.env.NODE_ENV === "production") {
      return false;
    }
    return allowed.size === 0 || allowed.has(origin);
  }

  // Sin Origin: en producción solo navegadores que declaran mismo sitio
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return true;
}
