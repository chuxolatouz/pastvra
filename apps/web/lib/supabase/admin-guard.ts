import { createClient as createSessionClient } from "@/lib/supabase/server";

export async function assertAdminForFarm(farmId: string) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  const { data: membership } = await supabase
    .from("farm_memberships")
    .select("role,active")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .single();

  if (!membership?.active || membership.role !== "admin") {
    return { ok: false as const, status: 403, error: "Sin permiso de admin" };
  }

  return { ok: true as const, user };
}
