"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Message = { emoji: string; text: string };

const MESSAGES: Message[] = [
  { emoji: "🔥", text: "Hecho al momento" },
  { emoji: "🛵", text: "Delivery express" },
  { emoji: "⚡", text: "Pedí en 1 click" },
  { emoji: "💛", text: "Sabor Maná" },
];

/**
 * Chip promocional que rota mensajes cada ~3.5s con una animación
 * de entrada por abajo y salida por arriba (estilo "slot machine").
 * Pensado para el header: fondo sutil sobre fondo oscuro.
 */
export function RotatingChip() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => (prev + 1) % MESSAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const msg = MESSAGES[i];

  return (
    <div
      className="relative inline-flex h-7 items-center overflow-hidden rounded-full bg-mana-yellow/10 ring-1 ring-mana-yellow/25 px-2.5 text-[11px] font-semibold text-mana-yellow min-w-0"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={msg.text}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <span className="text-[13px] leading-none">{msg.emoji}</span>
          <span className="leading-none">{msg.text}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
