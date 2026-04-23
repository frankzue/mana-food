import { AdminLoadingSkeleton } from "@/components/admin/AdminLoadingSkeleton";

export default function Loading() {
  return (
    <AdminLoadingSkeleton
      title="Pedidos"
      subtitle="Los nuevos pedidos aparecen automáticamente."
      cards={4}
    />
  );
}
