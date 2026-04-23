import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Finanzas"
      subtitle="Resumen del día + cuadre contra efectivo."
      cards={4}
    />
  );
}
