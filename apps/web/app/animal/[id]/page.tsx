import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/supabase/session";

export default async function LegacyAnimalDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireMembership();

  if (membership.role === "operador") {
    redirect(`/app/animales/${id}`);
  }

  redirect(`/admin/animales/${id}`);
}
