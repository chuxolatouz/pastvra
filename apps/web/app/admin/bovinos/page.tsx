import { AnimalsManager } from "@/components/admin/animals-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function BovinosPage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Bovinos</h2>
      <AnimalsManager farmId={membership.farm_id} />
    </div>
  );
}
