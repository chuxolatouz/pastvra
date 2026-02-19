"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Animal, Paddock } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const base = {
  chip_id: "",
  ear_tag: "",
  name: "",
  sex: "H",
  breed: "",
  birth_date: new Date().toISOString().slice(0, 10),
  cost: "",
  status: "vivo",
  notes: "",
  sire_id: "",
  dam_id: "",
  sire_external: "",
  dam_external: "",
  current_paddock_id: "",
};

export function AnimalsManager({ farmId }: { farmId: string }) {
  const [items, setItems] = useState<Animal[]>([]);
  const [paddocks, setPaddocks] = useState<Paddock[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(base);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const supabase = createClient();
    const [{ data: animals }, { data: padds }] = await Promise.all([
      supabase.from("animals").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }),
      supabase.from("paddocks").select("*").eq("farm_id", farmId).order("code"),
    ]);
    setItems((animals ?? []) as Animal[]);
    setPaddocks((padds ?? []) as Paddock[]);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [farmId]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return items;
    return items.filter((a) =>
      [a.chip_id, a.ear_tag, a.name].some((x) => (x ?? "").toLowerCase().includes(t)),
    );
  }, [items, search]);

  const fillEdit = (animal: Animal) => {
    setEditingId(animal.id);
    setForm({
      chip_id: animal.chip_id ?? "",
      ear_tag: animal.ear_tag ?? "",
      name: animal.name ?? "",
      sex: animal.sex,
      breed: animal.breed ?? "",
      birth_date: animal.birth_date,
      cost: animal.cost?.toString() ?? "",
      status: animal.status,
      notes: animal.notes ?? "",
      sire_id: animal.sire_id ?? "",
      dam_id: animal.dam_id ?? "",
      sire_external: animal.sire_external ?? "",
      dam_external: animal.dam_external ?? "",
      current_paddock_id: animal.current_paddock_id ?? "",
    });
  };

  const save = async () => {
    const supabase = createClient();
    const payload = {
      farm_id: farmId,
      chip_id: form.chip_id || null,
      ear_tag: form.ear_tag || null,
      name: form.name || null,
      sex: form.sex as "M" | "H",
      breed: form.breed || null,
      birth_date: form.birth_date,
      cost: form.cost ? Number(form.cost) : null,
      status: form.status as "vivo" | "vendido" | "muerto" | "extraviado",
      notes: form.notes || null,
      sire_id: form.sire_id || null,
      dam_id: form.dam_id || null,
      sire_external: form.sire_external || null,
      dam_external: form.dam_external || null,
      current_paddock_id: form.current_paddock_id || null,
    };

    const query = editingId
      ? supabase.from("animals").update(payload).eq("id", editingId)
      : supabase.from("animals").insert(payload);

    const { error } = await query;
    setMessage(error ? error.message : editingId ? "Animal actualizado" : "Animal creado");

    if (!error) {
      setEditingId(null);
      setForm(base);
      await load();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>{editingId ? "Editar bovino" : "Nuevo bovino"}</CardTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Chip ID (15)</Label>
            <Input value={form.chip_id} onChange={(e) => setForm((s) => ({ ...s, chip_id: e.target.value }))} />
          </div>
          <div>
            <Label>Arete</Label>
            <Input value={form.ear_tag} onChange={(e) => setForm((s) => ({ ...s, ear_tag: e.target.value }))} />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={form.sex} onChange={(e) => setForm((s) => ({ ...s, sex: e.target.value }))}>
              <option value="H">Hembra</option>
              <option value="M">Macho</option>
            </Select>
          </div>
          <div>
            <Label>Raza</Label>
            <Input value={form.breed} onChange={(e) => setForm((s) => ({ ...s, breed: e.target.value }))} />
          </div>
          <div>
            <Label>Nacimiento</Label>
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((s) => ({ ...s, birth_date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Costo</Label>
            <Input value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))} type="number" />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
              <option value="vivo">Vivo</option>
              <option value="vendido">Vendido</option>
              <option value="muerto">Muerto</option>
              <option value="extraviado">Extraviado</option>
            </Select>
          </div>
          <div>
            <Label>Potrero actual</Label>
            <Select
              value={form.current_paddock_id}
              onChange={(e) => setForm((s) => ({ ...s, current_paddock_id: e.target.value }))}
            >
              <option value="">Sin asignar</option>
              {paddocks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Padre (interno)</Label>
            <Select value={form.sire_id} onChange={(e) => setForm((s) => ({ ...s, sire_id: e.target.value }))}>
              <option value="">Desconocido</option>
              {items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.ear_tag || a.chip_id || a.id.slice(0, 6)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Madre (interna)</Label>
            <Select value={form.dam_id} onChange={(e) => setForm((s) => ({ ...s, dam_id: e.target.value }))}>
              <option value="">Desconocida</option>
              {items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.ear_tag || a.chip_id || a.id.slice(0, 6)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Padre externo</Label>
            <Input
              value={form.sire_external}
              onChange={(e) => setForm((s) => ({ ...s, sire_external: e.target.value }))}
            />
          </div>
          <div>
            <Label>Madre externa</Label>
            <Input
              value={form.dam_external}
              onChange={(e) => setForm((s) => ({ ...s, dam_external: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>{editingId ? "Actualizar" : "Crear"}</Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(base);
              }}
            >
              Cancelar edición
            </Button>
          )}
        </div>
        {message && <CardDescription>{message}</CardDescription>}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Listado de bovinos</CardTitle>
        <Input
          placeholder="Buscar por chipId, arete o nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-bold text-slate-900">{a.name || "Sin nombre"}</p>
                <p className="text-sm text-slate-600">Chip: {a.chip_id || "-"} | Arete: {a.ear_tag || "-"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fillEdit(a)}>
                  Editar
                </Button>
                <Link href={`/animal/${a.id}`} className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold">
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
