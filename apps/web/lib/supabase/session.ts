import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { Membership, Role } from "@/lib/db/types";

const ROLE_RANK: Record<Role, number> = {
  operador: 1,
  supervisor: 2,
  admin: 3,
};

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
    .order("created_at", { ascending: true });

  const list = (memberships ?? []) as Membership[];
  if (!list.length) redirect("/unauthorized");

  let membership = list[0];

  if (minRole) {
    const candidate = list.find((item) => ROLE_RANK[item.role] >= ROLE_RANK[minRole]);
    if (!candidate) {
      redirect("/app");
    }
    membership = candidate;
  }

  return { supabase, user, membership };
}

export async function requireMembershipForFarm(farmId: string, minRole?: Role) {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("farm_memberships")
    .select("id,farm_id,user_id,role,active,created_at")
    .eq("user_id", user.id)
    .eq("farm_id", farmId)
    .eq("active", true)
    .single();

  const scopedMembership = membership as Membership | null;

  if (!scopedMembership) {
    redirect("/unauthorized");
  }

  if (minRole && ROLE_RANK[scopedMembership.role] < ROLE_RANK[minRole]) {
    redirect("/app");
  }

  return { supabase, user, membership: scopedMembership };
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
