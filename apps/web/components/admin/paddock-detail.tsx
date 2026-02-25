"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnack } from "@/components/ui/snack";
import { Textarea } from "@/components/ui/textarea";
import type { SoilTest } from "@/lib/db/types";

export function PaddockDetail({ farmId, paddockId }: { farmId: string; paddockId: string }) {
  const snack = useSnack();
  const [items, setItems] = useState<SoilTest[]>([]);
  const [testedAt, setTestedAt] = useState(new Date().toISOString().slice(0, 10));
  const [ph, setPh] = useState("");
  const [grass, setGrass] = useState("");
  const [sugar, setSugar] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("paddock_soil_tests")
      .select("*")
      .eq("paddock_id", paddockId)
      .order("tested_at", { ascending: false });
    if (error) {
      snack.error("No se pudo cargar análisis de suelo", error.message);
      return;
    }
    setItems((data ?? []) as SoilTest[]);
  }, [paddockId, snack]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const save = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("paddock_soil_tests").insert({
      farm_id: farmId,
      paddock_id: paddockId,
      tested_at: testedAt,
      ph: ph ? Number(ph) : null,
      grass_percent: grass ? Number(grass) : null,
      sugar_percent: sugar ? Number(sugar) : null,
      notes: notes || null,
    });

    if (error) {
      snack.error("Error al crear análisis de suelo", error.message);
      return;
    }

    snack.success("Análisis de suelo creado", "Se registró correctamente para este potrero.");
    setPh("");
    setGrass("");
    setSugar("");
    setNotes("");
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Nuevo análisis de suelo</CardTitle>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} />
        </div>
        <div>
          <Label>pH</Label>
          <Input value={ph} onChange={(e) => setPh(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <Label>% Pasto</Label>
          <Input value={grass} onChange={(e) => setGrass(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <Label>% Azúcar</Label>
          <Input value={sugar} onChange={(e) => setSugar(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={save}>Guardar</Button>
        <CardDescription>Cada registro queda asociado al historial del potrero.</CardDescription>
      </Card>

      <Card>
        <CardTitle>Histórico</CardTitle>
        <div className="mt-3 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              {it.tested_at} | pH {it.ph ?? "-"} | Pasto {it.grass_percent ?? "-"}% | Azúcar {it.sugar_percent ?? "-"}%
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
