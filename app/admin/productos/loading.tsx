import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Productos"
      subtitle="Edita precios, costos y disponibilidad."
      cards={3}
    />
  );
}
