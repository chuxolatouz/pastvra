"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Farm } from "@/lib/db/types";

export function FarmForm({ farm }: { farm: Farm }) {
  const [name, setName] = useState(farm.name);
  const [hectares, setHectares] = useState(farm.hectares?.toString() ?? "");
  const [lowGain, setLowGain] = useState(farm.low_gain_threshold_adg.toString());
  const [overdue, setOverdue] = useState(farm.overdue_days.toString());
  const [message, setMessage] = useState("");

  const save = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("farms")
      .update({
        name,
        hectares: hectares ? Number(hectares) : null,
        low_gain_threshold_adg: Number(lowGain),
        overdue_days: Number(overdue),
      })
      .eq("id", farm.id);

    setMessage(error ? error.message : "Guardado");
  };

  return (
    <Card className="space-y-3">
      <CardTitle>Configuración de finca</CardTitle>
      <CardDescription>Umbrales usados por tags del wizard.</CardDescription>
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Hectáreas</Label>
        <Input value={hectares} onChange={(e) => setHectares(e.target.value)} type="number" step="0.01" />
      </div>
      <div>
        <Label>ADG mínimo (kg/día)</Label>
        <Input value={lowGain} onChange={(e) => setLowGain(e.target.value)} type="number" step="0.01" />
      </div>
      <div>
        <Label>Días para overdue</Label>
        <Input value={overdue} onChange={(e) => setOverdue(e.target.value)} type="number" />
      </div>
      <Button onClick={save}>Guardar</Button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </Card>
  );
}
