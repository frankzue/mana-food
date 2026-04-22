/**
 * Generación de PDFs con jsPDF.
 *
 * - Descarga REAL del archivo .pdf (no depende del diálogo de impresión).
 * - Incluye el logo del negocio (/logo.png cargado vía fetch → dataURL).
 * - Se usa en:
 *     · /admin/ventas  → reporte de ventas con tabla
 *     · /admin/caja    → resumen del cierre diario
 */

import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

/** Colores de marca (RGB). */
const COLOR_RED: [number, number, number] = [225, 29, 72]; // mana-red
const COLOR_INK: [number, number, number] = [26, 26, 26];
const COLOR_MUTED: [number, number, number] = [115, 115, 115];

/**
 * Carga /logo.png como dataURL para poder embebirla en el PDF.
 * Devuelve null si falla (ej. sin conexión); el PDF se genera igual sin logo.
 */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtBs(n: number): string {
  return `Bs. ${n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Dibuja encabezado (logo + título + subtítulo) en la página actual.
 */
function drawHeader(
  doc: jsPDF,
  logo: string | null,
  title: string,
  subtitle: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logo) {
    try {
      doc.addImage(logo, "PNG", 14, 12, 18, 18);
    } catch {
      /* PNG inválido, lo ignoramos */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLOR_INK);
  doc.text(title, logo ? 36 : 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(subtitle, logo ? 36 : 14, 26);

  // Fecha de generación (derecha)
  const genText = `Generado: ${new Date().toLocaleString("es-VE")}`;
  doc.setFontSize(9);
  doc.text(genText, pageWidth - 14, 26, { align: "right" });

  // Línea de marca roja debajo
  doc.setDrawColor(...COLOR_RED);
  doc.setLineWidth(0.8);
  doc.line(14, 33, pageWidth - 14, 33);

  return 40; // Y donde puede empezar el cuerpo
}

// =========================================================
// VENTAS
// =========================================================
export type VentasPdfData = {
  businessName: string;
  rangoTexto: string;
  kpis: {
    ventas: number;
    ventasNetas: number;
    envios: number;
    propinas: number;
    totalBs: number;
    pedidos: number;
    completados: number;
    cancelados: number;
    devueltos: number;
    devolucionesUsd: number;
    enCurso: number;
    ticketPromedio: number;
  };
  topProductos: Array<{
    nombre: string;
    cantidad: number;
    total: number;
    margenPct: number | null;
  }>;
  gananciaBruta: {
    ventas: number;
    costo: number;
    ganancia: number;
    margenPct: number;
  } | null;
  pedidos: Array<{
    numero: number;
    fecha: string;
    cliente: string;
    telefono: string;
    productos: string;
    metodoPago: string;
    estado: string;
    totalUsd: number;
    totalBs: number;
    refundUsd: number | null;
  }>;
};

/** Construye el footer de la tabla de pedidos (totales brutos / devoluciones / netos). */
function buildVentasFoot(data: VentasPdfData): RowInput[] {
  const rows: RowInput[] = [
    [
      { content: "Ventas brutas", colSpan: 6, styles: { halign: "right" } },
      { content: fmtUsd(data.kpis.ventas), styles: { halign: "right" } },
    ],
  ];
  if (data.kpis.devolucionesUsd > 0) {
    rows.push([
      {
        content: "− Devoluciones",
        colSpan: 6,
        styles: { halign: "right", textColor: [234, 88, 12] },
      },
      {
        content: `− ${fmtUsd(data.kpis.devolucionesUsd)}`,
        styles: { halign: "right", textColor: [234, 88, 12] },
      },
    ]);
  }
  rows.push([
    {
      content: "Ventas netas",
      colSpan: 6,
      styles: { halign: "right", fontStyle: "bold" },
    },
    {
      content: fmtUsd(data.kpis.ventasNetas),
      styles: { halign: "right", fontStyle: "bold" },
    },
  ]);
  return rows;
}

export async function generateVentasPdf(data: VentasPdfData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logo = await loadLogoDataUrl();
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawHeader(
    doc,
    logo,
    `${data.businessName} — Reporte de ventas`,
    data.rangoTexto
  );

  // KPIs (2x2)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_INK);
  doc.text("Resumen", 14, y);
  y += 2;
  doc.setDrawColor(230);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  const kpiCards: Array<[string, string, string]> = [
    [
      "Ventas netas",
      fmtUsd(data.kpis.ventasNetas),
      data.kpis.devolucionesUsd > 0
        ? `Brutas ${fmtUsd(data.kpis.ventas)} − devol. ${fmtUsd(
            data.kpis.devolucionesUsd
          )}`
        : `Brutas ${fmtUsd(data.kpis.ventas)}`,
    ],
    [
      "Pedidos",
      String(data.kpis.pedidos),
      `${data.kpis.completados} completados · ${data.kpis.cancelados} cancel.${
        data.kpis.devueltos ? ` · ${data.kpis.devueltos} devueltos` : ""
      }`,
    ],
    [
      "Ticket promedio",
      fmtUsd(data.kpis.ticketPromedio),
      `≈ ${fmtBs(data.kpis.ticketPromedio * (data.kpis.totalBs / Math.max(1, data.kpis.ventas)))}`,
    ],
    ["Propinas", fmtUsd(data.kpis.propinas), "Total recibido en el rango"],
  ];

  const kpiW = (pageWidth - 14 * 2 - 6) / 2;
  const kpiH = 18;
  kpiCards.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 14 + col * (kpiW + 6);
    const yy = y + row * (kpiH + 4);
    doc.setDrawColor(220);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, yy, kpiW, kpiH, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(kpi[0].toUpperCase(), x + 3, yy + 5);
    doc.setFontSize(14);
    doc.setTextColor(...COLOR_INK);
    doc.text(kpi[1], x + 3, yy + 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_MUTED);
    doc.text(kpi[2], x + 3, yy + 16);
  });
  y += 2 * (kpiH + 4) + 4;

  // Top productos
  if (data.topProductos.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_INK);
    doc.text("Productos más vendidos", 14, y);
    y += 2;
    doc.setDrawColor(230);
    doc.line(14, y, pageWidth - 14, y);
    y += 3;

    const topBody = data.topProductos.map((p, i) => [
      `#${i + 1}`,
      p.nombre,
      String(p.cantidad),
      fmtUsd(p.total),
      p.margenPct !== null ? `${p.margenPct.toFixed(0)}%` : "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Producto", "Cant.", "Total", "Margen"]],
      body: topBody,
      theme: "striped",
      headStyles: { fillColor: COLOR_INK, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "right", cellWidth: 26 },
        4: { halign: "right", cellWidth: 22 },
      },
    });
    // @ts-expect-error — jspdf-autotable extiende doc.lastAutoTable
    y = doc.lastAutoTable.finalY + 4;
  }

  // Ganancia bruta (si hay)
  if (data.gananciaBruta) {
    const gb = data.gananciaBruta;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "FD");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Ventas de menú:", 18, y + 6);
    doc.text("Costo mercancía:", 18, y + 11);
    doc.text("Ganancia bruta:", 18, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_INK);
    doc.text(fmtUsd(gb.ventas), pageWidth - 18, y + 6, { align: "right" });
    doc.text(`− ${fmtUsd(gb.costo)}`, pageWidth - 18, y + 11, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text(
      `${fmtUsd(gb.ganancia)}  (${gb.margenPct.toFixed(0)}%)`,
      pageWidth - 18,
      y + 17,
      { align: "right" }
    );
    y += 26;
  }

  // Detalle de pedidos
  if (data.pedidos.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_INK);
    doc.text(`Pedidos (${data.pedidos.length})`, 14, y);
    y += 2;
    doc.setDrawColor(230);
    doc.line(14, y, pageWidth - 14, y);
    y += 3;

    const body = data.pedidos.map((p) => [
      `#${String(p.numero).padStart(4, "0")}`,
      p.fecha,
      `${p.cliente}\n${p.telefono}`,
      p.productos,
      p.metodoPago,
      p.estado,
      p.refundUsd != null
        ? `${fmtUsd(p.totalUsd)}\n− ${fmtUsd(p.refundUsd)}`
        : fmtUsd(p.totalUsd),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Fecha", "Cliente", "Productos", "Pago", "Estado", "Total"]],
      body,
      theme: "striped",
      headStyles: { fillColor: COLOR_INK, textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 1.5, valign: "top" },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 22 },
        2: { cellWidth: 34 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22, halign: "right" },
      },
      foot: buildVentasFoot(data),
      footStyles: { fillColor: [245, 245, 245], textColor: COLOR_INK, fontSize: 9 },
    });
  }

  // Pie de página en cada página
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      `${data.businessName} · Página ${i} de ${pages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const fileName = `ventas-${data.rangoTexto
    .replace(/[–/\s]+/g, "_")
    .replace(/[^\w_-]/g, "")}.pdf`;
  doc.save(fileName);
}

// =========================================================
// CIERRE DE CAJA
// =========================================================
export type CierrePdfData = {
  businessName: string;
  fecha: string; // YYYY-MM-DD
  cerradoPor?: string | null;
  ventasBrutas: number;
  ventasNetas: number;
  devoluciones: number;
  propinas: number;
  envios: number;
  pedidos: number;
  completados: number;
  devueltos: number;
  cancelados: number;
  desgloseMetodo: Record<string, { total: number; count: number }>;
  efectivoUsdContado: number | null;
  efectivoBsContado: number | null;
  tasaBs: number;
  diferenciaUsd: number | null;
  esperadoEfectivoUsd: number;
  esperadoEfectivoBs: number;
  notas: string | null;
};

export async function generateCierrePdf(data: CierrePdfData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logo = await loadLogoDataUrl();
  const pageWidth = doc.internal.pageSize.getWidth();

  const fechaLegible = new Date(data.fecha + "T00:00:00").toLocaleDateString(
    "es-VE",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  let y = drawHeader(
    doc,
    logo,
    `${data.businessName} — Cierre de caja`,
    `${fechaLegible}${data.cerradoPor ? ` · ${data.cerradoPor}` : ""}`
  );

  // KPIs principales
  const kpiCards: Array<[string, string, string]> = [
    [
      "Ventas netas",
      fmtUsd(data.ventasNetas),
      `Brutas ${fmtUsd(data.ventasBrutas)}`,
    ],
    [
      "Pedidos",
      String(data.pedidos),
      `${data.completados} completados${
        data.devueltos ? ` · ${data.devueltos} devueltos` : ""
      }${data.cancelados ? ` · ${data.cancelados} cancel.` : ""}`,
    ],
    ["Propinas", fmtUsd(data.propinas), "Total del día"],
    [
      "Devoluciones",
      fmtUsd(data.devoluciones),
      `${data.devueltos} pedidos`,
    ],
  ];
  const kpiW = (pageWidth - 14 * 2 - 6) / 2;
  const kpiH = 18;
  kpiCards.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 14 + col * (kpiW + 6);
    const yy = y + row * (kpiH + 4);
    doc.setDrawColor(220);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, yy, kpiW, kpiH, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(kpi[0].toUpperCase(), x + 3, yy + 5);
    doc.setFontSize(14);
    doc.setTextColor(...COLOR_INK);
    doc.text(kpi[1], x + 3, yy + 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_MUTED);
    doc.text(kpi[2], x + 3, yy + 16);
  });
  y += 2 * (kpiH + 4) + 4;

  // Desglose por método
  const metodos = Object.entries(data.desgloseMetodo).sort(
    (a, b) => b[1].total - a[1].total
  );
  if (metodos.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_INK);
    doc.text("Desglose por método de pago (netas)", 14, y);
    y += 2;
    doc.setDrawColor(230);
    doc.line(14, y, pageWidth - 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Método", "Pedidos", "Total"]],
      body: metodos.map(([m, v]) => [m, String(v.count), fmtUsd(v.total)]),
      theme: "striped",
      headStyles: { fillColor: COLOR_INK, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "right", cellWidth: 40 },
      },
    });
    // @ts-expect-error lastAutoTable
    y = doc.lastAutoTable.finalY + 4;
  }

  // Cuadre de efectivo
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_INK);
  doc.text("Cuadre de efectivo", 14, y);
  y += 2;
  doc.setDrawColor(230);
  doc.line(14, y, pageWidth - 14, y);
  y += 3;

  const cuadreRows = [
    ["Esperado efectivo USD (del sistema)", fmtUsd(data.esperadoEfectivoUsd)],
    ["Esperado efectivo Bs (del sistema)", fmtBs(data.esperadoEfectivoBs)],
    [
      "Contado físicamente USD",
      data.efectivoUsdContado != null
        ? fmtUsd(data.efectivoUsdContado)
        : "— no registrado —",
    ],
    [
      "Contado físicamente Bs",
      data.efectivoBsContado != null
        ? fmtBs(data.efectivoBsContado)
        : "— no registrado —",
    ],
    ["Tasa BCV usada", `1 USD = ${data.tasaBs.toFixed(2)} Bs`],
  ];
  if (data.diferenciaUsd !== null) {
    const label = data.diferenciaUsd >= 0 ? "Sobra" : "Falta";
    cuadreRows.push([
      `Diferencia (${label})`,
      fmtUsd(Math.abs(data.diferenciaUsd)),
    ]);
  }

  autoTable(doc, {
    startY: y,
    body: cuadreRows,
    theme: "plain",
    bodyStyles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 4;

  // Notas
  if (data.notas && data.notas.trim()) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_INK);
    doc.text("Notas", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED);
    const split = doc.splitTextToSize(data.notas, pageWidth - 28);
    doc.text(split, 14, y);
    y += split.length * 5 + 4;
  }

  // Firmas
  y = Math.max(y, doc.internal.pageSize.getHeight() - 40);
  doc.setDrawColor(200);
  doc.line(20, y, 80, y);
  doc.line(pageWidth - 80, y, pageWidth - 20, y);
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text("Cerrado por", 50, y + 4, { align: "center" });
  doc.text("Revisado por", pageWidth - 50, y + 4, { align: "center" });

  // Footer con página
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    `${data.businessName} · Cierre del ${fechaLegible}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  doc.save(`cierre-caja-${data.fecha}.pdf`);
}
