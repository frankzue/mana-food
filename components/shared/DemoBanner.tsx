import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-mana-yellow/25 border-b border-mana-yellow/50">
      <div className="container flex items-center gap-2 py-2 text-xs text-mana-ink">
        <Info className="h-3.5 w-3.5 text-mana-red shrink-0" />
        <p>
          <strong>Modo demo</strong> · Estás viendo datos de ejemplo. Conecta
          Supabase (<code className="font-mono">.env.local</code>) para activar
          pedidos reales.
        </p>
      </div>
    </div>
  );
}
