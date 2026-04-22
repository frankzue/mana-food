"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import type { SettingsMap } from "@/types/database";
import { useRouter } from "next/navigation";

type Props = {
  initial: SettingsMap;
};

type FormState = {
  tasa_bs: string;
  iva: string;
  whatsapp_encargado: string;
  pago_pagomovil: string;
  pago_zelle: string;
  pago_binance: string;
  pago_transferencia: string;
  pago_efectivo_usd: string;
  pago_efectivo_bs: string;
};

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    tasa_bs: String(initial.tasa_bs ?? ""),
    iva: String(initial.iva ?? ""),
    whatsapp_encargado: initial.whatsapp_encargado ?? "",
    pago_pagomovil: initial.pago_pagomovil ?? "",
    pago_zelle: initial.pago_zelle ?? "",
    pago_binance: initial.pago_binance ?? "",
    pago_transferencia: initial.pago_transferencia ?? "",
    pago_efectivo_usd: initial.pago_efectivo_usd ?? "",
    pago_efectivo_bs: initial.pago_efectivo_bs ?? "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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
              onChange={(e) => update("tasa_bs", e.target.value)}
              className="input-mana"
              placeholder="36.50"
              required
            />
          </Field>

          <Field
            label="IVA (decimal 0–1)"
            icon={<Percent className="h-4 w-4 text-mana-red" />}
            hint="Ej: 0.16 = 16%"
          >
            <input
              type="text"
              inputMode="decimal"
              value={form.iva}
              onChange={(e) => update("iva", e.target.value)}
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
                onChange={(e) => update("whatsapp_encargado", e.target.value)}
                className="input-mana"
                placeholder="+584120000000"
                required
              />
            </Field>
          </div>
        </div>
      </section>

      {/* --------- DATOS DE PAGO --------- */}
      <section className="card-mana p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-black text-mana-ink">
            Datos de pago
          </h2>
          <p className="text-xs text-mana-muted">
            Estos datos se insertan automáticamente en el mensaje de WhatsApp
            que envías al cliente, según el método que eligió. Deja en blanco
            los que no uses.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextareaField
            label="Pago Móvil"
            icon={<Smartphone className="h-4 w-4 text-mana-red" />}
            placeholder={"Banco: 0102 Venezuela\nC.I.: V-12345678\nTeléfono: 0412-1234567\nTitular: ..."}
            value={form.pago_pagomovil}
            onChange={(v) => update("pago_pagomovil", v)}
          />
          <TextareaField
            label="Zelle"
            icon={<Send className="h-4 w-4 text-mana-red" />}
            placeholder={"Email: pagos@tudominio.com\nTitular: ..."}
            value={form.pago_zelle}
            onChange={(v) => update("pago_zelle", v)}
          />
          <TextareaField
            label="Binance / Cripto"
            icon={<CreditCard className="h-4 w-4 text-mana-red" />}
            placeholder={"BinanceID: 123456789\nRed: USDT (BEP20 / TRC20)"}
            value={form.pago_binance}
            onChange={(v) => update("pago_binance", v)}
          />
          <TextareaField
            label="Transferencia Bs"
            icon={<CreditCard className="h-4 w-4 text-mana-red" />}
            placeholder={"Banco: 0134 Banesco\nCuenta: 0134-...\nTitular: ...\nRIF: ..."}
            value={form.pago_transferencia}
            onChange={(v) => update("pago_transferencia", v)}
          />
          <TextareaField
            label="Efectivo USD"
            icon={<Banknote className="h-4 w-4 text-mana-red" />}
            placeholder="Se paga al entregar. Trae el monto exacto si es posible."
            value={form.pago_efectivo_usd}
            onChange={(v) => update("pago_efectivo_usd", v)}
          />
          <TextareaField
            label="Efectivo Bs"
            icon={<Banknote className="h-4 w-4 text-mana-red" />}
            placeholder="Se paga al entregar al cambio del día."
            value={form.pago_efectivo_bs}
            onChange={(v) => update("pago_efectivo_bs", v)}
          />
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
      <span className="flex items-center gap-1.5 text-sm font-semibold text-mana-ink mb-1.5">
        {icon}
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-mana-muted mt-1">{hint}</span>}
    </label>
  );
}

function TextareaField({
  label,
  icon,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-mana-ink mb-1.5">
        {icon}
        {label}
      </span>
      <textarea
        rows={4}
        maxLength={600}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-mana resize-none font-mono text-[13px]"
      />
      <span className="block text-[11px] text-mana-muted mt-1">
        {value.length}/600
      </span>
    </label>
  );
}
