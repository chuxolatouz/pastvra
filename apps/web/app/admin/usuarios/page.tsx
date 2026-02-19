import { redirect } from "next/navigation";
import { UsersManager } from "@/components/admin/users-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function UsersPage() {
  const { membership } = await requireMembership("admin");
  if (membership.role !== "admin") redirect("/admin");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Usuarios y roles</h2>
      <UsersManager farmId={membership.farm_id} canInvite={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />
    </div>
  );
}
