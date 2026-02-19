import Link from "next/link";
import { Home, Shield, Weight } from "lucide-react";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { LogoutButton } from "@/components/auth/logout-button";
import type { Role } from "@/lib/db/types";

export function TopShell({
  role,
  title,
  userEmail,
}: {
  role: Role;
  title: string;
  userEmail?: string;
}) {
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
      <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
        <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app">
          <Home className="mr-1 inline h-4 w-4" /> App
        </Link>
        {(role === "admin" || role === "supervisor") && (
          <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/admin">
            <Shield className="mr-1 inline h-4 w-4" /> Admin
          </Link>
        )}
        <Link className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" href="/app/pesar">
          <Weight className="mr-1 inline h-4 w-4" /> Pesar
        </Link>
      </nav>
    </header>
  );
}
