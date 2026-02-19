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
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = memberships?.[0] as { role: "admin" | "supervisor" | "operador" } | undefined;

  if (!membership) {
    redirect("/unauthorized");
  }

  redirect(defaultRouteForRole(membership.role));
}
