import { InventoryManager } from "@/components/admin/inventory-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function InventarioPage() {
  const { membership, user } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Control de inventario</h2>
      <InventoryManager farmId={membership.farm_id} userId={user.id} canWrite={membership.role !== "operador"} />
    </div>
  );
}
