import Link from "next/link";
import { FarmCreateForm } from "@/components/admin/farm-create-form";
import { requireMembership } from "@/lib/supabase/session";

export default async function AdminFarmCreatePage() {
  await requireMembership("admin");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-black">Nueva finca</h2>
        <Link href="/admin/fincas" className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold">
          Volver a fincas
        </Link>
      </div>
      <FarmCreateForm />
    </div>
  );
}
