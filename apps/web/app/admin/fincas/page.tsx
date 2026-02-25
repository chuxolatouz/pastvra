import Link from "next/link";
import type { Farm, Role } from "@/lib/db/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

type MembershipFarmRow = {
  farm_id: string;
  role: Role;
  farms: Farm | Farm[] | null;
};

export default async function AdminFarmsGridPage() {
  const { supabase, user } = await requireMembership("supervisor");

  const { data } = await supabase
    .from("farm_memberships")
    .select("farm_id,role,farms(id,name,hectares,low_gain_threshold_adg,overdue_days)")
    .eq("user_id", user.id)
    .eq("active", true)
    .in("role", ["admin", "supervisor"])
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as MembershipFarmRow[];

  const farms = await Promise.all(
    rows
      .map((row) => {
        const farm = Array.isArray(row.farms) ? row.farms[0] : row.farms;
        if (!farm) return null;
        return { farm, role: row.role };
      })
      .filter(Boolean)
      .map(async (item) => {
        const scoped = item as { farm: Farm; role: Role };

        const [animals, paddocks] = await Promise.all([
          supabase.from("animals").select("id", { count: "exact", head: true }).eq("farm_id", scoped.farm.id),
          supabase.from("paddocks").select("id", { count: "exact", head: true }).eq("farm_id", scoped.farm.id),
        ]);

        return {
          ...scoped,
          animals: animals.count ?? 0,
          paddocks: paddocks.count ?? 0,
        };
      }),
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Fincas</h2>
      <p className="text-sm text-slate-600">Vista administrativa por finca con acceso rápido a su información y animales.</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {farms.map((item) => (
          <Link key={item.farm.id} href={`/admin/fincas/${item.farm.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
            <CardTitle>{item.farm.name}</CardTitle>
            <CardDescription>
              Rol: {item.role} | Hectáreas: {item.farm.hectares ?? "-"}
            </CardDescription>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-slate-100 p-2">Animales: {item.animals}</div>
              <div className="rounded-lg bg-slate-100 p-2">Potreros: {item.paddocks}</div>
            </div>
          </Link>
        ))}
      </div>

      {!farms.length && (
        <Card>
          <CardTitle>Sin fincas disponibles</CardTitle>
          <CardDescription>No tienes membresías activas con rol supervisor/admin.</CardDescription>
        </Card>
      )}
    </div>
  );
}
