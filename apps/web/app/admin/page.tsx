import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

export default async function AdminDashboardPage() {
  const { supabase, membership } = await requireMembership("supervisor");

  const [animals, paddocks, weights] = await Promise.all([
    supabase.from("animals").select("id", { count: "exact", head: true }).eq("farm_id", membership.farm_id),
    supabase.from("paddocks").select("id", { count: "exact", head: true }).eq("farm_id", membership.farm_id),
    supabase.from("animal_weights").select("id", { count: "exact", head: true }).eq("farm_id", membership.farm_id),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat title="Bovinos" value={animals.count ?? 0} />
        <Stat title="Potreros" value={paddocks.count ?? 0} />
        <Stat title="Pesajes" value={weights.count ?? 0} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/inventario" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <CardTitle>Control de inventario</CardTitle>
          <CardDescription>Ledger con saldos acumulados, costos y filtros.</CardDescription>
        </Link>
        <Link href="/admin/pesaje-mensual" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <CardTitle>Control de pesaje mensual</CardTitle>
          <CardDescription>Matriz ENE..DIC con aumento, GMD y pendientes.</CardDescription>
        </Link>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="text-3xl font-black text-sky-700">{value}</CardDescription>
    </Card>
  );
}
