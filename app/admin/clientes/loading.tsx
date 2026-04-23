import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Clientes"
      subtitle="Agrupados por número de teléfono."
      cards={4}
    />
  );
}
