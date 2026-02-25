import Link from "next/link";
import { CircleHelp, Home, Search, Shield, Weight } from "lucide-react";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { LogoutButton } from "@/components/auth/logout-button";
import type { Role } from "@/lib/db/types";

export function TopShell({
  role,
  title,
  userEmail,
  context = "app",
}: {
  role: Role;
  title: string;
  userEmail?: string;
  context?: "app" | "admin";
}) {
  const canManage = role === "admin" || role === "supervisor";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">{title}</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rol: {role} {userEmail ? `| ${userEmail}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OfflineIndicator />
          <LogoutButton />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-3">
        {context === "app" ? (
          <>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app">
              <Home className="mr-1 inline h-4 w-4" /> Inicio
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app/pesar">
              <Weight className="mr-1 inline h-4 w-4" /> Pesar
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app/buscar">
              <Search className="mr-1 inline h-4 w-4" /> Buscar
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app/help">
              <CircleHelp className="mr-1 inline h-4 w-4" /> Ayuda
            </Link>
            {canManage && (
              <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin">
                <Shield className="mr-1 inline h-4 w-4" /> Administracion
              </Link>
            )}
          </>
        ) : (
          <>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin">
              Resumen
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin/fincas">
              Fincas
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin/animales">
              Animales
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin/potreros">
              Potreros
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin/inventario">
              Inventario
            </Link>
            <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app">
              Operacion
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
