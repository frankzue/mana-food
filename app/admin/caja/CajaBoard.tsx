"use client";

import { useMemo, useState, useTransition } from "react";
import type { Pedido, CierreCaja } from "@/types/database";
import { formatBs, formatUSD } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateCierrePdf } from "@/lib/utils/pdf";
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calculator,
  History,
  FileDown,
} from "lucide-react";

type Props = {
  pedidos: Pedido[];
  cierres: CierreCaja[];
  tasaBs: number;
  businessName?: string;
};

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameLocalDay(iso: string, dayKey: string): boolean {
  return toDateKey(new Date(iso)) === dayKey;
}

export function CajaBoard({
  pedidos,
  cierres,
  tasaBs,
  businessName = "Maná Fast Food",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = toDateKey(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [efectivoUsdContado, setEfectivoUsdContado] = useState<string>("");
  const [efectivoBsContado, setEfectivoBsContado] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const delDia = useMemo(
    () => pedidos.filter((p) => isSameLocalDay(p.created_at, selectedDay)),
    [pedidos, selectedDay]
  );

  const stats = useMemo(() => {
    let brutas = 0;
    let netas = 0;
    let devUsd = 0;
    let propinas = 0;
    let envios = 0;
    let completados = 0;
    let cancelados = 0;
    let devueltos = 0;
    const desgloseMetodo: Record<string, { total: number; count: number }> = {};
    const desgloseEfectivoUsd = { total: 0, count: 0 };
    const desgloseEfectivoBs = { total: 0, count: 0 };

    for (const p of delDia) {
      const isCancel = p.estado === "cancelado";
      const isRef = p.estado === "devuelto";
      const total = Number(p.total_usd);
      const refundUsd = isRef
        ? p.devuelto_monto_usd != null
          ? Number(p.devuelto_monto_usd)
          : total
        : 0;

      if (!isCancel) {
        brutas += total;
        netas += total - refundUsd;
        envios += Number(p.envio_usd);
        propinas += Number(p.propina_usd ?? 0);
      }
      if (isRef) {
        devueltos += 1;
        devUsd += refundUsd;
      }
      if (isCancel) cancelados += 1;
      if (p.estado === "completado" || p.estado === "pagado") completados += 1;

      if (!isCancel) {
        const m = p.metodo_pago || "Otro";
        if (!desgloseMetodo[m]) desgloseMetodo[m] = { total: 0, count: 0 };
        desgloseMetodo[m].total += total - refundUsd;
        desgloseMetodo[m].count += 1;

        const ml = m.toLowerCase();
        if (ml.includes("efectivo") && ml.includes("usd")) {
          desgloseEfectivoUsd.total += total - refundUsd;
          desgloseEfectivoUsd.count += 1;
        }
        if (ml.includes("efectivo") && ml.includes("bs")) {
          desgloseEfectivoBs.total += total - refundUsd;
          desgloseEfectivoBs.count += 1;
        }
      }
    }

    return {
      brutas,
      netas,
      devUsd,
      propinas,
      envios,
      completados,
      cancelados,
      devueltos,
      pedidosCount: delDia.length,
      desgloseMetodo,
      desgloseEfectivoUsd,
      desgloseEfectivoBs,
    };
  }, [delDia]);

  const esperadoUsd = stats.desgloseEfectivoUsd.total;
  const esperadoBs = stats.desgloseEfectivoBs.total * tasaBs;
  const contadoUsd = Number(efectivoUsdContado || "0");
  const contadoBs = Number(efectivoBsContado || "0");
  const diferenciaUsd =
    contadoUsd > 0 || contadoBs > 0
      ? Math.round(
          (contadoUsd + (contadoBs > 0 ? contadoBs / tasaBs : 0) -
            esperadoUsd -
            esperadoBs / tasaBs) *
            100
        ) / 100
      : null;

  // Verificar si ya existe un cierre para este día
  const existeCierre = useMemo(
    () => cierres.find((c) => c.fecha === selectedDay),
    [cierres, selectedDay]
  );

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      await generateCierrePdf({
        businessName,
        fecha: selectedDay,
        cerradoPor: existeCierre?.cerrado_por ?? null,
        ventasBrutas: stats.brutas,
        ventasNetas: stats.netas,
        devoluciones: stats.devUsd,
        propinas: stats.propinas,
        envios: stats.envios,
        pedidos: stats.pedidosCount,
        completados: stats.completados,
        devueltos: stats.devueltos,
        cancelados: stats.cancelados,
        desgloseMetodo: stats.desgloseMetodo,
        efectivoUsdContado: contadoUsd > 0 ? contadoUsd : existeCierre?.efectivo_usd_contado ?? null,
        efectivoBsContado: contadoBs > 0 ? contadoBs : existeCierre?.efectivo_bs_contado ?? null,
        tasaBs,
        diferenciaUsd,
        esperadoEfectivoUsd: esperadoUsd,
        esperadoEfectivoBs: esperadoBs,
        notas: notas.trim() || existeCierre?.notas || null,
      });
    } catch (err) {
      console.error("PDF cierre", err);
      alert("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleCierre() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const body = {
          fecha: selectedDay,
          ventas_brutas_usd: Math.round(stats.brutas * 100) / 100,
          devoluciones_usd: Math.round(stats.devUsd * 100) / 100,
          ventas_netas_usd: Math.round(stats.netas * 100) / 100,
          propinas_usd: Math.round(stats.propinas * 100) / 100,
          envios_usd: Math.round(stats.envios * 100) / 100,
          pedidos_count: stats.pedidosCount,
          completados_count: stats.completados,
          devueltos_count: stats.devueltos,
          cancelados_count: stats.cancelados,
          desglose_metodo: stats.desgloseMetodo,
          efectivo_usd_contado: contadoUsd > 0 ? contadoUsd : null,
          efectivo_bs_contado: contadoBs > 0 ? contadoBs : null,
          tasa_bs: tasaBs,
          diferencia_usd: diferenciaUsd,
          notas: notas.trim() || null,
        };
        const res = await fetch("/api/admin/cierre-caja", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No se pudo cerrar la caja");
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
        router.refresh();
      } catch {
        setError("Error de red. Intenta de nuevo.");
      }
    });
  }

  const metodosOrdenados = Object.entries(stats.desgloseMetodo).sort(
    (a, b) => b[1].total - a[1].total
  );

  return (
    <div className="space-y-5">
      {/* Selector de día */}
      <section className="card-mana p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <label className="block text-xs font-semibold text-mana-ink mb-1">
              Día
            </label>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              max={today}
              className="input-mana w-auto"
            />
          </div>
          {existeCierre && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-mana-success bg-mana-success/10 ring-1 ring-mana-success/30 rounded-full px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cerrado el{" "}
              {new Date(existeCierre.cerrado_at).toLocaleString("es-VE")}
            </div>
          )}
        </div>
      </section>

      {/* KPIs del día */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiBig
          label="Ventas netas"
          value={formatUSD(stats.netas)}
          sub={`Brutas ${formatUSD(stats.brutas)}`}
          tone="red"
        />
        <KpiBig
          label="Pedidos"
          value={String(stats.pedidosCount)}
          sub={`${stats.completados} completados${
            stats.devueltos ? ` · ${stats.devueltos} devueltos` : ""
          }${stats.cancelados ? ` · ${stats.cancelados} cancelados` : ""}`}
          tone="ink"
        />
        <KpiBig
          label="Propinas"
          value={formatUSD(stats.propinas)}
          sub="Del día"
          tone="yellow"
        />
        <KpiBig
          label="Devoluciones"
          value={formatUSD(stats.devUsd)}
          sub={`${stats.devueltos} pedidos`}
          tone="ink"
        />
      </section>

      {/* Desglose por método */}
      <section className="card-mana p-4 sm:p-5">
        <h3 className="font-display font-bold text-mana-ink mb-3">
          Desglose por método de pago (netas)
        </h3>
        {metodosOrdenados.length === 0 ? (
          <p className="text-sm text-mana-muted italic">
            No hubo ventas este día.
          </p>
        ) : (
          <ul className="space-y-2">
            {metodosOrdenados.map(([metodo, v]) => (
              <li
                key={metodo}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-semibold text-mana-ink">
                  {metodo}{" "}
                  <span className="text-mana-muted text-xs">
                    · {v.count} pedidos
                  </span>
                </span>
                <span className="font-bold text-mana-ink">
                  {formatUSD(v.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cuadre físico */}
      <section className="card-mana p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="font-display font-bold text-mana-ink inline-flex items-center gap-2">
            <Calculator className="h-4 w-4 text-mana-red" />
            Cuadre de efectivo
          </h3>
          <p className="text-xs text-mana-muted">
            Opcional: cuenta físicamente el efectivo del día y verifica que
            cuadre con lo esperado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-mana-cream p-3">
            <div className="text-xs text-mana-muted mb-2 font-semibold uppercase">
              Esperado (del sistema)
            </div>
            <div className="flex justify-between text-sm">
              <span>Efectivo USD</span>
              <span className="font-bold text-mana-ink">
                {formatUSD(esperadoUsd)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Efectivo Bs</span>
              <span className="font-bold text-mana-ink">
                {formatBs(esperadoBs)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-mana-red/20 p-3">
            <div className="text-xs text-mana-red mb-2 font-semibold uppercase">
              Contado físicamente
            </div>
            <label className="block text-xs text-mana-ink mb-1">USD</label>
            <input
              type="text"
              inputMode="decimal"
              value={efectivoUsdContado}
              onChange={(e) => setEfectivoUsdContado(e.target.value)}
              placeholder="0.00"
              className="input-mana mb-2"
            />
            <label className="block text-xs text-mana-ink mb-1">Bs</label>
            <input
              type="text"
              inputMode="decimal"
              value={efectivoBsContado}
              onChange={(e) => setEfectivoBsContado(e.target.value)}
              placeholder="0.00"
              className="input-mana"
            />
          </div>
        </div>

        {diferenciaUsd !== null && (
          <div
            className={[
              "rounded-xl p-3 text-sm flex items-start gap-2",
              Math.abs(diferenciaUsd) < 0.5
                ? "bg-mana-success/10 ring-1 ring-mana-success/30 text-mana-success"
                : "bg-orange-50 ring-1 ring-orange-200 text-orange-800",
            ].join(" ")}
          >
            {Math.abs(diferenciaUsd) < 0.5 ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                Diferencia: {formatUSD(Math.abs(diferenciaUsd))}{" "}
                {diferenciaUsd > 0 ? "(sobra)" : "(falta)"}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                Tasa usada para convertir Bs → USD: 1 USD = {tasaBs.toFixed(2)}{" "}
                Bs
              </div>
            </div>
          </div>
        )}

        <label className="block">
          <span className="block text-xs font-semibold text-mana-ink mb-1">
            Notas (opcional)
          </span>
          <textarea
            rows={2}
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: sobra $2 por propina no registrada, faltó 1 Bs por redondeo..."
            className="input-mana resize-none"
          />
        </label>

        {error && (
          <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-xl bg-mana-success/10 ring-1 ring-mana-success/30 p-3 text-sm text-mana-success inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Cierre guardado.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCierre}
            disabled={isPending || stats.pedidosCount === 0}
            className="btn-primary flex-1 sm:flex-initial sm:min-w-[220px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                {existeCierre
                  ? "Actualizar cierre"
                  : `Cerrar día (${selectedDay})`}
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading || stats.pedidosCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-white text-mana-ink ring-1 ring-black/10 px-4 py-3 font-bold text-sm transition hover:ring-mana-red/40 active:scale-[0.98] disabled:opacity-50"
            title="Descargar el resumen del día en PDF"
          >
            {pdfLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" /> Descargar PDF
              </>
            )}
          </button>
        </div>
      </section>

      {/* Histórico de cierres */}
      <section className="card-mana p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/5">
          <h3 className="font-display font-bold text-mana-ink inline-flex items-center gap-2">
            <History className="h-4 w-4 text-mana-red" />
            Histórico de cierres
          </h3>
        </div>
        {cierres.length === 0 ? (
          <p className="p-5 text-sm text-mana-muted italic">
            Aún no hay cierres guardados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mana-cream-dark text-mana-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-center px-3 py-2">Pedidos</th>
                  <th className="text-right px-3 py-2">Ventas netas</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">
                    Propinas
                  </th>
                  <th className="text-right px-3 py-2 hidden md:table-cell">
                    Diferencia
                  </th>
                  <th className="text-right px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cierres.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-black/5 hover:bg-mana-cream/50 transition"
                  >
                    <td className="px-3 py-2">
                      <div className="font-semibold text-mana-ink">
                        {new Date(c.fecha + "T00:00:00").toLocaleDateString(
                          "es-VE",
                          {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          }
                        )}
                      </div>
                      <div className="text-[10px] text-mana-muted">
                        {c.cerrado_por}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {c.pedidos_count}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-mana-red">
                      {formatUSD(Number(c.ventas_netas_usd))}
                    </td>
                    <td className="px-3 py-2 text-right hidden sm:table-cell text-mana-ink">
                      {formatUSD(Number(c.propinas_usd))}
                    </td>
                    <td className="px-3 py-2 text-right hidden md:table-cell">
                      {c.diferencia_usd != null ? (
                        <span
                          className={[
                            "font-semibold",
                            Math.abs(Number(c.diferencia_usd)) < 0.5
                              ? "text-mana-success"
                              : "text-orange-700",
                          ].join(" ")}
                        >
                          {Number(c.diferencia_usd) >= 0 ? "+" : ""}
                          {formatUSD(Number(c.diferencia_usd))}
                        </span>
                      ) : (
                        <span className="text-mana-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDay(c.fecha)}
                        className="inline-flex items-center gap-1 rounded-full bg-white text-mana-ink ring-1 ring-black/10 px-2.5 py-1 text-[11px] font-bold hover:ring-mana-red/40 transition"
                        title="Ver este día"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => downloadPastCierre(c, businessName, tasaBs)}
                        className="ml-1 inline-flex items-center gap-1 rounded-full bg-mana-red text-white px-2.5 py-1 text-[11px] font-bold hover:brightness-95 transition"
                        title="Descargar PDF de este cierre"
                      >
                        <FileDown className="h-3 w-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Descarga el PDF de un cierre guardado (fila de la tabla "Últimos cierres"). */
async function downloadPastCierre(
  c: CierreCaja,
  businessName: string,
  tasaBsFallback: number
): Promise<void> {
  const tasa = c.tasa_bs ?? tasaBsFallback;
  const esperadoUsd =
    (c.desglose_metodo?.["Efectivo USD"]?.total ?? 0) +
    (c.desglose_metodo?.["Efectivo"]?.total ?? 0);
  const esperadoBs =
    (c.desglose_metodo?.["Efectivo Bs"]?.total ?? 0) * tasa;
  try {
    await generateCierrePdf({
      businessName,
      fecha: c.fecha,
      cerradoPor: c.cerrado_por,
      ventasBrutas: Number(c.ventas_brutas_usd),
      ventasNetas: Number(c.ventas_netas_usd),
      devoluciones: Number(c.devoluciones_usd),
      propinas: Number(c.propinas_usd),
      envios: Number(c.envios_usd),
      pedidos: c.pedidos_count,
      completados: c.completados_count,
      devueltos: c.devueltos_count,
      cancelados: c.cancelados_count,
      desgloseMetodo: c.desglose_metodo ?? {},
      efectivoUsdContado:
        c.efectivo_usd_contado != null ? Number(c.efectivo_usd_contado) : null,
      efectivoBsContado:
        c.efectivo_bs_contado != null ? Number(c.efectivo_bs_contado) : null,
      tasaBs: tasa,
      diferenciaUsd:
        c.diferencia_usd != null ? Number(c.diferencia_usd) : null,
      esperadoEfectivoUsd: esperadoUsd,
      esperadoEfectivoBs: esperadoBs,
      notas: c.notas,
    });
  } catch (err) {
    console.error("PDF cierre pasado", err);
    alert("No se pudo generar el PDF.");
  }
}

function KpiBig({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "red" | "yellow" | "ink";
}) {
  const toneClass =
    tone === "red"
      ? "text-mana-red"
      : tone === "yellow"
      ? "text-mana-yellow"
      : "text-mana-ink";
  return (
    <div className="card-mana p-4 sm:p-5">
      <div className="text-[11px] font-semibold text-mana-muted uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`font-display text-2xl sm:text-3xl font-black mt-1 ${toneClass}`}
      >
        {value}
      </div>
      {sub && <p className="text-[11px] text-mana-muted mt-0.5">{sub}</p>}
    </div>
  );
}
