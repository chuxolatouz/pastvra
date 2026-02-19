import { TreeGraph } from "@/components/genealogy/tree-graph";
import { requireMembership } from "@/lib/supabase/session";

export default async function GenealogyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireMembership();

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <h2 className="text-2xl font-black">Genealogía</h2>
      <TreeGraph farmId={membership.farm_id} rootAnimalId={id} />
    </main>
  );
}
