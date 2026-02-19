import { PaddockDetail } from "@/components/admin/paddock-detail";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

export default async function PaddockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, membership } = await requireMembership("supervisor");

  const { data: paddock } = await supabase.from("paddocks").select("*").eq("id", id).single();
  if (!paddock) return <p>No encontrado</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Potrero {paddock.code}</CardTitle>
        <CardDescription>{paddock.hectares ?? "-"} ha</CardDescription>
      </Card>
      <PaddockDetail farmId={membership.farm_id} paddockId={id} />
    </div>
  );
}
