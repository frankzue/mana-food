import type { Metadata } from "next";
import { ManualDocument } from "./ManualDocument";

export const metadata: Metadata = {
  title: "Manual de uso · Maná Fast Food",
  description:
    "Guía visual para clientes y administradores. Imprime o guarda como PDF desde el navegador.",
  robots: { index: false, follow: false },
};

export default function ManualPage() {
  return <ManualDocument />;
}
