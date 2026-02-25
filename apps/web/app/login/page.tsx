import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";
import { defaultRouteForRole } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: memberships } = await supabase
      .from("farm_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true });

    const roles = (memberships ?? []).map((m) => m.role as "admin" | "supervisor" | "operador");
    const bestRole = roles.sort((a, b) => rank(b) - rank(a))[0];

    if (bestRole) {
      redirect(defaultRouteForRole(bestRole));
    }

    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}

function rank(role: "admin" | "supervisor" | "operador") {
  if (role === "admin") return 3;
  if (role === "supervisor") return 2;
  return 1;
}
