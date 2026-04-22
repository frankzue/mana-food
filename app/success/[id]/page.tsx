import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  ChefHat,
  Bike,
  PackageCheck,
  Circle,
} from "lucide-react";
import { getPedidoConItems, getSettings } from "@/lib/queries";
import { formatBs, formatUSD } from "@/lib/utils";
import type { EstadoPedido } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "¡Pedido recibido!",
};

const TIMELINE: {
  key: EstadoPedido | "preparando";
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: "nuevo",
    label: "Pedido recibido",
    sub: "Confirmamos tu orden",
    icon: CheckCircle2,
  },
  {
    key: "contactado",
    label: "Preparando",
    sub: "Cocinando al momento",
    icon: ChefHat,
  },
  {
    key: "preparando",
    label: "En camino / listo",
    sub: "Delivery o pickup",
    icon: Bike,
  },
  {
    key: "completado",
    label: "Entregado",
    sub: "¡Provecho!",
    icon: PackageCheck,
  },
];

function stepIndex(estado: EstadoPedido): number {
  switch (estado) {
    case "nuevo":
      return 0;
    case "contactado":
      return 1;
    case "completado":
      return 3;
    case "cancelado":
      return -1;
    default:
      return 0;
  }
}

export default async function SuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const [pedido, settings] = await Promise.all([
    getPedidoConItems(params.id),
    getSettings(),
  ]);

  if (!pedido) return notFound();

  const currentStep = stepIndex(pedido.estado);
  const cancelled = pedido.estado === "cancelado";

  return (
    <main className="min-h-screen bg-gradient-to-br from-mana-cream via-mana-cream to-mana-yellow/20 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-mana p-6 sm:p-8 animate-fade-in-up">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div
                className={[
                  "absolute inset-0 blur-2xl rounded-full",
                  cancelled ? "bg-mana-red/20" : "bg-mana-success/20",
                ].join(" ")}
              />
              <div
                className={[
                  "relative flex h-20 w-20 items-center justify-center rounded-full text-white animate-bounce-in shadow-xl",
                  cancelled ? "bg-mana-red" : "bg-mana-success",
                ].join(" ")}
              >
                <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black text-mana-ink mt-5">
              {cancelled ? "Pedido cancelado" : "¡Pedido recibido!"}
            </h1>
            <p className="text-mana-muted mt-2">
              Hola <strong>{pedido.cliente_nombre}</strong>,{" "}
              {cancelled
                ? "tu pedido fue cancelado."
                : "recibimos tu pedido correctamente."}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-mana-yellow/30 ring-1 ring-mana-yellow px-4 py-2">
              <span className="text-xs font-semibold text-mana-ink">
                Orden N°
              </span>
              <span className="font-display text-xl font-black text-mana-red">
                #{String(pedido.numero).padStart(4, "0")}
              </span>
            </div>
          </div>

          {!cancelled && (
            <div className="mt-7">
              <h2 className="font-display font-bold text-mana-ink mb-3">
                Estado del pedido
              </h2>
              <ol className="relative space-y-0">
                {TIMELINE.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.key}
                      className="flex gap-3 pb-4 last:pb-0 relative"
                    >
                      {idx < TIMELINE.length - 1 && (
                        <span
                          aria-hidden
                          className={[
                            "absolute left-[19px] top-10 bottom-0 w-0.5",
                            done ? "bg-mana-success" : "bg-black/10",
                          ].join(" ")}
                        />
                      )}
                      <div
                        className={[
                          "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 transition-all",
                          done
                            ? "bg-mana-success text-white ring-mana-success/20"
                            : "bg-white text-mana-muted ring-black/5",
                          active ? "animate-pulse" : "",
                        ].join(" ")}
                      >
                        {done ? (
                          <Icon className="h-5 w-5" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div
                          className={[
                            "font-display font-bold text-sm",
                            done ? "text-mana-ink" : "text-mana-muted",
                          ].join(" ")}
                        >
                          {step.label}
                        </div>
                        <div className="text-xs text-mana-muted">
                          {step.sub}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="text-center text-[11px] text-mana-muted mt-3">
                Esta página se actualiza al recargar. Te avisamos también por
                WhatsApp.
              </p>
            </div>
          )}

          <div className="mt-7 border-t border-dashed border-black/10 pt-5">
            <h2 className="font-display font-bold mb-3">Detalle</h2>
            <ul className="space-y-2 text-sm">
              {pedido.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="text-mana-ink">
                    {it.cantidad}× {it.producto_nombre}
                  </span>
                  <span className="font-semibold text-mana-ink shrink-0">
                    {formatUSD(Number(it.subtotal_usd))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1 text-sm">
              <Row
                label="Subtotal"
                value={formatUSD(Number(pedido.subtotal_usd))}
              />
              <Row
                label={pedido.zona_nombre ?? "Envío"}
                value={formatUSD(Number(pedido.envio_usd))}
              />
              <p className="text-[11px] text-mana-muted italic">
                * Precios con IVA incluido.
              </p>
              <div className="border-t border-black/10 mt-2 pt-2 flex justify-between items-end">
                <span className="font-display font-bold text-lg">Total</span>
                <div className="text-right">
                  <div className="font-display text-2xl font-black text-mana-red">
                    {formatUSD(Number(pedido.total_usd))}
                  </div>
                  <div className="text-xs text-mana-muted">
                    ≈ {formatBs(Number(pedido.total_bs))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-mana-cream-dark p-4 space-y-2 text-sm">
            <p className="font-semibold text-mana-ink">📣 ¿Qué sigue?</p>
            <p className="text-mana-muted">
              El encargado te contactará por WhatsApp al{" "}
              <strong>{pedido.cliente_telefono}</strong> para confirmar el pago
              ({pedido.metodo_pago}) y la entrega.
            </p>

            <div className="grid gap-1.5 pt-2 border-t border-black/10 text-xs text-mana-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-mana-red" />
                {settings.horario}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-mana-red" />
                {settings.direccion}, {settings.ciudad}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-mana-red" /> Delivery y
                Pickup disponibles
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 w-full btn-primary flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al menú
          </Link>
        </div>

        <p className="text-center text-xs text-mana-muted mt-6">
          Guarda tu número de orden · Gracias por pedir en{" "}
          <strong className="text-mana-red">{settings.nombre_negocio}</strong>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-mana-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
