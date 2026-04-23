import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Configuración"
      subtitle="Tasa BCV, IVA y datos de pago."
      cards={2}
    />
  );
}
