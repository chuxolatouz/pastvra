import { TreeGraph } from "@/components/genealogy/tree-graph";
import { requireMembership, requireMembershipForFarm } from "@/lib/supabase/session";

export default async function AppGenealogyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireMembership();
  const { data: animal } = await supabase.from("animals").select("farm_id").eq("id", id).single();

  if (!animal) return <p>No existe este animal.</p>;
  await requireMembershipForFarm(animal.farm_id);

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <h2 className="text-2xl font-black">Genealogía</h2>
      <TreeGraph farmId={animal.farm_id} rootAnimalId={id} />
    </main>
  );
}
