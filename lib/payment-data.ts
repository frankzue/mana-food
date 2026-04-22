/**
 * Catálogos y helpers para los datos de pago del negocio.
 *
 * En la tabla `configuracion` guardamos un JSON string por método
 * (pago_pagomovil, pago_zelle, pago_binance, pago_transferencia,
 * pago_efectivo_usd, pago_efectivo_bs).
 *
 * La UI del admin es estructurada (dropdowns + inputs), pero el texto
 * que llega a WhatsApp se formatea aquí (ver `formatPaymentBlock`).
 *
 * Backward compat: si el valor guardado NO es JSON (viene de la versión
 * anterior), se trata como texto plano y se respeta tal cual.
 */

export const BANCOS_VE: { code: string; nombre: string }[] = [
  { code: "0102", nombre: "Banco de Venezuela" },
  { code: "0104", nombre: "Venezolano de Crédito" },
  { code: "0105", nombre: "Mercantil" },
  { code: "0108", nombre: "Provincial (BBVA)" },
  { code: "0114", nombre: "Bancaribe" },
  { code: "0115", nombre: "Exterior" },
  { code: "0128", nombre: "Caroní" },
  { code: "0134", nombre: "Banesco" },
  { code: "0137", nombre: "Sofitasa" },
  { code: "0138", nombre: "Plaza" },
  { code: "0151", nombre: "Fondo Común" },
  { code: "0156", nombre: "100% Banco" },
  { code: "0157", nombre: "Del Sur" },
  { code: "0163", nombre: "Banco del Tesoro" },
  { code: "0166", nombre: "Agrícola de Venezuela" },
  { code: "0168", nombre: "Bancrecer" },
  { code: "0169", nombre: "Mi Banco" },
  { code: "0171", nombre: "Banco Activo" },
  { code: "0172", nombre: "Bancamiga" },
  { code: "0174", nombre: "Banplus" },
  { code: "0175", nombre: "Bicentenario" },
  { code: "0177", nombre: "BFC / Banfanb" },
  { code: "0191", nombre: "Nacional de Crédito (BNC)" },
];

export function nombreBanco(code: string): string {
  const b = BANCOS_VE.find((x) => x.code === code);
  return b ? `${b.code} ${b.nombre}` : code;
}

/**
 * Versión corta y legible para el mensaje de WhatsApp del cliente.
 * Elimina el código y los prefijos "Banco de / Banco del" para que quede
 * limpio: "0102 Banco de Venezuela" -> "Venezuela", "0134 Banesco" -> "Banesco".
 */
export function nombreBancoCorto(code: string): string {
  const b = BANCOS_VE.find((x) => x.code === code);
  if (!b) return code;
  return b.nombre
    .replace(/^Banco de\s+/i, "")
    .replace(/^Banco del\s+/i, "")
    .trim();
}

export const OPERADORAS_VE = ["0412", "0414", "0416", "0424", "0426"] as const;

export const TIPOS_DOCUMENTO = [
  { code: "V", label: "V - Venezolano" },
  { code: "E", label: "E - Extranjero" },
  { code: "J", label: "J - Jurídico" },
  { code: "G", label: "G - Gobierno" },
  { code: "P", label: "P - Pasaporte" },
] as const;

export const TIPOS_CUENTA = [
  { code: "corriente", label: "Corriente" },
  { code: "ahorro", label: "Ahorro" },
] as const;

export const REDES_CRIPTO = [
  "USDT TRC20 (Tron)",
  "USDT BEP20 (BNB Chain)",
  "USDT ERC20 (Ethereum)",
  "USDC TRC20",
  "USDC BEP20",
  "BTC",
  "BNB",
] as const;

// =========================================================
// Tipos de datos estructurados
// =========================================================
export type PagoMovilData = {
  kind: "pagomovil";
  banco: string; // código 0102 etc.
  doc_tipo: string; // V/E/J/G/P
  doc_numero: string;
  operadora: string; // 0412, 0414, ...
  telefono: string; // 7 dígitos
  titular: string;
};

export type ZelleData = {
  kind: "zelle";
  email: string;
  titular: string;
  banco: string; // opcional, libre
};

export type BinanceData = {
  kind: "binance";
  binance_id: string;
  redes: string[]; // ej: ["USDT TRC20", "USDT BEP20"]
  titular: string;
};

export type TransferenciaData = {
  kind: "transferencia";
  banco: string;
  tipo_cuenta: string; // corriente|ahorro
  cuenta: string; // 20 dígitos idealmente
  doc_tipo: string;
  doc_numero: string;
  titular: string;
};

export type EfectivoData = {
  kind: "efectivo";
  nota: string;
};

export type PaymentData =
  | PagoMovilData
  | ZelleData
  | BinanceData
  | TransferenciaData
  | EfectivoData;

// =========================================================
// Defaults (formulario vacío)
// =========================================================
export const emptyPagoMovil: PagoMovilData = {
  kind: "pagomovil",
  banco: "",
  doc_tipo: "V",
  doc_numero: "",
  operadora: "0412",
  telefono: "",
  titular: "",
};

export const emptyZelle: ZelleData = {
  kind: "zelle",
  email: "",
  titular: "",
  banco: "",
};

export const emptyBinance: BinanceData = {
  kind: "binance",
  binance_id: "",
  redes: [],
  titular: "",
};

export const emptyTransferencia: TransferenciaData = {
  kind: "transferencia",
  banco: "",
  tipo_cuenta: "corriente",
  cuenta: "",
  doc_tipo: "J",
  doc_numero: "",
  titular: "",
};

export const emptyEfectivo: EfectivoData = {
  kind: "efectivo",
  nota: "",
};

// =========================================================
// Parsing con backward compatibility
// =========================================================

function safeJson<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === "object") return o as T;
  } catch {
    /* no es JSON, probablemente texto legacy */
  }
  return null;
}

export function parsePagoMovil(raw: string): PagoMovilData {
  const o = safeJson<PagoMovilData>(raw);
  if (o && o.kind === "pagomovil") return { ...emptyPagoMovil, ...o };
  return emptyPagoMovil;
}

export function parseZelle(raw: string): ZelleData {
  const o = safeJson<ZelleData>(raw);
  if (o && o.kind === "zelle") return { ...emptyZelle, ...o };
  return emptyZelle;
}

export function parseBinance(raw: string): BinanceData {
  const o = safeJson<BinanceData>(raw);
  if (o && o.kind === "binance") {
    return { ...emptyBinance, ...o, redes: Array.isArray(o.redes) ? o.redes : [] };
  }
  return emptyBinance;
}

export function parseTransferencia(raw: string): TransferenciaData {
  const o = safeJson<TransferenciaData>(raw);
  if (o && o.kind === "transferencia") return { ...emptyTransferencia, ...o };
  return emptyTransferencia;
}

export function parseEfectivo(raw: string): EfectivoData {
  const o = safeJson<EfectivoData>(raw);
  if (o && o.kind === "efectivo") return { ...emptyEfectivo, ...o };
  // Si venía como texto plano (legacy) lo dejamos como nota
  return { kind: "efectivo", nota: raw || "" };
}

/** Detecta si un raw legacy es texto plano (se respeta en el mensaje de WhatsApp). */
export function isLegacyPlainText(raw: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return true;
  try {
    JSON.parse(trimmed);
    return false;
  } catch {
    return true;
  }
}

// =========================================================
// Formateadores → texto que va al cliente por WhatsApp
// =========================================================

function line(label: string, value?: string | null): string | null {
  if (!value) return null;
  return `${label}: ${value}`;
}

export function formatPagoMovil(d: PagoMovilData): string {
  const tel =
    d.operadora && d.telefono
      ? `${d.operadora}-${d.telefono.replace(/\D/g, "")}`
      : "";
  const cedula =
    d.doc_tipo && d.doc_numero ? `${d.doc_tipo}-${d.doc_numero}` : "";

  return [
    line("Banco", d.banco ? nombreBancoCorto(d.banco) : ""),
    line("C.I.", cedula),
    line("Teléfono", tel),
    line("Titular", d.titular),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatZelle(d: ZelleData): string {
  return [
    line("Email", d.email),
    line("Titular", d.titular),
    line("Banco", d.banco),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatBinance(d: BinanceData): string {
  return [
    line("Binance ID", d.binance_id),
    line("Redes", d.redes.join(", ")),
    line("Titular", d.titular),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatTransferencia(d: TransferenciaData): string {
  const tipo =
    TIPOS_CUENTA.find((t) => t.code === d.tipo_cuenta)?.label ?? d.tipo_cuenta;
  const cedula =
    d.doc_tipo && d.doc_numero ? `${d.doc_tipo}-${d.doc_numero}` : "";
  // Formato visual de cuenta: XXXX-XXXX-XX-XXXXXXXXXX
  const digits = (d.cuenta ?? "").replace(/\D/g, "");
  const cuentaFmt =
    digits.length === 20
      ? `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(
          8,
          10
        )}-${digits.slice(10)}`
      : d.cuenta;
  return [
    line("Banco", d.banco ? nombreBancoCorto(d.banco) : ""),
    line("Tipo de cuenta", tipo),
    line("N° de cuenta", cuentaFmt),
    line("C.I.", cedula),
    line("Titular", d.titular),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatEfectivo(d: EfectivoData): string {
  return (d.nota ?? "").trim();
}

/**
 * Formatea el bloque de pago leyendo el `raw` crudo desde la config
 * (auto-detecta JSON vs texto legacy).
 */
export function formatPaymentBlock(
  method: "pagomovil" | "zelle" | "binance" | "transferencia" | "efectivo",
  raw: string
): string {
  if (!raw) return "";
  if (isLegacyPlainText(raw)) return raw.trim();
  switch (method) {
    case "pagomovil":
      return formatPagoMovil(parsePagoMovil(raw));
    case "zelle":
      return formatZelle(parseZelle(raw));
    case "binance":
      return formatBinance(parseBinance(raw));
    case "transferencia":
      return formatTransferencia(parseTransferencia(raw));
    case "efectivo":
      return formatEfectivo(parseEfectivo(raw));
  }
}
