import { UsersManager } from "@/components/admin/users-manager";
import { requireMembership } from "@/lib/supabase/session";

export default async function UsersPage() {
  const { membership } = await requireMembership("supervisor");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Usuarios y roles</h2>
      <UsersManager
        farmId={membership.farm_id}
        canManage={membership.role === "admin"}
        canInviteService={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
      />
    </div>
  );
}
