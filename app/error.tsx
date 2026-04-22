"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Global error boundary:", error);
    }
  }, [error]);

  return (
    <main className="min-h-screen bg-mana-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-mana ring-1 ring-black/5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mana-red/10 ring-1 ring-mana-red/20 text-mana-red">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-black text-mana-ink">
          Algo se nos quemó
        </h1>
        <p className="mt-1.5 text-sm text-mana-muted">
          Tuvimos un problema cargando esto. Puedes reintentar o volver al menú.
        </p>

        {error.digest && (
          <p className="mt-3 text-[10px] text-mana-muted font-mono">
            ref: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
          <Link href="/" className="btn-ghost ring-1 ring-black/10">
            <Home className="h-4 w-4" /> Ir al menú
          </Link>
        </div>
      </div>
    </main>
  );
}
