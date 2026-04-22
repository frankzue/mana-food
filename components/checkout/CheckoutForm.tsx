"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart-store";
import type { ZonaDelivery } from "@/types/database";
import { formatUSD, formatBs, BUSINESS } from "@/lib/utils";
import { calcularTotales } from "@/lib/utils/calculations";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Loader2,
  Bike,
  Store,
  StickyNote,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { summarizeModifiers } from "@/lib/modifiers";
import { OrderSuccessModal } from "./OrderSuccessModal";

type Props = {
  zonas: ZonaDelivery[];
  tasaBs: number;
  ivaRate: number;
  demoMode?: boolean;
};

const METODOS_PAGO = [
  "Pago Móvil",
  "Efectivo USD",
  "Efectivo Bs",
  "Transferencia Bs",
  "Zelle",
  "Binance",
] as const;

type Modalidad = "delivery" | "pickup";
type MetodoPago = (typeof METODOS_PAGO)[number] | "";

type StoredProfile = {
  cliente_nombre: string;
  cliente_telefono: string;
  metodo_pago: MetodoPago;
  zona_id: string;
  modalidad: Modalidad;
};

const PROFILE_KEY = "mana-checkout-profile";

function loadProfile(): Partial<StoredProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(p: StoredProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    // silent
  }
}

/**
 * Autoformatea un teléfono venezolano muy básico:
 * "04121234567"  →  "+58 412 1234567"
 * "584121234567" →  "+58 412 1234567"
 * Si el input ya trae "+" se respeta como venga.
 */
function formatPhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("58") && digits.length >= 11) {
    return `+58 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return `+58 ${digits.slice(1, 4)} ${digits.slice(4)}`;
  }
  return trimmed;
}

export function CheckoutForm({ zonas, tasaBs, ivaRate, demoMode }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    metodo_pago: "" as MetodoPago,
    zona_id: "",
    modalidad: "delivery" as Modalidad,
    notas: "",
  });

  // Propina: estrategia = "none" | "5" | "10" | "15" | "custom"
  const [tipKind, setTipKind] = useState<"none" | "5" | "10" | "15" | "custom">(
    "none"
  );
  const [tipCustom, setTipCustom] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    numero: number;
    telefono: string;
    metodoPago: string;
  } | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (Object.keys(p).length === 0) return;
    setForm((f) => ({
      ...f,
      cliente_nombre: p.cliente_nombre ?? f.cliente_nombre,
      cliente_telefono: p.cliente_telefono ?? f.cliente_telefono,
      metodo_pago: (p.metodo_pago as MetodoPago) ?? f.metodo_pago,
      zona_id: p.zona_id ?? f.zona_id,
      modalidad: p.modalidad ?? f.modalidad,
    }));
  }, []);

  const zonaSeleccionada = zonas.find((z) => z.id === form.zona_id);
  const envio =
    form.modalidad === "delivery" ? zonaSeleccionada?.costo_envio_usd ?? 0 : 0;

  const subtotalForTip = useMemo(
    () => items.reduce((s, i) => s + i.precio_unit_usd * i.cantidad, 0),
    [items]
  );
  const propina = useMemo(() => {
    if (tipKind === "none") return 0;
    if (tipKind === "custom") {
      const n = Number(tipCustom.replace(",", "."));
      return isFinite(n) && n > 0 ? Math.min(1000, n) : 0;
    }
    const pct = Number(tipKind) / 100;
    return Math.round(subtotalForTip * pct * 100) / 100;
  }, [tipKind, tipCustom, subtotalForTip]);

  const totales = useMemo(
    () =>
      calcularTotales({
        items: items.map((i) => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          precio_unit_usd: i.precio_unit_usd,
          cantidad: i.cantidad,
        })),
        envio_usd: envio,
        tasa_bs: tasaBs,
        iva_rate: ivaRate,
        propina_usd: propina,
      }),
    [items, envio, tasaBs, ivaRate, propina]
  );

  const canSubmit =
    items.length > 0 &&
    form.cliente_nombre.trim().length >= 2 &&
    form.cliente_telefono.trim().length >= 7 &&
    !!form.metodo_pago &&
    (form.modalidad === "pickup" || !!form.zona_id) &&
    !isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    saveProfile({
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim(),
      metodo_pago: form.metodo_pago,
      zona_id: form.zona_id,
      modalidad: form.modalidad,
    });

    startTransition(async () => {
      if (demoMode) {
        setError(
          "Modo demo: configura Supabase en .env.local para enviar pedidos reales."
        );
        return;
      }
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_nombre: form.cliente_nombre.trim(),
            cliente_telefono: form.cliente_telefono.trim(),
            metodo_pago: form.metodo_pago,
            modalidad: form.modalidad,
            zona_id: form.modalidad === "delivery" ? form.zona_id : null,
            notas: form.notas.trim() || null,
            propina_usd: propina,
            items: items.map((i) => ({
              producto_id: i.producto_id,
              cantidad: i.cantidad,
              modifier_ids: i.modifier_ids,
              notas_item: i.notas ?? null,
            })),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No se pudo enviar el pedido");
          return;
        }

        setSuccessInfo({
          numero: Number(data.numero),
          telefono: form.cliente_telefono.trim(),
          metodoPago: form.metodo_pago || "",
        });
        clear();
      } catch {
        setError("Error de red. Intenta de nuevo.");
      }
    });
  }

  if (items.length === 0 && !successInfo) {
    return (
      <div className="container py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-mana-ink">
          Tu carrito está vacío
        </h2>
        <p className="text-mana-muted mt-2">
          Agrega productos antes de hacer checkout.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Ir al menú
        </Link>
      </div>
    );
  }

  if (successInfo) {
    return (
      <OrderSuccessModal
        open
        numero={successInfo.numero}
        telefono={successInfo.telefono}
        metodoPago={successInfo.metodoPago}
        onClose={() => setSuccessInfo(null)}
      />
    );
  }

  return (
    <div className="container py-6 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="order-2 lg:order-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-mana-muted hover:text-mana-ink transition mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow rounded"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al menú
        </Link>

        <h1 className="font-display text-3xl font-black text-mana-ink">
          Finalizar pedido
        </h1>
        <p className="text-mana-muted text-sm mt-1">
          Completa tus datos y confirma. Tu pedido se guarda al instante.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Modalidad */}
          <div>
            <label className="block text-sm font-semibold text-mana-ink mb-2">
              ¿Cómo lo quieres? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "delivery",
                    label: "Delivery",
                    sub: "A tu puerta",
                    icon: Bike,
                  },
                  {
                    id: "pickup",
                    label: "Recoger",
                    sub: "En el local",
                    icon: Store,
                  },
                ] as const
              ).map(({ id, label, sub, icon: Icon }) => {
                const selected = form.modalidad === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, modalidad: id, zona_id: id === "pickup" ? "" : form.zona_id })
                    }
                    className={[
                      "flex items-center gap-3 rounded-2xl p-4 text-left transition-all ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
                      selected
                        ? "bg-mana-red text-white ring-mana-red shadow-mana"
                        : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-6 w-6 shrink-0",
                        selected ? "text-mana-yellow" : "text-mana-red",
                      ].join(" ")}
                    />
                    <div>
                      <div className="font-display font-black text-sm leading-tight">
                        {label}
                      </div>
                      <div
                        className={[
                          "text-[11px] leading-tight",
                          selected ? "text-white/80" : "text-mana-muted",
                        ].join(" ")}
                      >
                        {sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {form.modalidad === "pickup" && (
              <div className="mt-2 rounded-xl bg-mana-yellow/20 ring-1 ring-mana-yellow/40 p-3 text-xs text-mana-ink">
                <strong>Retiro en tienda:</strong> {BUSINESS.address},{" "}
                {BUSINESS.city}. Horario: {BUSINESS.hoursShort}.
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="ck-nombre"
              className="block text-sm font-semibold text-mana-ink mb-1.5"
            >
              Nombre completo *
            </label>
            <input
              id="ck-nombre"
              type="text"
              required
              autoComplete="name"
              value={form.cliente_nombre}
              onChange={(e) =>
                setForm({ ...form, cliente_nombre: e.target.value })
              }
              placeholder="Ej: María González"
              className="input-mana"
            />
          </div>

          <div>
            <label
              htmlFor="ck-tel"
              className="block text-sm font-semibold text-mana-ink mb-1.5"
            >
              Teléfono (WhatsApp) *
            </label>
            <input
              id="ck-tel"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              value={form.cliente_telefono}
              onChange={(e) =>
                setForm({ ...form, cliente_telefono: e.target.value })
              }
              onBlur={(e) =>
                setForm({
                  ...form,
                  cliente_telefono: formatPhone(e.target.value),
                })
              }
              placeholder="Ej: 0412 1234567"
              className="input-mana"
            />
            <p className="text-xs text-mana-muted mt-1">
              Te contactaremos aquí para coordinar el pago y entrega.
            </p>
          </div>

          {form.modalidad === "delivery" && (
            <div>
              <label className="block text-sm font-semibold text-mana-ink mb-2">
                Zona de entrega *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {zonas.map((z) => {
                  const selected = form.zona_id === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setForm({ ...form, zona_id: z.id })}
                      className={[
                        "text-left rounded-xl px-4 py-3 transition-all ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
                        selected
                          ? "bg-mana-red text-white ring-mana-red shadow-mana"
                          : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{z.nombre}</span>
                        <span
                          className={
                            selected ? "font-bold" : "font-bold text-mana-red"
                          }
                        >
                          {formatUSD(z.costo_envio_usd)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-mana-ink mb-2">
              Método de pago *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => {
                const selected = form.metodo_pago === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, metodo_pago: m })}
                    className={[
                      "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
                      selected
                        ? "bg-mana-yellow text-mana-ink ring-mana-yellow shadow-mana-soft"
                        : "bg-white text-mana-ink ring-black/10 hover:ring-mana-yellow",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-mana-ink mb-2">
              <Heart className="h-4 w-4 text-mana-red inline -mt-0.5 mr-1" />
              ¿Quieres agregar propina?{" "}
              <span className="text-mana-muted font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: "none", label: "No" },
                  { id: "5", label: "5%" },
                  { id: "10", label: "10%" },
                  { id: "15", label: "15%" },
                  { id: "custom", label: "Otro" },
                ] as const
              ).map((t) => {
                const selected = tipKind === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipKind(t.id)}
                    className={[
                      "rounded-xl px-2 py-2 text-sm font-semibold transition-all ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mana-yellow",
                      selected
                        ? "bg-mana-red text-white ring-mana-red shadow-mana-soft"
                        : "bg-white text-mana-ink ring-black/10 hover:ring-mana-red/40",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            {tipKind === "custom" && (
              <div className="mt-2">
                <label
                  htmlFor="ck-tip"
                  className="block text-xs font-semibold text-mana-muted mb-1"
                >
                  Monto en USD
                </label>
                <input
                  id="ck-tip"
                  type="text"
                  inputMode="decimal"
                  value={tipCustom}
                  onChange={(e) => setTipCustom(e.target.value)}
                  placeholder="1.00"
                  className="input-mana"
                />
              </div>
            )}
            {propina > 0 && (
              <p className="text-[11px] text-mana-muted mt-1">
                Se sumará {formatUSD(propina)} al total. Gracias por apoyar al
                equipo.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="ck-notas"
              className="block text-sm font-semibold text-mana-ink mb-1.5"
            >
              Notas (opcional)
            </label>
            <textarea
              id="ck-notas"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={3}
              maxLength={300}
              placeholder={
                form.modalidad === "delivery"
                  ? "Ej: punto de referencia, piso, etc."
                  : "Ej: llegaré tipo 8pm..."
              }
              className="input-mana resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn-primary text-base py-3.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando pedido...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Enviar pedido ·{" "}
                {formatUSD(totales.total_usd)}
              </>
            )}
          </button>

          <p className="text-center text-xs text-mana-muted">
            Al enviar, tu pedido se registra al instante. Te contactaremos por
            WhatsApp para el pago.
          </p>
        </form>
      </div>

      <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
        <div className="card-mana p-5 space-y-4">
          <h2 className="font-display font-bold text-lg">Resumen</h2>

          <ul className="space-y-3 max-h-80 overflow-y-auto -mr-2 pr-2">
            {items.map((i) => {
              const mods = summarizeModifiers(i.modifier_ids);
              return (
                <li key={i.cartId} className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-mana-cream-dark">
                    {i.imagen_url && (
                      <Image
                        src={i.imagen_url}
                        alt={i.nombre}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{i.nombre}</p>
                    <p className="text-xs text-mana-muted">
                      x{i.cantidad} · {formatUSD(i.precio_unit_usd)}
                    </p>
                    {mods && (
                      <p className="mt-0.5 text-[11px] text-mana-muted line-clamp-2">
                        {mods}
                      </p>
                    )}
                    {i.notas && (
                      <p className="mt-0.5 flex items-start gap-1 text-[11px] text-mana-muted italic">
                        <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
                        {i.notas}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-mana-red shrink-0">
                    {formatUSD(i.precio_unit_usd * i.cantidad)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-dashed border-black/10 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-mana-muted">Subtotal</span>
              <span className="font-semibold">
                {formatUSD(totales.subtotal_usd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mana-muted">
                {form.modalidad === "pickup"
                  ? "Retiro en tienda"
                  : `Envío${
                      zonaSeleccionada ? ` · ${zonaSeleccionada.nombre}` : ""
                    }`}
              </span>
              <span className="font-semibold">
                {form.modalidad === "pickup"
                  ? "$0.00"
                  : zonaSeleccionada
                  ? formatUSD(totales.envio_usd)
                  : "—"}
              </span>
            </div>
            {propina > 0 && (
              <div className="flex justify-between">
                <span className="text-mana-muted inline-flex items-center gap-1">
                  <Heart className="h-3 w-3 text-mana-red" /> Propina
                </span>
                <span className="font-semibold">{formatUSD(propina)}</span>
              </div>
            )}
            <p className="text-[11px] text-mana-muted italic pt-0.5">
              * Precios con IVA incluido.
            </p>
          </div>

          <div className="bg-mana-cream-dark rounded-xl p-4 flex items-end justify-between">
            <span className="font-display font-bold">Total</span>
            <div className="text-right">
              <div className="font-display text-2xl font-black text-mana-red">
                {formatUSD(totales.total_usd)}
              </div>
              <div className="text-xs text-mana-muted">
                ≈ {formatBs(totales.total_bs)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-mana-muted text-center">
            Tasa aplicada: 1 USD = {tasaBs.toFixed(2)} Bs
          </p>
        </div>
      </aside>
    </div>
  );
}
