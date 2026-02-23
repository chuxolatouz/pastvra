import Link from "next/link";
import { CircleHelp, Search, Shield, Scale, Info } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireMembership } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import type { LucideIcon } from "lucide-react";

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
        <BigButton
          href="/app/pesar"
          title="1) Pesar animal"
          subtitle="Flujo wizard guiado"
          tooltip="Abre el asistente paso a paso para escanear y guardar un nuevo pesaje."
          icon={Scale}
        />
        <BigButton
          href="/app/buscar"
          title="2) Buscar animal"
          subtitle="Chip, arete o nombre"
          tooltip="Busca rápidamente bovinos por chip, arete o nombre."
          icon={Search}
        />
        <BigButton
          href="/app/help"
          title="3) Ayuda"
          subtitle="Tips de uso y accesibilidad"
          tooltip="Muestra recomendaciones de uso en campo y modo offline."
          icon={CircleHelp}
        />
        {membership.role !== "operador" && (
          <BigButton
            href="/admin"
            title="4) Panel admin"
            subtitle="Configuración y catálogos"
            tooltip="Accede a inventario, pesaje mensual, usuarios y configuración."
            icon={Shield}
          />
        )}
      </div>
      <Card>
        <CardTitle>Tu actividad</CardTitle>
        <CardDescription>Pesajes registrados por tu usuario: {count ?? 0}</CardDescription>
      </Card>
    </div>
  );
}

function BigButton({
  href,
  title,
  subtitle,
  tooltip,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  tooltip: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      title={tooltip}
      aria-label={`${title}. ${tooltip}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-sky-700" />
          {title}
        </CardTitle>
        <span title={tooltip} aria-hidden="true">
          <Info className="h-4 w-4 text-slate-500" />
        </span>
      </div>
      <CardDescription className="mt-1 text-base">{subtitle}</CardDescription>
    </Link>
  );
}
