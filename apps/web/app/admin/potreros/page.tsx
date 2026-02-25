import Link from "next/link";
import { PaddocksManager } from "@/components/admin/paddocks-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function PaddocksPage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-black">Potreros</h2>
        <Link href="/admin/potreros/nuevo" className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
          Nuevo potrero
        </Link>
      </div>
      <PaddocksManager farmId={membership.farm_id} showCreateForm={false} />
    </div>
  );
}
