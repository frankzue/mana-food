export default function Loading() {
  return (
    <div className="min-h-screen bg-mana-cream">
      {/* Header skeleton */}
      <div className="h-[92px] bg-gradient-to-r from-[#141414] via-[#1f0d10] to-[#141414]" />

      <div className="container py-6 space-y-8">
        {/* Promo slider */}
        <div className="h-[180px] rounded-3xl bg-gradient-to-r from-mana-red-dark/60 via-mana-red/40 to-mana-yellow/40 animate-pulse" />

        {/* Strip */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-20 shrink-0 rounded-full bg-white/80 animate-pulse ring-2 ring-white"
            />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white shadow-mana-soft ring-1 ring-black/5 overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-mana-yellow/30 via-mana-cream to-white animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-mana-cream-dark animate-pulse" />
                <div className="h-3 w-full rounded bg-mana-cream-dark/70 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-mana-cream-dark/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-mana-muted pb-6">
        Cargando el menú...
      </p>
    </div>
  );
}
