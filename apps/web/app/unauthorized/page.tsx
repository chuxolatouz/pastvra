import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("farm_memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships?.length) redirect("/app");

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-10 w-10 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl">Acceso denegado</CardTitle>
        <CardDescription className="text-base text-slate-600">
          Tu cuenta no tiene una membresía activa en ninguna granja. Contacta a tu administrador para
          obtener acceso.
        </CardDescription>
        <div className="pt-4">
          <div className="grid gap-2">
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-600 px-5 text-base font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Volver al login
            </Link>
            <LogoutButton />
          </div>
        </div>
      </Card>
    </main>
  );
}
