import { PaddocksManager } from "@/components/admin/paddocks-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function PaddocksPage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Potreros</h2>
      <PaddocksManager farmId={membership.farm_id} />
    </div>
  );
}
