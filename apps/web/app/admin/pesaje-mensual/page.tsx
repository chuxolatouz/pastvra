import { MonthlyWeightReport } from "@/components/admin/monthly-weight-report";
import type { Animal } from "@/lib/db/types";
import { requireMembership } from "@/lib/supabase/session";

export default async function PesajeMensualPage() {
  const { supabase, membership, user } = await requireMembership("supervisor");
  const { data: animals } = await supabase
    .from("animals")
    .select("*")
    .eq("farm_id", membership.farm_id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Control de pesaje mensual</h2>
      <MonthlyWeightReport farmId={membership.farm_id} userId={user.id} animals={(animals ?? []) as Animal[]} />
    </div>
  );
}
