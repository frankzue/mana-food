"use client";

import Image from "next/image";
import {
  Printer,
  Download,
  ShoppingCart,
  MessageCircle,
  CreditCard,
  Bell,
  Package,
  Users,
  LineChart,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  LayoutGrid,
} from "lucide-react";

/**
 * Manual Maná — documento imprimible.
 *
 * La idea es que el dueño abra /manual en su navegador, revise que se vea
 * bien y luego use Ctrl+P → "Guardar como PDF" para entregárselo impreso o
 * por email a su cliente. Está dividido en 3 grandes bloques:
 *   A. Para el cliente final (flujo de pedido).
 *   B. Para el dueño/administrador (panel completo).
 *   C. Preguntas frecuentes + soporte.
 *
 * Todo el contenido usa colores de marca pero con contraste alto para que
 * la versión impresa en blanco y negro también sea legible.
 */
export function ManualDocument() {
  return (
    <div className="manual-root bg-[#f5f5ef] min-h-screen text-[#1a1a1a]">
      {/* Estilos específicos del manual. Se cargan sólo aquí. */}
      <style jsx global>{`
        .manual-root {
          font-family: "Inter", system-ui, -apple-system, sans-serif;
        }
        .manual-section {
          page-break-after: always;
          break-after: page;
        }
        .manual-section:last-child {
          page-break-after: auto;
        }
        .manual-step {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          @page {
            size: A4;
            margin: 14mm 14mm 18mm 14mm;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .manual-root {
            background: white !important;
          }
          .manual-page {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          a[href]:after {
            content: "" !important;
          }
          /* Mantener colores de marca en impresión cuando el usuario marca
             "Más ajustes → Gráficos en segundo plano". */
          .manual-root,
          .manual-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Barra flotante: sólo pantalla, NO imprime */}
      <div className="no-print sticky top-0 z-20 bg-[#1a1a1a] text-white py-3 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-black ring-1 ring-[#FFC72C]/40 shrink-0">
            <Image src="/logo.png" alt="Maná" fill sizes="32px" className="object-contain" />
          </div>
          <div>
            <p className="font-black leading-none">Manual de uso · Maná Fast Food</p>
            <p className="text-[11px] text-white/60 leading-none mt-0.5">
              Revisa el documento y pulsa el botón para guardarlo como PDF.
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-[#FFC72C] text-[#1a1a1a] px-4 py-2 text-xs font-black uppercase tracking-wider hover:brightness-95 active:scale-[0.98] transition"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar PDF
        </button>
      </div>

      <div className="mx-auto max-w-[920px] px-4 py-6 print:px-0 print:py-0">
        {/* ==================== PORTADA ==================== */}
        <article className="manual-section manual-page bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-8 sm:p-12 min-h-[92vh] flex flex-col justify-between print:min-h-[94vh]">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-black ring-2 ring-[#FFC72C]/40 shrink-0">
                <Image src="/logo.png" alt="Maná" fill sizes="64px" className="object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C8102E]">
                  Manual de uso
                </p>
                <h1 className="font-black text-3xl leading-tight">Maná Fast Food</h1>
              </div>
            </div>

            <h2 className="font-black text-5xl leading-[1.05] tracking-tight text-[#1a1a1a]">
              Cómo funciona
              <br />
              tu sistema de
              <br />
              <span className="text-[#C8102E]">pedidos online.</span>
            </h2>

            <p className="mt-8 text-lg text-gray-600 max-w-xl leading-relaxed">
              Una guía corta y visual para que tú, tus trabajadores y tus clientes aprovechen al
              100% la app web. Dividida en tres secciones:
            </p>

            <ol className="mt-6 space-y-3 max-w-xl">
              <TOCItem num="A" title="Para tus clientes" subtitle="El flujo completo del pedido, paso a paso." />
              <TOCItem num="B" title="Para ti y tus trabajadores" subtitle="Cómo usar el panel de administración." />
              <TOCItem num="C" title="Preguntas frecuentes" subtitle="Soluciones rápidas a dudas comunes." />
            </ol>
          </div>

          <footer className="mt-10 pt-6 border-t border-black/10 flex items-center justify-between text-[11px] text-gray-500">
            <span>Maná Fast Food · Av. 17 Dic., Firestone · Ciudad Bolívar</span>
            <span>Versión 1.0</span>
          </footer>
        </article>

        {/* ==================== SECCIÓN A — CLIENTES ==================== */}
        <SectionCover
          letter="A"
          eyebrow="Para tus clientes"
          title="Así se hace un pedido."
          lead="Todo ocurre en el navegador (no hace falta instalar nada). Funciona en cualquier teléfono, tablet o computador."
          icon={<ShoppingCart className="h-6 w-6" />}
        />

        <ManualStep
          n={1}
          title="Abrir el menú"
          desc="El cliente entra al link de la tienda (ej. menú-mana.com). Lo primero que ve es el menú con las categorías y los más pedidos."
          tip="Tip: mandas el link por WhatsApp o lo pegas en tu bio de Instagram. No tienen que descargar nada."
          mockup={<MockupHeader />}
        />

        <ManualStep
          n={2}
          title="Elegir un producto"
          desc="Al tocar cualquier producto se abre una ficha grande con la foto, el precio, la descripción y las opciones para personalizar (queso extra, sin cebolla, punto de cocción, etc.)."
          tip='El botón rojo "+" de la esquina agrega el producto directo sin abrir la ficha.'
          mockup={<MockupProductCard />}
        />

        <ManualStep
          n={3}
          title="Revisar el carrito"
          desc="Abajo aparece una barra flotante con el total. Al tocarla se abre el carrito donde puede ajustar cantidades, borrar ítems o ver el resumen. El IVA aparece como 'incluido' porque ya está en los precios."
          mockup={<MockupCart />}
        />

        <ManualStep
          n={4}
          title="Llenar los datos de entrega"
          desc="El cliente elige si es Delivery o Pickup. Si es Delivery, selecciona la zona (el costo de envío se suma automáticamente). Luego llena nombre, teléfono y dirección."
          tip="Los datos se guardan en su navegador para la próxima vez. No tiene que volver a escribir todo."
          mockup={<MockupCheckout />}
        />

        <ManualStep
          n={5}
          title="Elegir el método de pago"
          desc="Las opciones son Pago Móvil, Zelle, Transferencia, Binance y Efectivo (USD/Bs). Los datos para pagar los recibe después, por WhatsApp, con tu información actualizada desde el panel."
          icon={<CreditCard className="h-5 w-5" />}
        />

        <ManualStep
          n={6}
          title="Enviar el pedido"
          desc='El cliente pulsa "Enviar pedido" y aparece una confirmación en pantalla: pedido #XXXX recibido, el negocio lo contactará por WhatsApp para cerrar el pago.'
          mockup={<MockupSuccess />}
        />

        <ManualStep
          n={7}
          title="Recibir el resumen por WhatsApp"
          desc="El negocio le envía por WhatsApp un mensaje con todos los detalles: productos, entrega, total en USD y Bs a la tasa del día, y los datos exactos para pagar (banco, cédula, teléfono, titular)."
          icon={<MessageCircle className="h-5 w-5" />}
          mockup={<MockupWhatsApp />}
        />

        <ManualStep
          n={8}
          title="Pagar y enviar comprobante"
          desc="El cliente paga con los datos que recibió y envía el comprobante por el mismo chat. Cuando lo confirmas, se despacha el pedido."
          tip="Si el cliente necesita cambiar algo (producto, dirección, hora), el mensaje le pide que responda ANTES de pagar. Evita devoluciones."
        />

        {/* ==================== SECCIÓN B — ADMIN ==================== */}
        <SectionCover
          letter="B"
          eyebrow="Para ti y tus trabajadores"
          title="El panel de administración."
          lead="Se accede desde el enlace /admin (o desde el enlace discreto 'Acceso empleados' que está al pie de la página principal)."
          icon={<LayoutGrid className="h-6 w-6" />}
        />

        <ManualStep
          n={1}
          title="Iniciar sesión"
          desc="Cada trabajador entra con el email y contraseña que le crees en Supabase. Se recomienda un usuario por trabajador para poder rastrear quién hizo qué."
          tip="Desde el teléfono, el botón 'Instalar app' agrega el panel al home screen como si fuera una app nativa (pantalla completa, icono con el logo)."
          icon={<Smartphone className="h-5 w-5" />}
        />

        <ManualStep
          n={2}
          title="Recibir un pedido nuevo"
          desc="Cuando entra un pedido, el panel reproduce una campanilla musical y muestra un toast rojo en la parte superior. Además, la campanita del header suma un contador."
          icon={<Bell className="h-5 w-5" />}
          mockup={<MockupOrderCard />}
        />

        <ManualStep
          n={3}
          title="Contactar al cliente"
          desc={
            <>
              Cada pedido tiene un botón grande de <b>WhatsApp</b> que abre el chat del cliente con el
              mensaje ya preparado: resumen, totales en USD y Bs, tasa BCV del día y los datos de pago.
              El botón <b>Copiar</b> copia el mensaje si prefieres pegarlo tú manualmente.
            </>
          }
        />

        <ManualStep
          n={4}
          title="Marcar los estados"
          desc={
            <>
              El pedido sigue 4 estados visibles: <b>Nuevo → Contactado → Pagado → Completado</b>. El
              botón principal de cada tarjeta siempre indica el siguiente paso lógico. En desktop puedes
              alternar a vista <b>Kanban</b> y arrastrar las tarjetas entre columnas.
            </>
          }
          mockup={<MockupKanban />}
        />

        <ManualStep
          n={5}
          title="Registrar devoluciones"
          desc='Si el cliente exige un reembolso, el botón "Devolución" te permite registrar el monto devuelto y el motivo. Queda marcado en el pedido y se refleja en el reporte de Ventas como "Devuelto".'
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <ManualStep
          n={6}
          title="Finanzas: ventas y cierre de caja"
          desc={
            <>
              En <b>Finanzas</b> encuentras reportes del día, semana, mes y año: ingresos, propinas,
              productos más vendidos, margen bruto y desglose por método de pago. El <b>Cierre de caja</b>{" "}
              diario te permite confrontar el sistema con lo físico y dejar anotadas las observaciones.
              Todo se puede descargar en PDF con tu logo.
            </>
          }
          icon={<LineChart className="h-5 w-5" />}
        />

        <ManualStep
          n={7}
          title="Mini-CRM de clientes"
          desc="La sección Clientes agrupa los pedidos por número de teléfono: cuántas veces pidió cada uno, cuánto gastó en total (LTV), qué fue lo último que compró. Útil para campañas de WhatsApp o identificar tus mejores clientes."
          icon={<Users className="h-5 w-5" />}
        />

        <ManualStep
          n={8}
          title="Gestionar productos"
          desc={
            <>
              Desde <b>Productos</b> puedes cambiar el precio, el costo (para calcular margen), la
              descripción y ocultar o mostrar un producto (útil si se te acabó algo). Los cambios se
              reflejan al instante en la tienda.
            </>
          }
          icon={<Package className="h-5 w-5" />}
        />

        <ManualStep
          n={9}
          title="Configuración"
          desc={
            <>
              En <b>Configuración</b> se actualiza la tasa BCV del día, los datos de pago (banco,
              cédula, teléfono, titular) con menús desplegables, y el WhatsApp del encargado. Siempre
              que cambias la tasa, los precios en Bs se recalculan automáticamente.
            </>
          }
          icon={<Settings className="h-5 w-5" />}
          tip="Recomendado: actualizar la tasa BCV todos los días antes de abrir."
        />

        {/* ==================== SECCIÓN C — FAQ ==================== */}
        <SectionCover
          letter="C"
          eyebrow="Apéndice"
          title="Preguntas frecuentes."
          lead="Las dudas más comunes del primer mes, con sus respuestas directas."
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <article className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8 space-y-5">
          <FAQ
            q="¿Cuánto cuesta recibir pedidos?"
            a="No hay comisión por pedido. El único costo es el hosting del panel y la base de datos; ambos usan planes gratuitos para un volumen pequeño-medio de órdenes."
          />
          <FAQ
            q="¿Qué pasa si se cae internet?"
            a="Los clientes no podrán enviar pedidos hasta que vuelva la conexión. Los pedidos ya recibidos y sus datos quedan seguros en la base de datos; no se pierden."
          />
          <FAQ
            q="¿Puedo seguir usando mi libro físico de ventas?"
            a="Sí, y lo recomendamos. El sistema es un apoyo digital y un respaldo. El libro físico sigue siendo el registro contable oficial frente a SENIAT."
          />
          <FAQ
            q="¿Un cliente puede hacer un pedido falso?"
            a="Puede, igual que por WhatsApp. Por eso el flujo pide siempre confirmar por WhatsApp antes de preparar. Si detectas un cliente problemático, puedes marcar el pedido como cancelado."
          />
          <FAQ
            q="¿Los datos de mis clientes están seguros?"
            a="Sí. La base de datos tiene Row Level Security: sólo usuarios autenticados como admin pueden leer pedidos. La info viaja encriptada (HTTPS). Nadie del público puede ver tus ventas."
          />
          <FAQ
            q="¿Qué hago si un pedido dice error al enviarse?"
            a="Suele ser porque la tasa BCV está a 0 o porque un producto fue borrado mientras el cliente navegaba. Revisa Configuración y recarga la app. Si persiste, contacta soporte."
          />
          <FAQ
            q="¿Puedo cambiar el menú solo/a?"
            a='Sí. Desde "Productos" cambias precio, descripción y visibilidad. Para agregar productos nuevos o categorías, se puede entrar a la base de datos (tu desarrollador puede ayudar en el setup inicial).'
          />
          <FAQ
            q="¿Cómo actualizo la tasa BCV?"
            a='Entra al panel → Configuración → campo "Tasa BCV" → pones el valor del día y Guardas. Todo el menú y los cálculos de pedidos se recalculan inmediatamente.'
          />
        </article>

        {/* CONTRAPORTADA */}
        <article className="mt-6 bg-[#1a1a1a] text-white rounded-2xl p-8 sm:p-10 print:rounded-none">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-black ring-1 ring-[#FFC72C]/40">
              <Image src="/logo.png" alt="Maná" fill sizes="40px" className="object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFC72C]">
                Manual Maná
              </p>
              <h3 className="font-black text-xl leading-none">Listo para operar</h3>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed max-w-xl">
            Si te quedó alguna duda, primero revisa la sección{" "}
            <span className="text-[#FFC72C] font-bold">C · Preguntas frecuentes</span>. Para soporte
            técnico, contáctanos por el WhatsApp que te dejó el desarrollador al entregar el sistema.
            Conserva este manual a la mano, especialmente durante la primera semana.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span>© Maná Fast Food</span>
            <span>Manual v1.0 · uso interno</span>
          </div>
        </article>
      </div>
    </div>
  );
}

// =========================================================
// COMPONENTES AUXILIARES
// =========================================================

function TOCItem({ num, title, subtitle }: { num: string; title: string; subtitle: string }) {
  return (
    <li className="flex items-start gap-4 rounded-xl bg-[#fdfbf3] ring-1 ring-[#FFC72C]/30 p-4">
      <span className="grid place-items-center h-10 w-10 rounded-full bg-[#C8102E] text-white font-black text-lg shrink-0">
        {num}
      </span>
      <div>
        <p className="font-black text-lg text-[#1a1a1a] leading-tight">{title}</p>
        <p className="text-[13px] text-gray-600 leading-snug mt-0.5">{subtitle}</p>
      </div>
    </li>
  );
}

function SectionCover({
  letter,
  eyebrow,
  title,
  lead,
  icon,
}: {
  letter: string;
  eyebrow: string;
  title: string;
  lead: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="manual-section bg-gradient-to-br from-[#C8102E] via-[#8b0a20] to-[#1a1a1a] text-white rounded-2xl p-10 sm:p-14 min-h-[80vh] flex flex-col justify-center my-6 shadow-sm print:min-h-[85vh]">
      <div className="flex items-center gap-3 text-[#FFC72C]">
        <span className="grid place-items-center h-12 w-12 rounded-xl bg-[#FFC72C] text-[#1a1a1a] font-black text-2xl shadow-xl">
          {letter}
        </span>
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
          {icon}
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-6 font-black text-4xl sm:text-5xl leading-[1.05] tracking-tight max-w-2xl">
        {title}
      </h2>
      <p className="mt-5 text-lg text-white/80 max-w-xl leading-relaxed">{lead}</p>
    </article>
  );
}

function ManualStep({
  n,
  title,
  desc,
  tip,
  mockup,
  icon,
}: {
  n: number;
  title: string;
  desc: React.ReactNode;
  tip?: string;
  mockup?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <article className="manual-step bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8 mb-5">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-[#1a1a1a] text-[#FFC72C] font-black text-sm shrink-0">
              {n}
            </span>
            <h3 className="font-black text-xl text-[#1a1a1a] leading-tight flex items-center gap-2">
              {icon && <span className="text-[#C8102E]">{icon}</span>}
              {title}
            </h3>
          </div>
          <div className="text-[14.5px] text-gray-700 leading-relaxed">{desc}</div>
          {tip && (
            <div className="mt-4 rounded-xl bg-[#fffaec] ring-1 ring-[#FFC72C]/50 px-4 py-3 text-[13px] text-[#4a3a00] leading-relaxed">
              <span className="font-black text-[#C8102E] uppercase tracking-wider text-[10px]">
                Tip —
              </span>{" "}
              {tip}
            </div>
          )}
        </div>

        {mockup && (
          <div className="sm:w-[280px] shrink-0">
            <div className="rounded-xl bg-[#f5f5ef] ring-1 ring-black/5 p-3">{mockup}</div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400 uppercase tracking-wider">
              Así se ve
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="manual-step border-l-4 border-[#C8102E] pl-4 py-1">
      <p className="font-black text-[#1a1a1a] text-[15px] leading-snug">{q}</p>
      <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">{a}</p>
    </div>
  );
}

// =========================================================
// MOCKUPS (dibujos simplificados de la UI real)
// =========================================================

function MockupHeader() {
  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#141414] via-[#1f0d10] to-[#141414] text-white p-2.5">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-black ring-1 ring-[#FFC72C]/40 grid place-items-center text-[9px]">
          🍔
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-[11px] font-black leading-none truncate">Maná Fast Food</p>
            <span className="text-[7px] rounded-full bg-emerald-500/30 text-emerald-200 px-1 py-[1px] font-bold">
              ● ABIERTO
            </span>
          </div>
          <p className="text-[8px] text-white/60 mt-0.5">🕐 6 PM – 4 AM</p>
        </div>
      </div>
    </div>
  );
}

function MockupProductCard() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/10 overflow-hidden shadow-sm">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#ffeaa7] via-[#fff8ec] to-white grid place-items-center text-4xl">
        🍔
        <span className="absolute top-1.5 left-1.5 text-[9px] font-black text-[#C8102E] bg-white/95 px-1.5 py-0.5 rounded-full shadow-sm">
          $7.00
        </span>
        <span className="absolute bottom-1.5 right-1.5 grid place-items-center h-6 w-6 rounded-full bg-[#C8102E] text-white text-sm font-black shadow-sm">
          +
        </span>
      </div>
      <div className="p-2">
        <p className="text-[11px] font-bold leading-tight">Maná Especial</p>
        <p className="text-[9px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
          150gr carne · queso · tocineta · salsa de la casa.
        </p>
      </div>
    </div>
  );
}

function MockupCart() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/10 p-3 text-[11px]">
      <p className="font-black text-[12px] mb-2">Tu pedido</p>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span>2× Maná Especial</span>
          <span className="font-bold">$14.00</span>
        </div>
        <div className="flex justify-between">
          <span>1× Hot Dog Doble</span>
          <span className="font-bold">$5.50</span>
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-black/10 space-y-1">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>$19.50</span>
        </div>
        <div className="flex justify-between text-gray-400 text-[10px]">
          <span>IVA</span>
          <span>incluido</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Envío · Los Próceres</span>
          <span>$2.00</span>
        </div>
        <div className="flex justify-between font-black text-[13px] text-[#1a1a1a] mt-1">
          <span>Total</span>
          <span>$21.50</span>
        </div>
      </div>
      <div className="mt-2.5 rounded-full bg-[#C8102E] text-white text-center py-1.5 font-black text-[11px]">
        Ir al checkout
      </div>
    </div>
  );
}

function MockupCheckout() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/10 p-3 space-y-2 text-[10px]">
      <p className="font-black text-[11px]">Tus datos</p>
      <div className="grid grid-cols-2 gap-1">
        <div className="rounded-md bg-[#FFC72C] text-[#1a1a1a] text-center py-1 font-bold">
          Delivery
        </div>
        <div className="rounded-md bg-gray-100 text-gray-500 text-center py-1">Pickup</div>
      </div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">
        Nombre y apellido
      </div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">
        Teléfono / WhatsApp
      </div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">
        Zona de entrega ▾
      </div>
    </div>
  );
}

function MockupSuccess() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-emerald-200 p-4 text-center">
      <div className="grid place-items-center h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="font-black text-[12px] mt-2">¡Pedido enviado!</p>
      <p className="text-[10px] text-gray-500 leading-snug mt-1">
        Te contactaremos por WhatsApp para confirmar el pago.
      </p>
      <p className="text-[10px] font-black text-[#C8102E] mt-2">#0042</p>
    </div>
  );
}

function MockupWhatsApp() {
  return (
    <div className="rounded-xl bg-[#E5F8D7] p-2.5 text-[9px] text-gray-700 leading-snug font-mono">
      <p>
        Hola María 👋 Soy del equipo de <b>Maná Fast Food</b>.
      </p>
      <p className="mt-1">
        Recibimos tu pedido <b>#0042</b> 🍔 — revisa antes de pagar:
      </p>
      <p className="mt-1">• 2× Maná Especial — $14.00</p>
      <p className="mt-1">
        <b>TOTAL:</b> $21.50 / 10.450 Bs
      </p>
      <p className="mt-1 text-gray-500 text-[8px]">Tasa BCV: 486.05 Bs/USD</p>
      <p className="mt-1.5">Banco: Venezuela · V-15664358 · 0412-3650964</p>
    </div>
  );
}

function MockupOrderCard() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/10 overflow-hidden shadow-sm">
      <div className="bg-[#C8102E] text-white px-2.5 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-black">#0042 · Nuevo</span>
        <span className="text-[9px] opacity-80">hace 2m</span>
      </div>
      <div className="p-2.5 space-y-1 text-[10px]">
        <p className="font-bold">María González</p>
        <p className="text-gray-500">📍 Los Próceres</p>
        <p className="text-gray-500">💳 Pago Móvil · $21.50</p>
        <div className="flex gap-1 mt-2">
          <div className="flex-1 rounded-full bg-emerald-500 text-white text-center py-0.5 text-[9px] font-bold">
            WhatsApp
          </div>
          <div className="rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-[9px]">
            Copiar
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupKanban() {
  return (
    <div className="grid grid-cols-4 gap-1 text-[7.5px]">
      {[
        { label: "Nuevo", bg: "bg-[#C8102E]/15 border-t-2 border-[#C8102E]", count: 2 },
        { label: "Contactado", bg: "bg-[#FFC72C]/20 border-t-2 border-[#FFC72C]", count: 3 },
        { label: "Pagado", bg: "bg-blue-500/15 border-t-2 border-blue-500", count: 1 },
        { label: "Completado", bg: "bg-emerald-500/15 border-t-2 border-emerald-500", count: 5 },
      ].map((c) => (
        <div key={c.label} className={`${c.bg} rounded p-1`}>
          <p className="font-black">{c.label}</p>
          <p className="text-gray-600">{c.count} pedidos</p>
          <div className="mt-1 space-y-1">
            {Array.from({ length: Math.min(c.count, 2) }).map((_, i) => (
              <div key={i} className="rounded bg-white/80 px-1 py-0.5 text-gray-700">
                #00{40 + i}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
