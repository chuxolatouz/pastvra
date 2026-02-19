import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const { membership, user } = await requireMembership();
  const supabase = await createClient();

  const { count } = await supabase
    .from("animal_weights")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Inicio rápido</h2>
      <p className="text-slate-600">Botones grandes para trabajo en campo.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <BigButton href="/app/pesar" title="1) Pesar animal" subtitle="Flujo wizard guiado" />
        <BigButton href="/app/buscar" title="2) Buscar animal" subtitle="Chip, arete o nombre" />
        <BigButton href="/app/help" title="3) Ayuda" subtitle="Tips de uso y accesibilidad" />
        {membership.role !== "operador" && (
          <BigButton href="/admin" title="4) Panel admin" subtitle="Configuración y catálogos" />
        )}
      </div>
      <Card>
        <CardTitle>Tu actividad</CardTitle>
        <CardDescription>Pesajes registrados por tu usuario: {count ?? 0}</CardDescription>
      </Card>
    </div>
  );
}

function BigButton({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-1 text-base">{subtitle}</CardDescription>
    </Link>
  );
}
