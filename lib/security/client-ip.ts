/** IP del cliente (Vercel / proxies). No es 100 % confiable pero sirve para rate limit. */
export function getRequestClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
