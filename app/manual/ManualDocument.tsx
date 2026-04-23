"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
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
  ShieldAlert,
} from "lucide-react";

/**
 * Manual visual Maná — diseñado para imprimir / guardar como PDF (Ctrl+P).
 * No sustituye asesoría legal; la última sección enfatiza uso solo de apoyo.
 */
export function ManualDocument() {
  return (
    <div className="manual-root bg-[#f5f5ef] min-h-screen text-[#1a1a1a]">
      <style jsx global>{`
        .manual-root {
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .manual-section {
          page-break-after: always;
          break-after: page;
        }
        .manual-section:last-of-type {
          page-break-after: auto;
        }
        .manual-step {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          @page {
            size: A4;
            margin: 12mm 12mm 16mm 12mm;
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
            border-radius: 0 !important;
          }
          a[href]:after {
            content: "" !important;
          }
          .manual-root,
          .manual-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 bg-[#1a1a1a] text-white py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-black ring-1 ring-[#FFC72C]/40 shrink-0">
            <Image src="/logo.png" alt="Maná" fill sizes="32px" className="object-contain" />
          </div>
          <div>
            <p className="font-black leading-none text-sm sm:text-base">Manual Maná Fast Food</p>
            <p className="text-[11px] text-white/60 leading-tight mt-0.5">
              Versión visual · Usa <strong className="text-[#FFC72C]">Ctrl+P</strong> (o Cmd+P en Mac) →
              &quot;Guardar como PDF&quot; para el archivo final.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFC72C] text-[#1a1a1a] px-4 py-2 text-xs font-black uppercase tracking-wider hover:brightness-95 active:scale-[0.98] transition shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Guardar como PDF
        </button>
      </div>

      <div className="mx-auto max-w-[920px] px-4 py-6 print:px-0 print:py-0 print:max-w-none">
        {/* PORTADA */}
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

            <h2 className="font-black text-4xl sm:text-5xl leading-[1.05] tracking-tight text-[#1a1a1a]">
              Cómo funciona
              <br />
              tu sistema de
              <br />
              <span className="text-[#C8102E]">pedidos online</span>
            </h2>

            <p className="mt-8 text-lg text-gray-600 max-w-xl leading-relaxed">
              Guía ilustrada para clientes, dueños y personal. Imprime esta página o expórtala a PDF
              desde el navegador cuando lo necesites.
            </p>

            <ol className="mt-6 space-y-3 max-w-xl">
              <TOCItem num="A" title="Para tus clientes" subtitle="Del menú al WhatsApp y al pago." />
              <TOCItem
                num="B"
                title="Para ti y tu equipo"
                subtitle="Panel admin: pedidos, finanzas, productos, configuración."
              />
              <TOCItem num="C" title="Preguntas frecuentes" subtitle="Dudas típicas del día a día." />
              <TOCItem
                num="D"
                title="Aviso legal (importante)"
                subtitle="El sistema es solo de apoyo operativo — léelo antes de entregar el manual."
              />
            </ol>
          </div>

          <footer className="mt-10 pt-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-gray-500">
            <span>Maná Fast Food · Av. 17 Dic., Firestone · Ciudad Bolívar</span>
            <span>Manual visual v2 · {new Date().getFullYear()}</span>
          </footer>
        </article>

        <SectionCover
          letter="A"
          eyebrow="Para tus clientes"
          title="Así se hace un pedido."
          lead="Todo en el navegador: teléfono, tablet o PC. No hay que instalar una app para pedir."
          icon={<ShoppingCart className="h-6 w-6" />}
        />

        <ManualStep
          n={1}
          title="Abrir el menú"
          desc="El cliente entra al enlace de la tienda. Ve categorías con iconos, promos destacadas, buscador y productos ordenados por sección."
          tip="Comparte el link por WhatsApp, Instagram o QR. Es la misma URL para todos."
          mockup={<MockupHeader />}
        />

        <ManualStep
          n={2}
          title="Elegir producto y personalizar"
          desc="Al tocar un producto se abre la ficha: foto, precio, descripción y modificadores (extras, punto de cocción, etc.)."
          tip='El botón rojo "+" en la tarjeta agrega rápido sin abrir la ficha completa.'
          mockup={<MockupProductCard />}
        />

        <ManualStep
          n={3}
          title="Revisar el carrito"
          desc="La barra inferior muestra el total. Al tocarla se abre el carrito: cantidades, borrar ítems y resumen. El IVA se muestra como incluido en el precio (no se suma aparte al total)."
          mockup={<MockupCart />}
        />

        <ManualStep
          n={4}
          title="Datos de entrega"
          desc="Elige Delivery o Pickup. En Delivery selecciona la zona: el envío se suma solo. Completa nombre, teléfono y dirección. Opcionalmente puede dejar notas."
          tip="El navegador puede recordar los datos para la próxima visita."
          mockup={<MockupCheckout />}
        />

        <ManualStep
          n={5}
          title="Método de pago"
          desc="Selecciona Pago Móvil, Zelle, transferencia, Binance o efectivo. Los datos bancarios exactos los recibirá por WhatsApp, generados desde tu configuración en el panel."
          icon={<CreditCard className="h-5 w-5" />}
        />

        <ManualStep
          n={6}
          title="Enviar el pedido"
          desc='Al pulsar "Enviar pedido" aparece confirmación en pantalla con el número de pedido. El negocio lo verá al instante en el panel (con sonido si está activado).'
          mockup={<MockupSuccess />}
        />

        <ManualStep
          n={7}
          title="WhatsApp con resumen y montos"
          desc="Desde el panel, el dueño envía un mensaje con: productos, subtotal, envío, total USD y Bs según tasa BCV del día, y datos de pago simplificados (banco, cédula, teléfono)."
          icon={<MessageCircle className="h-5 w-5" />}
          mockup={<MockupWhatsApp />}
        />

        <ManualStep
          n={8}
          title="Pagar y comprobante"
          desc="El cliente paga y envía el comprobante por WhatsApp. Si algo no cuadra, el mensaje le pide que avise antes de pagar para corregir."
        />

        <SectionCover
          letter="B"
          eyebrow="Panel de administración"
          title="Operación diaria."
          lead="Acceso en /admin o desde el enlace discreto «Acceso empleados» en el pie de la página pública. Cada usuario inicia sesión con email y contraseña."
          icon={<LayoutGrid className="h-6 w-6" />}
        />

        <ManualStep
          n={1}
          title="Inicio de sesión y PWA"
          desc="Los usuarios admin se crean en Supabase Auth. En Chrome/Android puedes instalar el panel como app (aviso flotante): icono en el escritorio y pantalla completa."
          icon={<Smartphone className="h-5 w-5" />}
        />

        <ManualStep
          n={2}
          title="Lista de pedidos y filtros"
          desc="Ves todos los pedidos con chips de filtro: Nuevo, Contactado, Pagado, Completado, Cancelado, Devuelto, etc. Cada tarjeta muestra cliente, zona, método de pago, total y línea de tiempo de estado."
          mockup={<MockupOrderCard />}
        />

        <ManualStep
          n={3}
          title="Vista Kanban (solo en PC)"
          desc="En pantallas grandes puedes alternar Lista / Kanban. Arrastra tarjetas entre columnas Nuevo · Contactado · Pagado · Completado para cambiar el estado. En móvil solo Lista (más cómodo)."
          mockup={<MockupKanban />}
        />

        <ManualStep
          n={4}
          title="Campana de pendientes"
          desc="Junto al logo, la campana resume: pedidos nuevos sin contactar, contactados sin confirmar pago (después de un tiempo), y pagados sin marcar entregado. Sirve para que nada se quede olvidado."
          icon={<Bell className="h-5 w-5" />}
        />

        <ManualStep
          n={5}
          title="WhatsApp y copiar mensaje"
          desc="Botón WhatsApp abre el chat del cliente con el texto listo. Copiar guarda el mismo resumen en el portapapeles. Incluye totales, tasa y datos de pago según lo que eligió el cliente."
        />

        <ManualStep
          n={6}
          title="Acciones: pagado, completado, devolución, cancelar"
          desc="El botón principal guía el siguiente paso (contactar, marcar pagado, marcar entregado). Devolución registra monto y motivo. Cancelar cierra el pedido sin cobro."
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <ManualStep
          n={7}
          title="Finanzas"
          desc="Menú Finanzas: reportes de ventas con filtros (día, semana, mes, histórico), KPIs, propinas, margen si cargaste costos, top productos, exportar PDF. Cierre de caja diario con su propio PDF."
          icon={<LineChart className="h-5 w-5" />}
        />

        <ManualStep
          n={8}
          title="Clientes (mini-CRM)"
          desc="Agrupa por teléfono: cuántos pedidos, gasto total, última compra. Útil para reconocer clientes frecuentes."
          icon={<Users className="h-5 w-5" />}
        />

        <ManualStep
          n={9}
          title="Productos"
          desc="Edita nombre, descripción, precio USD, costo USD y disponibilidad. Ocultar un producto lo quita del menú público sin borrarlo."
          icon={<Package className="h-5 w-5" />}
        />

        <ManualStep
          n={10}
          title="Configuración"
          desc="Tasa BCV del día, IVA informativo, WhatsApp del encargado, y datos estructurados de Pago Móvil, Zelle, transferencias, etc. (bancos y prefijos en listas, no solo texto libre)."
          icon={<Settings className="h-5 w-5" />}
          tip="Actualizar la tasa al abrir evita confusiones en los montos en bolívares."
        />

        <SectionCover
          letter="C"
          eyebrow="Apéndice"
          title="Preguntas frecuentes."
          lead="Respuestas rápidas para clientes, dueños y personal del local."
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <article className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8 space-y-5 mb-6">
          <FAQ q="¿Hay que instalar algo para pedir?" a="No. Solo abrir el enlace de la tienda en el navegador del teléfono o la PC." />
          <FAQ
            q="¿Los precios en bolívares son oficiales ante el fisco?"
            a="Se calculan con la tasa BCV que configuras en el panel. Sirven para orientar al cliente; la facturación y los libros oficiales son un proceso aparte."
          />
          <FAQ
            q="¿Se pierden los pedidos si falla internet?"
            a="Los que ya quedaron guardados en el sistema no. Si no hay conexión, no se pueden enviar pedidos nuevos hasta que vuelva la red."
          />
          <FAQ
            q="¿Los clientes pueden ver el panel de administración?"
            a="No, a menos que alguien les pase la URL /admin y una cuenta. El menú público no muestra ventas ni datos de otros clientes."
          />
          <FAQ
            q="¿Puedo cambiar precios yo mismo?"
            a="Sí. Panel → Productos → Editar en cada ítem (precio, costo, texto, mostrar u ocultar). Los cambios se reflejan en la tienda; si algo no se ve, recarga la página o espera unos segundos por caché."
          />
          <FAQ
            q="¿Cómo oculto un producto que se acabó hoy?"
            a="En Productos usa «Ocultar»; desaparece del menú del cliente pero no se borra. Cuando vuelva a haber, pulsa «Mostrar»."
          />
          <FAQ
            q="¿Qué pasa si olvidé la contraseña del admin?"
            a="Desde Supabase (Auth → Users) se puede enviar recuperación de contraseña o resetearla quien administre el proyecto. No uses la misma clave en todos los locales."
          />
          <FAQ
            q="¿Puedo tener varios usuarios administradores?"
            a="Sí: cada trabajador puede tener su propio correo y contraseña en Supabase Auth. Así queda más claro quién opera el panel."
          />
          <FAQ q="¿Cómo actualizo la tasa BCV?" a="Panel → Configuración → campo Tasa BCV → Guardar. Revisa que el valor sea el que aplican ese día para cobrar." />
          <FAQ
            q="¿El cliente puede hacer el pedido sin WhatsApp?"
            a="Sí: el pedido se registra con el número que escriba. Lo ideal es que sea el mismo WhatsApp para enviarle el resumen y el comprobante."
          />
          <FAQ
            q="¿Por qué suena cuando entra un pedido?"
            a="El panel usa un aviso sonoro y visual para que no se pierda un pedido nuevo. Puedes silenciarlo con el control «Sonido» en la lista de pedidos."
          />
          <FAQ
            q="¿Los pedidos aparecen solos o hay que refrescar?"
            a="Con la conexión en tiempo real activa, suelen aparecer casi al instante. Si algo no se ve, desliza para actualizar o abre de nuevo la pestaña."
          />
          <FAQ
            q="¿Qué es la propina en el checkout?"
            a="Es un monto opcional en dólares que el cliente puede añadir. Se suma al total y sale en el reporte de ventas como propinas."
          />
          <FAQ
            q="¿Qué diferencia hay entre «Pagado» y «Completado»?"
            a="«Pagado» = ya confirmaste el pago del cliente. «Completado» = pedido entregado o retirado y cerrado operativamente. Así separas cobro y despacho."
          />
          <FAQ
            q="¿Cómo registro una devolución de dinero?"
            a="En la tarjeta del pedido, botón Devolución: indicas monto y motivo. El pedido puede quedar marcado como devuelto y se refleja en reportes."
          />
          <FAQ
            q="¿El reporte PDF de ventas o de caja reemplaza mi libro?"
            a="No. Es un respaldo y una vista rápida. Sigue llevando tu libro y tu facturación como marca la ley y tu contador."
          />
          <FAQ
            q="¿Puedo usar el panel solo en el teléfono?"
            a="Sí. En Chrome o Edge del Android puedes «instalar» el panel como app (aviso que aparece abajo). En iPhone, Safari → Compartir → Añadir a inicio."
          />
          <FAQ
            q="¿Qué hago si un cliente dice que el total no cuadra?"
            a="Revisa en el panel el pedido exacto, la zona de envío, propina y la tasa del día. Si la tasa estaba vieja, corrígela para los próximos pedidos y explica la diferencia al cliente."
          />
        </article>

        {/* SECCIÓN D — AVISO LEGAL (énfasis máximo para impresión/PDF) */}
        <article className="manual-section manual-step rounded-2xl overflow-hidden ring-2 ring-[#C8102E] shadow-lg print:shadow-none">
          <div className="bg-gradient-to-br from-[#fff8ec] via-[#fff5e0] to-[#ffe8e8] p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <span className="grid place-items-center h-14 w-14 rounded-2xl bg-[#C8102E] text-white shrink-0 shadow-md">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#C8102E]">
                  Sección D · Leer antes de entregar este manual
                </p>
                <h2 className="font-black text-2xl sm:text-3xl text-[#1a1a1a] leading-tight mt-1">
                  Aviso legal: el sistema es <span className="text-[#C8102E]">solo de apoyo</span>
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-[15px] sm:text-base text-gray-800 leading-relaxed max-w-none">
              <p className="font-bold text-[#1a1a1a]">
                Esta aplicación web es una herramienta operativa auxiliar: tomar pedidos, comunicarse
                con clientes, organizar estados y tener un respaldo digital de la operación.
              </p>
              <p>
                <strong>No sustituye</strong> la contabilidad oficial, los libros exigidos por la ley, la
                facturación fiscal, los registros ante el fisco ni el criterio de un contador. Los
                totales, reportes y exportaciones PDF pueden diferir de la realidad por error humano,
                datos mal cargados, retrasos en la tasa, o fallas temporales de internet, hosting o base
                de datos.
              </p>
              <p>
                El <strong>titular del negocio</strong> es responsable de mantener sus registros
                oficiales por separado, verificar montos antes de decisiones importantes y usar este
                software como <strong>complemento</strong>, no como única fuente de verdad financiera.
              </p>
              <p>
                Quien desarrolla o mantiene el software <strong>no garantiza</strong> cifras exactas ni
                resultados económicos, y no se hace responsable por pérdidas, discrepancias contables,
                sanciones fiscales ni decisiones basadas exclusivamente en los datos del panel.
              </p>
            </div>

            <div className="mt-8 rounded-xl bg-[#1a1a1a] text-white p-5 sm:p-6">
              <p className="font-black text-lg sm:text-xl text-[#FFC72C] leading-snug">
                En resumen: úsenlo para agilizar pedidos y comunicación; lleven las finanzas oficiales
                como siempre (libro, máquina fiscal, asesoría contable). Este manual y el software son
                apoyo, no reemplazo legal ni contable.
              </p>
            </div>
          </div>
        </article>

        <article className="mt-6 mb-10 bg-[#1a1a1a] text-white rounded-2xl p-8 sm:p-10 print:rounded-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-black ring-1 ring-[#FFC72C]/40">
              <Image src="/logo.png" alt="Maná Fast Food" fill sizes="40px" className="object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFC72C]">
                Cierre del manual
              </p>
              <h3 className="font-black text-xl leading-tight">Fin del documento</h3>
              <p className="text-[11px] text-white/55 leading-snug mt-1 max-w-xl">
                <strong className="text-white/80">Maná Fast Food</strong> es el nombre comercial del
                negocio. Esta guía describe cómo usar la <strong className="text-white/80">herramienta de
                pedidos</strong> desarrollada para ese negocio; quien programó e instaló el sistema es quien
                debe brindarte soporte técnico.
              </p>
            </div>
          </div>
          <p className="text-white/75 leading-relaxed max-w-2xl text-sm">
            Para dudas de funcionamiento, cambios técnicos o incidencias, contacta a quien te entregó el
            proyecto. Conserva una copia PDF de este manual junto con contratos y credenciales en un lugar
            seguro.
          </p>
          <p className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/45">
            Documento generado desde la app · Impresión: Ctrl+P / Cmd+P → Guardar como PDF
          </p>
        </article>
      </div>
    </div>
  );
}

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
  icon: ReactNode;
}) {
  return (
    <article className="manual-section bg-gradient-to-br from-[#C8102E] via-[#8b0a20] to-[#1a1a1a] text-white rounded-2xl p-10 sm:p-14 min-h-[75vh] flex flex-col justify-center my-6 shadow-sm print:min-h-[85vh] print:rounded-none">
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
  desc: ReactNode;
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
              Vista simplificada
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
          <p className="text-[8px] text-white/60 mt-0.5">🕐 Horario · 6 PM – 4 AM</p>
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
          <span>incluido en precio</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Envío</span>
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
        <div className="rounded-md bg-[#FFC72C] text-[#1a1a1a] text-center py-1 font-bold">Delivery</div>
        <div className="rounded-md bg-gray-100 text-gray-500 text-center py-1">Pickup</div>
      </div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">Nombre y apellido</div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">Teléfono / WhatsApp</div>
      <div className="rounded-md ring-1 ring-black/10 px-2 py-1.5 text-gray-400">Zona de entrega ▾</div>
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
          <div className="rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-[9px]">Copiar</div>
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
        { label: "Listo", bg: "bg-emerald-500/15 border-t-2 border-emerald-500", count: 5 },
      ].map((c) => (
        <div key={c.label} className={`${c.bg} rounded p-1`}>
          <p className="font-black">{c.label}</p>
          <p className="text-gray-600">{c.count}</p>
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
