"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Membership, Role } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function UsersManager({ farmId, canInvite }: { farmId: string; canInvite: boolean }) {
  const [items, setItems] = useState<Membership[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("operador");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("operador");
  const [message, setMessage] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("farm_memberships").select("*").eq("farm_id", farmId).order("created_at");
    setItems((data ?? []) as Membership[]);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [farmId]);

  const addById = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("farm_memberships").insert({ farm_id: farmId, user_id: userId, role });
    setMessage(error ? error.message : "Usuario agregado");
    if (!error) {
      setUserId("");
      await load();
    }
  };

  const updateRole = async (id: string, newRole: Role) => {
    const supabase = createClient();
    const { error } = await supabase.from("farm_memberships").update({ role: newRole }).eq("id", id);
    setMessage(error ? error.message : "Rol actualizado");
    await load();
  };

  const inviteByEmail = async () => {
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, farmId, role: inviteRole }),
    });

    const payload = (await res.json()) as { error?: string; ok?: boolean };
    setMessage(payload.error ?? "Invitación enviada");
    if (payload.ok) {
      setEmail("");
      await load();
    }
  };

  const roles = useMemo(() => ["admin", "supervisor", "operador"] as Role[], []);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Agregar por user_id</CardTitle>
        <div>
          <Label>User ID (UUID de auth.users)</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid..." />
        </div>
        <div>
          <Label>Rol</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={addById}>Asignar membership</Button>
      </Card>

      {canInvite && (
        <Card className="space-y-3">
          <CardTitle>Invitar por email (service role)</CardTitle>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={inviteByEmail}>Invitar</Button>
        </Card>
      )}

      <Card>
        <CardTitle>Miembros actuales</CardTitle>
        <div className="mt-3 space-y-2">
          {items.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-mono text-sm">{m.user_id}</p>
                <p className="text-sm text-slate-600">Farm: {m.farm_id}</p>
              </div>
              <Select value={m.role} onChange={(e) => updateRole(m.id, e.target.value as Role)} className="w-40">
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
        {message && <CardDescription className="mt-2">{message}</CardDescription>}
      </Card>
    </div>
  );
}
