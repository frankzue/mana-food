"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  numero: number | null;
  telefono: string;
  metodoPago: string;
  onClose: () => void;
};

export function OrderSuccessModal({
  open,
  numero,
  telefono,
  metodoPago,
  onClose,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleHome() {
    onClose();
    router.push("/");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleHome}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md rounded-3xl bg-white shadow-mana p-6 sm:p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto relative">
              <div className="absolute inset-0 blur-2xl rounded-full bg-mana-success/30" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mana-success text-white shadow-xl animate-bounce-in">
                <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} />
              </div>
            </div>

            <h2
              id="order-success-title"
              className="font-display text-2xl sm:text-3xl font-black text-mana-ink mt-5"
            >
              ¡Pedido enviado!
            </h2>

            {numero !== null && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-mana-yellow/30 ring-1 ring-mana-yellow px-4 py-1.5">
                <span className="text-xs font-semibold text-mana-ink">
                  Orden N°
                </span>
                <span className="font-display text-lg font-black text-mana-red">
                  #{String(numero).padStart(4, "0")}
                </span>
              </div>
            )}

            <p className="text-mana-ink mt-4 text-[15px] leading-relaxed">
              Tu pedido fue recibido correctamente. Te contactaremos por{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-[#128C7E]">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </span>{" "}
              al <strong className="text-mana-ink">{telefono}</strong> en los
              próximos minutos para confirmar el pago ({metodoPago}) y
              coordinar la entrega.
            </p>

            <div className="mt-5 rounded-2xl bg-mana-cream-dark p-3.5 text-left text-xs text-mana-muted space-y-1">
              <p>
                <strong className="text-mana-ink">Siguiente paso:</strong>{" "}
                ten listo el comprobante de pago para enviarlo por WhatsApp.
              </p>
              <p>
                Guarda tu número de orden por si necesitas consultarlo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleHome}
              className="mt-6 w-full btn-primary flex items-center justify-center text-base py-3"
              autoFocus
            >
              <Home className="h-4 w-4" /> Volver al menú
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
