import { FarmForm } from "@/components/admin/farm-form";
import { requireMembership } from "@/lib/supabase/session";

export default async function FarmPage() {
  const { supabase, membership } = await requireMembership("supervisor");
  const { data } = await supabase.from("farms").select("*").eq("id", membership.farm_id).single();

  if (!data) return <p>Sin finca</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Finca</h2>
      <FarmForm farm={data} />
    </div>
  );
}
