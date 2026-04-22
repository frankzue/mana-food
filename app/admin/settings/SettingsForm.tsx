"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DollarSign,
  Percent,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  CreditCard,
  Banknote,
  Send,
  Smartphone,
  Eye,
  EyeOff,
  User,
  Mail,
} from "lucide-react";
import type { SettingsMap } from "@/types/database";
import { useRouter } from "next/navigation";
import {
  BANCOS_VE,
  OPERADORAS_VE,
  TIPOS_DOCUMENTO,
  TIPOS_CUENTA,
  REDES_CRIPTO,
  emptyPagoMovil,
  emptyZelle,
  emptyBinance,
  emptyTransferencia,
  emptyEfectivo,
  parsePagoMovil,
  parseZelle,
  parseBinance,
  parseTransferencia,
  parseEfectivo,
  formatPagoMovil,
  formatZelle,
  formatBinance,
  formatTransferencia,
  formatEfectivo,
  type PagoMovilData,
  type ZelleData,
  type BinanceData,
  type TransferenciaData,
  type EfectivoData,
} from "@/lib/payment-data";

type Props = {
  initial: SettingsMap;
};

type FormState = {
  tasa_bs: string;
  iva: string;
  whatsapp_encargado: string;
  pagomovil: PagoMovilData;
  zelle: ZelleData;
  binance: BinanceData;
  transferencia: TransferenciaData;
  efectivo_usd: EfectivoData;
  efectivo_bs: EfectivoData;
};

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState<FormState>(() => ({
    tasa_bs: String(initial.tasa_bs ?? ""),
    iva: String(initial.iva ?? ""),
    whatsapp_encargado: initial.whatsapp_encargado ?? "",
    pagomovil: parsePagoMovil(initial.pago_pagomovil ?? ""),
    zelle: parseZelle(initial.pago_zelle ?? ""),
    binance: parseBinance(initial.pago_binance ?? ""),
    transferencia: parseTransferencia(initial.pago_transferencia ?? ""),
    efectivo_usd: parseEfectivo(initial.pago_efectivo_usd ?? ""),
    efectivo_bs: parseEfectivo(initial.pago_efectivo_bs ?? ""),
  }));

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  function updateBasic<K extends "tasa_bs" | "iva" | "whatsapp_encargado">(
    key: K,
    value: string
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    markDirty();
  }

  function patchPagoMovil(patch: Partial<PagoMovilData>) {
    setForm((f) => ({ ...f, pagomovil: { ...f.pagomovil, ...patch } }));
    markDirty();
  }
  function patchZelle(patch: Partial<ZelleData>) {
    setForm((f) => ({ ...f, zelle: { ...f.zelle, ...patch } }));
    markDirty();
  }
  function patchBinance(patch: Partial<BinanceData>) {
    setForm((f) => ({ ...f, binance: { ...f.binance, ...patch } }));
    markDirty();
  }
  function patchTransferencia(patch: Partial<TransferenciaData>) {
    setForm((f) => ({
      ...f,
      transferencia: { ...f.transferencia, ...patch },
    }));
    markDirty();
  }
  function patchEfectivoUsd(patch: Partial<EfectivoData>) {
    setForm((f) => ({ ...f, efectivo_usd: { ...f.efectivo_usd, ...patch } }));
    markDirty();
  }
  function patchEfectivoBs(patch: Partial<EfectivoData>) {
    setForm((f) => ({ ...f, efectivo_bs: { ...f.efectivo_bs, ...patch } }));
    markDirty();
  }

  const previews = useMemo(
    () => ({
      pagomovil: formatPagoMovil(form.pagomovil),
      zelle: formatZelle(form.zelle),
      binance: formatBinance(form.binance),
      transferencia: formatTransferencia(form.transferencia),
      efectivo_usd: formatEfectivo(form.efectivo_usd),
      efectivo_bs: formatEfectivo(form.efectivo_bs),
    }),
    [form]
  );

  function isPagoMovilFilled(d: PagoMovilData): boolean {
    return !!(d.banco || d.doc_numero || d.telefono || d.titular);
  }
  function isZelleFilled(d: ZelleData): boolean {
    return !!(d.email || d.titular);
  }
  function isBinanceFilled(d: BinanceData): boolean {
    return !!(d.binance_id || d.redes.length || d.titular);
  }
  function isTransferenciaFilled(d: TransferenciaData): boolean {
    return !!(d.banco || d.cuenta || d.doc_numero || d.titular);
  }
  function isEfectivoFilled(d: EfectivoData): boolean {
    return !!d.nota.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // Normalizar: si un método no tiene datos → guardar como cadena vacía.
    const body = {
      tasa_bs: form.tasa_bs,
      iva: form.iva,
      whatsapp_encargado: form.whatsapp_encargado,
      pago_pagomovil: isPagoMovilFilled(form.pagomovil)
        ? JSON.stringify(form.pagomovil)
        : "",
      pago_zelle: isZelleFilled(form.zelle) ? JSON.stringify(form.zelle) : "",
      pago_binance: isBinanceFilled(form.binance)
        ? JSON.stringify(form.binance)
        : "",
      pago_transferencia: isTransferenciaFilled(form.transferencia)
        ? JSON.stringify(form.transferencia)
        : "",
      pago_efectivo_usd: isEfectivoFilled(form.efectivo_usd)
        ? JSON.stringify(form.efectivo_usd)
        : "",
      pago_efectivo_bs: isEfectivoFilled(form.efectivo_bs)
        ? JSON.stringify(form.efectivo_bs)
        : "",
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No se pudo guardar");
          return;
        }
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Error de red. Intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* --------- TASAS & GENERAL --------- */}
      <section className="card-mana p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-black text-mana-ink">
            Tasas y general
          </h2>
          <p className="text-xs text-mana-muted">
            La tasa BCV se aplica a todos los pedidos nuevos. Actualízala cada
            día si cambia.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Tasa BCV (1 USD = X Bs)"
            icon={<DollarSign className="h-4 w-4 text-mana-red" />}
            hint="Ej: 36.50"
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.tasa_bs}
              onChange={(e) => updateBasic("tasa_bs", e.target.value)}
              className="input-mana"
              placeholder="36.50"
              required
            />
          </Field>

          <Field
            label="IVA (informativo, decimal 0–1)"
            icon={<Percent className="h-4 w-4 text-mana-red" />}
            hint="Los precios ya lo incluyen. Se usa solo para reportes."
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.iva}
              onChange={(e) => updateBasic("iva", e.target.value)}
              className="input-mana"
              placeholder="0.16"
              required
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="WhatsApp del encargado"
              icon={<Phone className="h-4 w-4 text-mana-red" />}
              hint="Con código de país, ej: +584120000000"
            >
              <input
                type="text"
                value={form.whatsapp_encargado}
                onChange={(e) =>
                  updateBasic("whatsapp_encargado", e.target.value)
                }
                className="input-mana"
                placeholder="+584120000000"
                required
              />
            </Field>
          </div>
        </div>
      </section>

      {/* --------- DATOS DE PAGO --------- */}
      <section className="card-mana p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-black text-mana-ink">
              Datos de pago
            </h2>
            <p className="text-xs text-mana-muted max-w-prose">
              Estos datos se insertan automáticamente en el mensaje de WhatsApp
              que envías al cliente, según el método que eligió. Deja en blanco
              los que no uses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/10 px-3 py-1.5 text-xs font-semibold text-mana-ink hover:ring-mana-red/40 transition"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Ocultar vista previa
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Ver vista previa
              </>
            )}
          </button>
        </div>

        {/* Pago Móvil */}
        <MethodCard
          title="Pago Móvil"
          icon={<Smartphone className="h-4 w-4 text-mana-red" />}
          preview={showPreview ? previews.pagomovil : ""}
          filled={isPagoMovilFilled(form.pagomovil)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Banco">
              <select
                className="input-mana"
                value={form.pagomovil.banco}
                onChange={(e) => patchPagoMovil({ banco: e.target.value })}
              >
                <option value="">— Selecciona —</option>
                {BANCOS_VE.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} · {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Titular" icon={<User className="h-3.5 w-3.5 text-mana-red" />}>
              <input
                type="text"
                className="input-mana"
                placeholder="Nombre del titular o razón social"
                value={form.pagomovil.titular}
                onChange={(e) => patchPagoMovil({ titular: e.target.value })}
              />
            </Field>

            <Field label="Documento">
              <div className="flex gap-2">
                <select
                  className="input-mana w-24"
                  value={form.pagomovil.doc_tipo}
                  onChange={(e) =>
                    patchPagoMovil({ doc_tipo: e.target.value })
                  }
                >
                  {TIPOS_DOCUMENTO.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-mana flex-1"
                  placeholder="12345678"
                  value={form.pagomovil.doc_numero}
                  onChange={(e) =>
                    patchPagoMovil({
                      doc_numero: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </Field>

            <Field label="Teléfono">
              <div className="flex gap-2">
                <select
                  className="input-mana w-24"
                  value={form.pagomovil.operadora}
                  onChange={(e) =>
                    patchPagoMovil({ operadora: e.target.value })
                  }
                >
                  {OPERADORAS_VE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-mana flex-1"
                  placeholder="1234567"
                  maxLength={7}
                  value={form.pagomovil.telefono}
                  onChange={(e) =>
                    patchPagoMovil({
                      telefono: e.target.value.replace(/\D/g, "").slice(0, 7),
                    })
                  }
                />
              </div>
            </Field>
          </div>
        </MethodCard>

        {/* Zelle */}
        <MethodCard
          title="Zelle"
          icon={<Send className="h-4 w-4 text-mana-red" />}
          preview={showPreview ? previews.zelle : ""}
          filled={isZelleFilled(form.zelle)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" icon={<Mail className="h-3.5 w-3.5 text-mana-red" />}>
              <input
                type="email"
                className="input-mana"
                placeholder="pagos@tudominio.com"
                value={form.zelle.email}
                onChange={(e) => patchZelle({ email: e.target.value })}
              />
            </Field>
            <Field label="Titular">
              <input
                type="text"
                className="input-mana"
                placeholder="Nombre completo del titular"
                value={form.zelle.titular}
                onChange={(e) => patchZelle({ titular: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Banco (opcional)" hint="Ej: Bank of America, Chase, Wells Fargo">
                <input
                  type="text"
                  className="input-mana"
                  placeholder="Opcional"
                  value={form.zelle.banco}
                  onChange={(e) => patchZelle({ banco: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </MethodCard>

        {/* Binance */}
        <MethodCard
          title="Binance / Cripto"
          icon={<CreditCard className="h-4 w-4 text-mana-red" />}
          preview={showPreview ? previews.binance : ""}
          filled={isBinanceFilled(form.binance)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Binance ID / Pay ID">
              <input
                type="text"
                className="input-mana"
                placeholder="123456789"
                value={form.binance.binance_id}
                onChange={(e) =>
                  patchBinance({ binance_id: e.target.value })
                }
              />
            </Field>
            <Field label="Titular">
              <input
                type="text"
                className="input-mana"
                placeholder="Nombre del titular"
                value={form.binance.titular}
                onChange={(e) => patchBinance({ titular: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Redes aceptadas" hint="Marca las que recibes">
                <div className="flex flex-wrap gap-1.5">
                  {REDES_CRIPTO.map((r) => {
                    const active = form.binance.redes.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() =>
                          patchBinance({
                            redes: active
                              ? form.binance.redes.filter((x) => x !== r)
                              : [...form.binance.redes, r],
                          })
                        }
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold transition ring-1",
                          active
                            ? "bg-mana-red text-white ring-mana-red"
                            : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                        ].join(" ")}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
        </MethodCard>

        {/* Transferencia Bs */}
        <MethodCard
          title="Transferencia Bs"
          icon={<CreditCard className="h-4 w-4 text-mana-red" />}
          preview={showPreview ? previews.transferencia : ""}
          filled={isTransferenciaFilled(form.transferencia)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Banco">
              <select
                className="input-mana"
                value={form.transferencia.banco}
                onChange={(e) =>
                  patchTransferencia({ banco: e.target.value })
                }
              >
                <option value="">— Selecciona —</option>
                {BANCOS_VE.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} · {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tipo de cuenta">
              <select
                className="input-mana"
                value={form.transferencia.tipo_cuenta}
                onChange={(e) =>
                  patchTransferencia({ tipo_cuenta: e.target.value })
                }
              >
                {TIPOS_CUENTA.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="N° de cuenta (20 dígitos)">
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-mana font-mono tracking-wide"
                  placeholder="01340000000000000000"
                  maxLength={24}
                  value={form.transferencia.cuenta}
                  onChange={(e) =>
                    patchTransferencia({
                      cuenta: e.target.value.replace(/\D/g, "").slice(0, 20),
                    })
                  }
                />
              </Field>
            </div>

            <Field label="Documento">
              <div className="flex gap-2">
                <select
                  className="input-mana w-24"
                  value={form.transferencia.doc_tipo}
                  onChange={(e) =>
                    patchTransferencia({ doc_tipo: e.target.value })
                  }
                >
                  {TIPOS_DOCUMENTO.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-mana flex-1"
                  placeholder="00000000"
                  value={form.transferencia.doc_numero}
                  onChange={(e) =>
                    patchTransferencia({
                      doc_numero: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </Field>

            <Field label="Titular">
              <input
                type="text"
                className="input-mana"
                placeholder="Razón social o nombre"
                value={form.transferencia.titular}
                onChange={(e) =>
                  patchTransferencia({ titular: e.target.value })
                }
              />
            </Field>
          </div>
        </MethodCard>

        {/* Efectivo */}
        <div className="grid gap-3 md:grid-cols-2">
          <MethodCard
            title="Efectivo USD"
            icon={<Banknote className="h-4 w-4 text-mana-red" />}
            preview={showPreview ? previews.efectivo_usd : ""}
            filled={isEfectivoFilled(form.efectivo_usd)}
            compact
          >
            <Field
              label="Instrucciones para el cliente"
              hint="Ej: Se paga al entregar. Trae el monto exacto si es posible."
            >
              <textarea
                rows={3}
                maxLength={300}
                className="input-mana resize-none"
                placeholder="Se paga al entregar..."
                value={form.efectivo_usd.nota}
                onChange={(e) => patchEfectivoUsd({ nota: e.target.value })}
              />
            </Field>
          </MethodCard>

          <MethodCard
            title="Efectivo Bs"
            icon={<Banknote className="h-4 w-4 text-mana-red" />}
            preview={showPreview ? previews.efectivo_bs : ""}
            filled={isEfectivoFilled(form.efectivo_bs)}
            compact
          >
            <Field
              label="Instrucciones para el cliente"
              hint="Ej: Se paga al entregar al cambio del día."
            >
              <textarea
                rows={3}
                maxLength={300}
                className="input-mana resize-none"
                placeholder="Se paga al entregar..."
                value={form.efectivo_bs.nota}
                onChange={(e) => patchEfectivoBs({ nota: e.target.value })}
              />
            </Field>
          </MethodCard>
        </div>
      </section>

      {/* --------- FOOTER --------- */}
      <div className="sticky bottom-4 z-10">
        <div className="card-mana p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="text-sm">
            {error && <p className="text-red-600 font-semibold">{error}</p>}
            {saved && (
              <p className="text-mana-success font-semibold inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Guardado. Los cambios se
                aplican a los nuevos pedidos.
              </p>
            )}
            {!saved && !error && (
              <p className="text-mana-muted">
                Los clientes verán los nuevos valores inmediatamente al hacer
                un pedido.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary whitespace-nowrap"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-mana-ink mb-1">
        {icon}
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-mana-muted mt-1">{hint}</span>}
    </label>
  );
}

function MethodCard({
  title,
  icon,
  filled,
  preview,
  compact = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  filled: boolean;
  preview: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 sm:p-5 transition",
        filled
          ? "border-mana-success/40 bg-mana-success/5"
          : "border-black/10 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2">
          {icon}
          <h3 className="font-display font-bold text-mana-ink">{title}</h3>
        </div>
        {filled ? (
          <span className="chip bg-mana-success/15 text-mana-success ring-1 ring-mana-success/30">
            <CheckCircle2 className="h-3 w-3" /> Configurado
          </span>
        ) : (
          <span className="chip bg-mana-cream-dark text-mana-muted">
            Sin configurar
          </span>
        )}
      </div>

      <div className={compact ? "" : ""}>{children}</div>

      {preview && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-mana-cream p-3 text-[12px] font-mono text-mana-ink ring-1 ring-black/5">
          {preview}
        </pre>
      )}
    </div>
  );
}
