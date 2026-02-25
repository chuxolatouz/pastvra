import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/supabase/session";

export default async function LegacyGenealogyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireMembership();

  if (membership.role === "operador") {
    redirect(`/app/animales/${id}/genealogia`);
  }

  redirect(`/admin/animales/${id}/genealogia`);
}
