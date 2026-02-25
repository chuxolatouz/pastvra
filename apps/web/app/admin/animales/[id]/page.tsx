import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WeightChart } from "@/components/charts/weight-chart";
import { EventManager } from "@/components/admin/event-manager";
import { requireMembership, requireMembershipForFarm } from "@/lib/supabase/session";
import { buildTags, project30Days } from "@/lib/utils/weights";

export default async function AdminAnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase: bootstrap, user } = await requireMembership("supervisor");

  const { data: animal } = await bootstrap.from("animals").select("*").eq("id", id).single();

  if (!animal) return <p>No existe este animal.</p>;
  const { supabase } = await requireMembershipForFarm(animal.farm_id, "supervisor");

  const [{ data: weights }, { data: farm }] = await Promise.all([
    supabase.from("animal_weights").select("*").eq("animal_id", id).order("weighed_at"),
    supabase.from("farms").select("*").eq("id", animal.farm_id).single(),
  ]);

  const sorted = (weights ?? []) as Array<{ weighed_at: string; weight_kg: number }>;
  const projection = project30Days(sorted);
  const last = sorted.at(-1) ?? null;
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const tags =
    last && farm
      ? buildTags({
          previous: prev,
          current: last,
          lowGainThreshold: farm.low_gain_threshold_adg,
          overdueDays: farm.overdue_days,
        })
      : [];

  const chart = sorted.map((s, idx) => ({
    ...s,
    projected: idx === sorted.length - 1 && projection ? projection.projectedWeight : null,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card>
        <CardTitle>{animal.name || "Sin nombre"}</CardTitle>
        <CardDescription>
          Rubro: {animal.rubro === "bovino" ? "Bovino" : "Bufalino"} | Chip: {animal.chip_id || "-"} | Arete: {animal.ear_tag || "-"} | Estado: {animal.status}
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.length ? tags.map((t) => <Badge key={t}>{t}</Badge>) : <Badge>Sin alertas</Badge>}
        </div>
      </Card>

      <Card>
        <CardTitle>Pesos y tendencia</CardTitle>
        {chart.length ? <WeightChart points={chart} /> : <CardDescription>Sin pesajes</CardDescription>}
      </Card>

      <Card>
        <CardTitle>Tabla de pesajes</CardTitle>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Fecha</th>
                <th className="py-2">Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
              {sorted
                .slice()
                .reverse()
                .map((w) => (
                  <tr key={`${w.weighed_at}-${w.weight_kg}`} className="border-b">
                    <td className="py-2">{w.weighed_at}</td>
                    <td className="py-2">{w.weight_kg}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EventManager farmId={animal.farm_id} animalId={id} userId={user.id} />

      <Link
        href={`/admin/animales/${id}/genealogia`}
        className="inline-block rounded-xl bg-slate-200 px-4 py-3 font-semibold"
      >
        Ver genealogía
      </Link>
    </main>
  );
}
