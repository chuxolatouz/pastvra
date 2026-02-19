"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SoilTest } from "@/lib/db/types";

export function PaddockDetail({ farmId, paddockId }: { farmId: string; paddockId: string }) {
  const [items, setItems] = useState<SoilTest[]>([]);
  const [testedAt, setTestedAt] = useState(new Date().toISOString().slice(0, 10));
  const [ph, setPh] = useState("");
  const [grass, setGrass] = useState("");
  const [sugar, setSugar] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("paddock_soil_tests")
      .select("*")
      .eq("paddock_id", paddockId)
      .order("tested_at", { ascending: false });
    setItems((data ?? []) as SoilTest[]);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [paddockId]);

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

    setMessage(error ? error.message : "Soil test creado");
    if (!error) {
      setPh("");
      setGrass("");
      setSugar("");
      setNotes("");
      await load();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Nuevo soil test</CardTitle>
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
        {message && <CardDescription>{message}</CardDescription>}
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
