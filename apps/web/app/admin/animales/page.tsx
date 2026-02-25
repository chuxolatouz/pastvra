import Link from "next/link";
import { AnimalsManager } from "@/components/admin/animals-manager";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

export default async function AdminAnimalsPage() {
  const { supabase, membership, user } = await requireMembership("supervisor");

  const { data: memberships } = await supabase
    .from("farm_memberships")
    .select("farm_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .in("role", ["admin", "supervisor"]);

  const farmIds = [...new Set((memberships ?? []).map((row) => row.farm_id))];

  const [animalsResult, farmsResult] = await Promise.all([
    farmIds.length
      ? supabase
          .from("animals")
          .select("id,farm_id,name,chip_id,ear_tag,rubro,status")
          .in("farm_id", farmIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    farmIds.length
      ? supabase.from("farms").select("id,name").in("id", farmIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const farmNameById = new Map((farmsResult.data ?? []).map((farm) => [farm.id, farm.name]));

  const animals = (animalsResult.data ?? []) as Array<{
    id: string;
    farm_id: string;
    name: string | null;
    chip_id: string | null;
    ear_tag: string | null;
    rubro: "bovino" | "bufalino";
    status: string;
  }>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black">Animales</h2>
          <p className="text-sm text-slate-600">Grilla general para gestión administrativa y acceso al detalle por animal.</p>
        </div>
        <Link href="/admin/animales/nuevo" className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
          Nuevo animal
        </Link>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {animals.map((animal) => (
          <Link
            key={animal.id}
            href={`/admin/animales/${animal.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <p className="font-semibold text-slate-900">{animal.name || "Sin nombre"}</p>
            <p className="text-xs text-slate-600">
              Finca: {farmNameById.get(animal.farm_id) ?? animal.farm_id} | Rubro: {animal.rubro === "bovino" ? "Bovino" : "Bufalino"}
            </p>
            <p className="text-xs text-slate-600">Chip: {animal.chip_id || "-"} | Arete: {animal.ear_tag || "-"} | Estado: {animal.status}</p>
          </Link>
        ))}
      </div>

      {!animals.length && (
        <Card>
          <CardTitle>Sin animales para mostrar</CardTitle>
          <CardDescription>No hay registros para las fincas con acceso administrativo.</CardDescription>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Edición rápida (finca actual)</CardTitle>
        <CardDescription>
          La creación está estandarizada en la vista de alta. Aquí puedes editar animales de la finca activa (
          {membership.farm_id}).
        </CardDescription>
        <AnimalsManager farmId={membership.farm_id} detailBasePath="/admin/animales" allowCreate={false} />
      </Card>
    </div>
  );
}
