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
      .order("created_at", { ascending: true })
      .limit(1);

    const membership = memberships?.[0] as { role: "admin" | "supervisor" | "operador" } | undefined;

    if (membership) {
      redirect(defaultRouteForRole(membership.role));
    }

    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
