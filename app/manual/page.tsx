import type { Metadata } from "next";
import { ManualDocument } from "./ManualDocument";

export const metadata: Metadata = {
  title: "Manual de uso · Maná Fast Food",
  description:
    "Manual imprimible del sistema de pedidos Maná: guía para clientes y para administradores.",
  robots: { index: false, follow: false },
};

/**
 * Ruta /manual
 *
 * Documento imprimible que explica el uso de la app web Maná para clientes
 * y administradores. Está diseñado para imprimirse a PDF desde el navegador
 * con Ctrl/Cmd + P. Incluye estilos @media print específicos para que el
 * PDF resultante quede limpio (sin barra de navegación, sin botón de imprimir
 * y con saltos de página controlados).
 */
export default function ManualPage() {
  return <ManualDocument />;
}
