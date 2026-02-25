import Link from "next/link";
import { requireMembership } from "@/lib/supabase/session";
import { TopShell } from "@/components/ui/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { membership, user } = await requireMembership("supervisor");

  return (
    <div>
      <TopShell role={membership.role} title="Panel de administracion" userEmail={user.email} context="admin" />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <nav className="space-y-2 text-base font-semibold">
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin">
              Resumen
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/fincas">
              Fincas
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/finca">
              Configuración finca
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/potreros">
              Potreros
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/animales">
              Animales
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/inventario">
              Inventario
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/pesaje-mensual">
              Pesaje mensual
            </Link>
            <Link className="block rounded-xl bg-slate-100 px-3 py-2" href="/admin/usuarios">
              Usuarios
            </Link>
          </nav>
        </aside>
        <section>{children}</section>
      </main>
    </div>
  );
}
