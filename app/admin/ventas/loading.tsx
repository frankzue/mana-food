import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Finanzas"
      subtitle="Reportes de ventas, margen y cierres diarios."
      cards={4}
    />
  );
}
