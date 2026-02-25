import Link from "next/link";
import { FarmForm } from "@/components/admin/farm-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembershipForFarm } from "@/lib/supabase/session";

export default async function AdminFarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, membership } = await requireMembershipForFarm(id, "supervisor");

  const [{ data: farm }, animals, paddocks, weights] = await Promise.all([
    supabase.from("farms").select("*").eq("id", id).single(),
    supabase.from("animals").select("id,name,chip_id,ear_tag,rubro,status").eq("farm_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("paddocks").select("id", { count: "exact", head: true }).eq("farm_id", id),
    supabase.from("animal_weights").select("id", { count: "exact", head: true }).eq("farm_id", id),
  ]);

  if (!farm) return <p>No se encontró la finca.</p>;

  const list = (animals.data ?? []) as Array<{
    id: string;
    name: string | null;
    chip_id: string | null;
    ear_tag: string | null;
    rubro: "bovino" | "bufalino";
    status: string;
  }>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardTitle>{farm.name}</CardTitle>
          <CardDescription>Hectáreas: {farm.hectares ?? "-"}</CardDescription>
        </Card>
        <Card>
          <CardTitle>Potreros</CardTitle>
          <CardDescription className="text-2xl font-black text-sky-700">{paddocks.count ?? 0}</CardDescription>
        </Card>
        <Card>
          <CardTitle>Pesajes</CardTitle>
          <CardDescription className="text-2xl font-black text-sky-700">{weights.count ?? 0}</CardDescription>
        </Card>
      </div>

      <FarmForm farm={farm} canEdit={membership.role === "admin"} />

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Animales de la finca</CardTitle>
          <Link href="/admin/animales" className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold">
            Ver grilla global
          </Link>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {list.map((animal) => (
            <Link
              key={animal.id}
              href={`/admin/animales/${animal.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="font-semibold text-slate-900">{animal.name || "Sin nombre"}</p>
              <p className="text-xs text-slate-600">
                Rubro: {animal.rubro === "bovino" ? "Bovino" : "Bufalino"} | Estado: {animal.status}
              </p>
              <p className="text-xs text-slate-600">Chip: {animal.chip_id || "-"} | Arete: {animal.ear_tag || "-"}</p>
            </Link>
          ))}
          {!list.length && <CardDescription>No hay animales registrados para esta finca.</CardDescription>}
        </div>
      </Card>
    </div>
  );
}
