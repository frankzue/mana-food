/**
 * Recordatorio de actualización de tasa BCV (panel admin).
 *
 * Reglas (negocio Venezuela):
 * - Lun–Vie: el BCV suele publicar entre ~15:00 y 16:00 (hora Caracas).
 * - A partir de las 16:00 Caracas, si la tasa no se ha "confirmado" hoy
 *   (último cambio de valor con fecha de hoy en Caracas), se muestra aviso.
 * - Sábado y domingo: no se avisa (se mantiene la última tasa del viernes).
 *
 * La fecha de referencia es `tasa_bs_ultima_actualizacion` en `configuracion`
 * (ISO 8601), actualizada solo en la API cuando cambia el valor numérico de
 * `tasa_bs`, no cuando se guardan otros campos del formulario.
 */

const TZ = "America/Caracas";

/** Hora local Caracas (0–23, 0–59) a partir de un instante UTC. */
export function getCaracasClock(d: Date): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { hour, minute };
}

/** Fecha calendario YYYY-MM-DD en Caracas. */
export function dateKeyCaracas(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Sábado o domingo en Caracas. */
export function isWeekendCaracas(d: Date): boolean {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  return wd === "Sat" || wd === "Sun";
}

/**
 * Minutos desde medianoche Caracas (para comparar >= 16:00).
 * Umbral por defecto: 16:00 = 960 minutos.
 */
function minutesSinceMidnightCaracas(d: Date): number {
  const { hour, minute } = getCaracasClock(d);
  return hour * 60 + minute;
}

const DEFAULT_AFTER_MINUTES = 16 * 60; // 16:00

/**
 * ¿Debe mostrarse el recordatorio de actualizar la tasa?
 *
 * @param now - normalmente `new Date()`
 * @param ultimaActualizacionIso - valor de configuracion `tasa_bs_ultima_actualizacion`, o null si no existe
 * @param afterMinutes - desde cuántos minutos desde medianoche Caracas exigir actualización (default 16:00)
 */
export function shouldAlertStaleTasaBcV(
  now: Date,
  ultimaActualizacionIso: string | null | undefined,
  afterMinutes: number = DEFAULT_AFTER_MINUTES
): boolean {
  if (isWeekendCaracas(now)) return false;
  if (minutesSinceMidnightCaracas(now) < afterMinutes) return false;
  if (!ultimaActualizacionIso || !ultimaActualizacionIso.trim()) return false;

  const ultima = new Date(ultimaActualizacionIso.trim());
  if (Number.isNaN(ultima.getTime())) return false;

  const todayKey = dateKeyCaracas(now);
  const ultimaKey = dateKeyCaracas(ultima);
  return ultimaKey < todayKey;
}

export function tasaBcVReminderMessage(): string {
  return "Revisa la tasa BCV del día (normalmente publicada lun–vie entre 15:00 y 16:00, hora Caracas). Fin de semana suele mantenerse la del viernes.";
}
