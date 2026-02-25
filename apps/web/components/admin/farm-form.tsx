"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnack } from "@/components/ui/snack";
import type { Farm } from "@/lib/db/types";

export function FarmForm({ farm, canEdit = true }: { farm: Farm; canEdit?: boolean }) {
  const snack = useSnack();
  const [name, setName] = useState(farm.name);
  const [hectares, setHectares] = useState(farm.hectares?.toString() ?? "");
  const [lowGain, setLowGain] = useState(farm.low_gain_threshold_adg.toString());
  const [overdue, setOverdue] = useState(farm.overdue_days.toString());

  const save = async () => {
    if (!canEdit) return;
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

    if (error) {
      snack.error("Error al guardar finca", error.message);
      return;
    }

    snack.success("Finca actualizada", "La información se guardó correctamente.");
  };

  return (
    <Card className="space-y-3">
      <CardTitle>Configuración de finca</CardTitle>
      <CardDescription>Umbrales usados por etiquetas del asistente de pesaje.</CardDescription>
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
      </div>
      <div>
        <Label>Hectáreas</Label>
        <Input
          value={hectares}
          onChange={(e) => setHectares(e.target.value)}
          type="number"
          step="0.01"
          disabled={!canEdit}
        />
      </div>
      <div>
        <Label>ADG mínimo (kg/día)</Label>
        <Input
          value={lowGain}
          onChange={(e) => setLowGain(e.target.value)}
          type="number"
          step="0.01"
          disabled={!canEdit}
        />
      </div>
      <div>
        <Label>Días para pesaje vencido</Label>
        <Input value={overdue} onChange={(e) => setOverdue(e.target.value)} type="number" disabled={!canEdit} />
      </div>
      <Button onClick={save} disabled={!canEdit}>
        Guardar
      </Button>
      {!canEdit && <CardDescription>Solo usuarios administradores pueden editar esta configuración.</CardDescription>}
    </Card>
  );
}
