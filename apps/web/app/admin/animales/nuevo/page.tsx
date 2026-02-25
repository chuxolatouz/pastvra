import Link from "next/link";
import { AnimalsManager } from "@/components/admin/animals-manager";
import { CardDescription } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

export default async function AdminAnimalCreatePage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black">Nuevo animal</h2>
          <CardDescription>La creación se aplicará a la finca activa: {membership.farm_id}</CardDescription>
        </div>
        <Link href="/admin/animales" className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold">
          Volver a animales
        </Link>
      </div>

      <AnimalsManager farmId={membership.farm_id} detailBasePath="/admin/animales" showList={false} allowCreate />
    </div>
  );
}
