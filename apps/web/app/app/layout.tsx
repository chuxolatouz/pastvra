import { TopShell } from "@/components/ui/shell";
import { requireMembership } from "@/lib/supabase/session";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const { membership, user } = await requireMembership();

  return (
    <div>
      <TopShell role={membership.role} title="Operacion" userEmail={user.email} context="app" />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
