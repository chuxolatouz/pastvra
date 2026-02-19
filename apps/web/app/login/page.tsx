import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: memberships } = await supabase
      .from("farm_memberships")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (memberships?.length) {
      redirect("/app");
    }

    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
