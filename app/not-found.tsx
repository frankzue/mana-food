import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-mana-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-mana ring-1 ring-black/5 text-center">
        <div className="text-7xl mb-2">🍔</div>
        <h1 className="font-display text-3xl font-black text-mana-ink">404</h1>
        <p className="mt-1 text-sm text-mana-muted">
          No encontramos lo que buscas. Tal vez ese producto ya no está en el
          menú.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" /> Ir al menú
          </Link>
          <Link href="javascript:history.back()" className="btn-ghost ring-1 ring-black/10">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </div>
      </div>
    </main>
  );
}
