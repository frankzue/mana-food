"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";

type Props = {
  email: string | null | undefined;
};

export function AdminHeader({ email }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-mana-black text-white shadow-mana-soft">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-mana-black ring-2 ring-mana-yellow/40">
            <Image
              src="/logo.png"
              alt="Maná"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-display text-lg font-black">
              <span className="text-mana-red">MANÁ</span>{" "}
              <span className="text-mana-yellow">Panel</span>
            </h1>
            <p className="text-[11px] text-white/60">Pedidos en tiempo real</p>
          </div>
        </div>

        <form action="/admin/logout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
            title={email ?? ""}
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </form>
      </div>
    </header>
  );
}
