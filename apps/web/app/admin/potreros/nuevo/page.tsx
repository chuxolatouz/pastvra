import Link from "next/link";
import { PaddocksManager } from "@/components/admin/paddocks-manager";
import { CardDescription } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";

export default async function AdminPaddockCreatePage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black">Nuevo potrero</h2>
          <CardDescription>La creación se aplicará a la finca activa: {membership.farm_id}</CardDescription>
        </div>
        <Link href="/admin/potreros" className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold">
          Volver a potreros
        </Link>
      </div>

      <PaddocksManager farmId={membership.farm_id} showList={false} />
    </div>
  );
}
