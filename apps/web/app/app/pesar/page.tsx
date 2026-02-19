import { SyncButton } from "@/components/pwa/sync-button";
import { WeightWizard } from "@/components/wizard/weight-wizard";
import { requireMembership } from "@/lib/supabase/session";

export default async function PesarPage() {
  const { supabase, membership, user } = await requireMembership();
  const { data: farm } = await supabase.from("farms").select("*").eq("id", membership.farm_id).single();

  if (!farm) return <p>No hay finca asociada.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Pesar animal</h2>
      <SyncButton userId={user.id} />
      <WeightWizard farm={farm} userId={user.id} />
    </div>
  );
}
