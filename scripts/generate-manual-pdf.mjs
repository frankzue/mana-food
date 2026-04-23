/**
 * Genera el manual de usuario en PDF (archivo estático en public/docs/).
 * Ejecutar: node scripts/generate-manual-pdf.mjs
 *
 * No forma parte de la app web: el PDF se distribuye por enlace directo
 * una vez desplegado, p. ej. https://tu-dominio.com/docs/manual-mana-fast-food.pdf
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "docs");
const OUT_FILE = path.join(OUT_DIR, "manual-mana-fast-food.pdf");
const LOGO_PATH = path.join(ROOT, "public", "logo.png");

const RED = [200, 16, 46];
const INK = [26, 26, 26];
const MUTED = [90, 90, 90];

function loadLogoDataUrl() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  const b64 = fs.readFileSync(LOGO_PATH).toString("base64");
  return `data:image/png;base64,${b64}`;
}

/** Escribe párrafos con salto de página automático. */
function writeFlow(doc, paragraphs, startY, opts) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = opts.margin;
  const right = opts.margin;
  const maxW = pageW - left - right;
  let y = startY;
  const lineH = opts.lineHeight ?? 5.2;
  const titleSize = opts.titleSize ?? 11;
  const bodySize = opts.bodySize ?? 9.5;

  for (const block of paragraphs) {
    if (block.type === "title") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleSize);
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(block.text, maxW);
      for (const line of lines) {
        if (y + lineH > pageH - opts.margin) {
          doc.addPage();
          y = opts.margin;
        }
        doc.text(line, left, y);
        y += lineH + 1;
      }
      y += 2;
    } else if (block.type === "body") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(block.text, maxW);
      for (const line of lines) {
        if (y + lineH > pageH - opts.margin) {
          doc.addPage();
          y = opts.margin;
        }
        doc.text(line, left, y);
        y += lineH;
      }
      y += 2.5;
    } else if (block.type === "bullet") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      doc.setTextColor(...INK);
      const bullet = "• ";
      const lines = doc.splitTextToSize(bullet + block.text, maxW);
      let first = true;
      for (const line of lines) {
        if (y + lineH > pageH - opts.margin) {
          doc.addPage();
          y = opts.margin;
        }
        doc.text(line, left + (first ? 0 : 3), y);
        y += lineH;
        first = false;
      }
      y += 1.5;
    } else if (block.type === "spacer") {
      y += block.pts ?? 4;
    }
  }
  return y;
}

function drawCover(doc, logo) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  if (logo) {
    try {
      doc.addImage(logo, "PNG", cx - 18, 40, 36, 36);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text("MANUAL DE USO", cx, 88, { align: "center" });

  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text("Maná Fast Food", cx, 100, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text("Sistema de pedidos en linea — Guia para clientes y administradores", cx, 112, {
    align: "center",
  });

  doc.setDrawColor(...RED);
  doc.setLineWidth(0.6);
  doc.line(40, 122, pageW - 40, 122);

  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const intro = [
    "Este documento explica, paso a paso, como usar la tienda web y el panel de administracion.",
    "",
    "Secciones:",
    "  A — Para el cliente final (hacer un pedido).",
    "  B — Para el dueno y trabajadores (panel admin).",
    "  C — Preguntas frecuentes.",
    "",
    "Al final encontraras un AVISO LEGAL importante: el sistema es solo de apoyo operativo.",
  ];
  let y = 135;
  for (const line of intro) {
    doc.text(line, 40, y);
    y += 5.5;
  }

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Generado: ${new Date().toLocaleString("es-VE")}`, cx, pageH - 20, {
    align: "center",
  });
  doc.text("Version 1.0 — Uso interno", cx, pageH - 14, { align: "center" });
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const logo = loadLogoDataUrl();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const flowOpts = { margin, lineHeight: 4.8, titleSize: 11, bodySize: 9 };

  drawCover(doc, logo);
  doc.addPage();

  // ----- Seccion A -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...RED);
  doc.text("A. Para el cliente final", margin, margin + 6);

  writeFlow(
    doc,
    [
      { type: "title", text: "1. Abrir el menu" },
      {
        type: "body",
        text: "El cliente entra al enlace de la tienda desde el navegador del telefono o PC. No hace falta instalar nada. Ve las categorias, buscador y productos destacados.",
      },
      { type: "title", text: "2. Elegir producto y personalizar" },
      {
        type: "body",
        text: "Al tocar un producto se abre la ficha con foto, precio, descripcion y opciones (extras, punto de coccion, etc.). El boton rojo + en la tarjeta permite agregar rapido sin abrir la ficha.",
      },
      { type: "title", text: "3. Revisar el carrito" },
      {
        type: "body",
        text: "La barra inferior muestra el total. Al tocarla se abre el carrito: cantidades, borrar items, resumen. El IVA figura como incluido en los precios (no se suma aparte).",
      },
      { type: "title", text: "4. Datos de entrega" },
      {
        type: "body",
        text: "Elige Delivery o Pickup. En Delivery selecciona la zona; el envio se suma automaticamente. Completa nombre, telefono y direccion. Los datos pueden guardarse en el navegador para la proxima vez.",
      },
      { type: "title", text: "5. Metodo de pago y enviar" },
      {
        type: "body",
        text: "Selecciona Pago Movil, Zelle, transferencia, etc. Al enviar el pedido aparece confirmacion en pantalla con el numero de pedido. El negocio contacta por WhatsApp con el resumen y los datos exactos para pagar.",
      },
      { type: "title", text: "6. Pagar y comprobante" },
      {
        type: "body",
        text: "El cliente paga con los datos recibidos por WhatsApp y envia el comprobante por el mismo chat. Si algo no cuadra, debe avisar ANTES de pagar.",
      },
    ],
    margin + 14,
    flowOpts
  );

  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...RED);
  doc.text("B. Panel de administracion", margin, margin + 6);

  writeFlow(
    doc,
    [
      { type: "title", text: "1. Acceso" },
      {
        type: "body",
        text: "URL /admin o enlace 'Acceso empleados' en el pie de la pagina principal. Inicio de sesion con correo y clave creados en Supabase Auth.",
      },
      { type: "title", text: "2. Pedidos nuevos" },
      {
        type: "body",
        text: "Al entrar un pedido suena una campanilla y aparece aviso. La campana del encabezado muestra pendientes (nuevo, pago sin confirmar, entrega pendiente).",
      },
      { type: "title", text: "3. WhatsApp y copiar" },
      {
        type: "body",
        text: "Cada pedido incluye boton WhatsApp con mensaje listo: productos, totales USD y Bs, tasa BCV del dia, datos de pago. Copiar pega el mismo texto.",
      },
      { type: "title", text: "4. Estados del pedido" },
      {
        type: "body",
        text: "Flujo tipico: Nuevo → Contactado → Pagado → Completado. En escritorio puedes usar vista Kanban y arrastrar tarjetas. Devolucion y Cancelar estan disponibles segun el estado.",
      },
      { type: "title", text: "5. Finanzas" },
      {
        type: "body",
        text: "Reportes por periodo: ventas, propinas, margen, productos top. Cierre de caja diario y descarga PDF con logo. Clientes agrupa por telefono (historial y LTV).",
      },
      { type: "title", text: "6. Productos y configuracion" },
      {
        type: "body",
        text: "Productos: precio, costo, descripcion, mostrar/ocultar. Configuracion: tasa BCV, datos de pago estructurados (banco, cedula, telefono), WhatsApp del encargado.",
      },
      { type: "title", text: "7. Instalar como app (PWA)" },
      {
        type: "body",
        text: "En el panel aparece aviso para agregar a pantalla de inicio (Chrome/Android) o instrucciones en Safari/iOS. Abre el panel a pantalla completa como una app.",
      },
    ],
    margin + 14,
    flowOpts
  );

  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...RED);
  doc.text("C. Preguntas frecuentes", margin, margin + 6);

  writeFlow(
    doc,
    [
      {
        type: "title",
        text: "¿Necesito instalar una app?",
      },
      {
        type: "body",
        text: "No para pedir. El panel del dueno puede instalarse como PWA opcionalmente.",
      },
      {
        type: "title",
        text: "¿Que pasa si no hay internet?",
      },
      {
        type: "body",
        text: "No se pueden enviar pedidos nuevos. Los pedidos ya guardados permanecen en la base de datos.",
      },
      {
        type: "title",
        text: "¿Los precios en bolivares son oficiales?",
      },
      {
        type: "body",
        text: "Se calculan con la tasa BCV que el dueno configura en el panel. Debe actualizarse segun la politica del negocio.",
      },
      {
        type: "title",
        text: "¿Donde cambio la tasa o los datos de pago?",
      },
      {
        type: "body",
        text: "Panel admin → Configuracion.",
      },
    ],
    margin + 14,
    flowOpts
  );

  // ----- Pagina final: AVISO LEGAL (enfasis) -----
  doc.addPage();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 248, 236);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setDrawColor(...RED);
  doc.setLineWidth(1.2);
  doc.rect(margin - 2, margin - 2, pageW - 2 * (margin - 2), pageH - 2 * (margin - 2));

  let y = margin + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...RED);
  doc.text("AVISO IMPORTANTE", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const legalParas = [
    "Este sistema es una HERRAMIENTA DE APOYO OPERATIVO para tomar pedidos, comunicarse con clientes y llevar un registro digital auxiliar.",
    "",
    "NO sustituye la contabilidad oficial, los libros exigidos por la ley, la facturacion fiscal ni los registros ante el fisco. Los totales y reportes del panel pueden contener errores por uso humano, por datos mal cargados o por fallas temporales de servicio o de conexion.",
    "",
    "El dueno del negocio es responsable de:",
    "  • Mantener su libro de ventas y demas registros oficiales de forma independiente.",
    "  • Verificar montos, pedidos y pagos antes de tomar decisiones.",
    "  • Usar este software como complemento, no como unica fuente de verdad financiera.",
    "",
    "El desarrollador no garantiza cifras exactas ni se hace responsable por perdidas, discrepancias contables, decisiones tomadas con base en los reportes del sistema, ni por interrupciones de terceros (hosting, base de datos, internet).",
  ];

  for (const para of legalParas) {
    if (para === "") {
      y += 4;
      continue;
    }
    const isBullet = para.startsWith("  ");
    doc.setFont("helvetica", isBullet ? "normal" : "bold");
    doc.setFontSize(isBullet ? 10 : 10.5);
    const lines = doc.splitTextToSize(para.trimStart(), pageW - 2 * margin);
    for (const line of lines) {
      if (y > pageH - margin - 10) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5.5;
    }
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...RED);
  const closing = "En resumen: use el sistema para agilizar pedidos y comunicacion; lleve sus finanzas oficiales por los canales que la ley y su contador indiquen.";
  const closingLines = doc.splitTextToSize(closing, pageW - 2 * margin);
  for (const line of closingLines) {
    doc.text(line, margin, y);
    y += 6;
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(OUT_FILE, buf);
  console.log("OK:", OUT_FILE);
}

main();
