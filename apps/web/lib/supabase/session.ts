import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { Membership, Role } from "@/lib/db/types";

export function defaultRouteForRole(role: Role) {
  return role === "operador" ? "/app" : "/admin";
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireMembership(minRole?: Role) {
  const { supabase, user } = await requireUser();

  const { data: memberships } = await supabase
    .from("farm_memberships")
    .select("id,farm_id,user_id,role,active,created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = memberships?.[0] as Membership | undefined;
  if (!membership) redirect("/unauthorized");

  if (minRole) {
    const rank = { operador: 1, supervisor: 2, admin: 3 } as const;
    if (rank[membership.role] < rank[minRole]) {
      redirect("/app");
    }
  }

  return { supabase, user, membership };
}

export async function resolveActiveMembership() {
  const { supabase, user } = await requireUser();

  const { data: memberships } = await supabase
    .from("farm_memberships")
    .select("id,farm_id,user_id,role,active,created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = memberships?.[0] as Membership | undefined;
  return { supabase, user, membership: membership ?? null };
}
