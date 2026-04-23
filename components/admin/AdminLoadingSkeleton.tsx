/**
 * Skeletons usados por los archivos `loading.tsx` de cada ruta admin.
 *
 * Next.js App Router renderiza `loading.tsx` al instante cuando se navega
 * entre páginas server-components, mientras se resuelve el `page.tsx` en
 * paralelo. Esto elimina la sensación de "click muerto" que había antes:
 * el usuario ve inmediatamente la estructura con pulso, y el contenido
 * aparece cuando los datos llegan.
 */

type Props = {
  /** Título visible (ej. "Finanzas", "Clientes"). */
  title?: string;
  /** Subtítulo corto opcional. */
  subtitle?: string;
  /** Nº de tarjetas-placeholder a mostrar. */
  cards?: number;
};

export function AdminLoadingSkeleton({
  title = "Cargando…",
  subtitle,
  cards = 4,
}: Props) {
  return (
    <main className="min-h-[70vh] bg-mana-cream">
      <div className="container py-5 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-black/10 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-mana-red/30 animate-pulse" />
            <h2 className="font-display text-2xl font-black text-mana-ink">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-sm text-mana-muted">{subtitle}</p>
          )}
        </div>

        {/* KPIs/cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="card-mana p-4 space-y-2 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-3 w-16 rounded bg-black/10" />
              <div className="h-6 w-20 rounded bg-black/15" />
              <div className="h-2 w-24 rounded bg-black/5" />
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className="card-mana p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-black/10 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-black/10 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-black/10 animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-black/5 animate-pulse" />
                </div>
                <div className="h-3 w-14 rounded bg-black/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
