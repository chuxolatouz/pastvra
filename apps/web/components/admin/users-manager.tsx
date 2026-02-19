"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Membership, Profile, Role } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type MembershipRow = Membership & { email: string | null };

export function UsersManager({
  farmId,
  canManage,
  canInviteService,
}: {
  farmId: string;
  canManage: boolean;
  canInviteService: boolean;
}) {
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("operador");
  const [message, setMessage] = useState("");

  const roles = useMemo(() => ["admin", "supervisor", "operador"] as Role[], []);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: memberships, error: membershipsError } = await supabase
      .from("farm_memberships")
      .select("id,farm_id,user_id,role,active,created_at")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true });

    if (membershipsError) {
      setMessage(membershipsError.message);
      setLoading(false);
      return;
    }

    const list = (memberships ?? []) as Membership[];
    const userIds = list.map((m) => m.user_id);

    let profileMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id,email").in("user_id", userIds);
      profileMap = new Map(((profiles ?? []) as Profile[]).map((p) => [p.user_id, p.email]));
    }

    setItems(
      list.map((m) => ({
        ...m,
        email: profileMap.get(m.user_id) ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  const invite = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: inviteRole, farmId }),
    });

    const payload = (await res.json()) as { error?: string; ok?: boolean; invitationSent?: boolean };

    if (!res.ok || !payload.ok) {
      setMessage(payload.error ?? "No se pudo invitar");
      setLoading(false);
      return;
    }

    setMessage(payload.invitationSent ? "Invitación enviada y membership asignada" : "Membership asignada a usuario existente");
    setEmail("");
    await load();
    setLoading(false);
  };

  const updateRole = async (userId: string, role: Role) => {
    setLoading(true);
    const res = await fetch("/api/admin/users/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, farmId, role }),
    });

    const payload = (await res.json()) as { error?: string; ok?: boolean };
    setMessage(payload.error ?? "Rol actualizado");
    await load();
    setLoading(false);
  };

  const updateActive = async (userId: string, active: boolean) => {
    setLoading(true);
    const res = await fetch("/api/admin/users/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, farmId, active }),
    });

    const payload = (await res.json()) as { error?: string; ok?: boolean };
    setMessage(payload.error ?? (active ? "Usuario activado" : "Usuario desactivado"));
    await load();
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Invitar usuario</CardTitle>
        <CardDescription>
          Admin puede invitar por email y asignar rol de forma segura desde servidor (service role solo backend).
        </CardDescription>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="usuario@correo.com"
              disabled={!canManage || loading}
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              disabled={!canManage || loading}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={invite} disabled={!canManage || !canInviteService || !email || loading}>
          {loading ? "Procesando..." : "Invitar usuario"}
        </Button>
        {canManage && !canInviteService && (
          <CardDescription>Configura SUPABASE_SERVICE_ROLE_KEY para habilitar invitaciones por email.</CardDescription>
        )}
        {!canManage && <CardDescription>Modo lectura: solo administradores pueden invitar/editar accesos.</CardDescription>}
      </Card>

      <Card>
        <CardTitle>Miembros de la finca</CardTitle>
        <div className="mt-3 space-y-2">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{m.email ?? "Sin email en profile"}</p>
                  <p className="font-mono text-xs text-slate-600">{m.user_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={m.active ? "border-emerald-300 bg-emerald-100 text-emerald-800" : ""}>
                    {m.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Select
                    className="w-40"
                    value={m.role}
                    onChange={(e) => updateRole(m.user_id, e.target.value as Role)}
                    disabled={!canManage || loading}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant={m.active ? "destructive" : "secondary"}
                    size="sm"
                    disabled={!canManage || loading}
                    onClick={() => updateActive(m.user_id, !m.active)}
                  >
                    {m.active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <CardDescription>No hay miembros en esta finca.</CardDescription>}
        </div>
        {message && <CardDescription className="mt-3">{message}</CardDescription>}
      </Card>
    </div>
  );
}
