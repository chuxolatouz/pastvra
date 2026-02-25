import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { defaultRouteForRole } from "@/lib/supabase/session";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("farm_memberships")
    .select("role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  const roles = (memberships ?? []).map((m) => m.role as "admin" | "supervisor" | "operador");
  const bestRole = roles.sort((a, b) => rank(b) - rank(a))[0];

  if (!bestRole) {
    redirect("/unauthorized");
  }

  redirect(defaultRouteForRole(bestRole));
}

function rank(role: "admin" | "supervisor" | "operador") {
  if (role === "admin") return 3;
  if (role === "supervisor") return 2;
  return 1;
}
