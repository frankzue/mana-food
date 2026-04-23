/**
 * Rate limiting en memoria por proceso (sin Redis).
 * Vercel/serverless: cada instancia tiene su propio contador; sigue siendo
 * útil frente a abuso casual. Limpia entradas expiradas para no crecer sin límite.
 */

type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();
const MAX_KEYS = 20_000;

function prune(now: number, windowMs: number) {
  if (store.size < MAX_KEYS) return;
  const cutoff = now - windowMs * 2;
  for (const [k, v] of store) {
    if (v.windowStart < cutoff) store.delete(k);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * @param key identificador (ej. `orders:192.168.x.x` o `admin:ip`)
 * @param max máximo de hits en la ventana
 * @param windowMs duración de la ventana en ms
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (store.size >= MAX_KEYS && Math.random() < 0.05) {
    prune(now, windowMs);
  }

  const rec = store.get(key);
  if (!rec || now - rec.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  rec.count += 1;
  if (rec.count > max) {
    const retryAfterSec = Math.ceil((rec.windowStart + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true };
}
