"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnack } from "@/components/ui/snack";

type CreateFarmResponse = {
  ok?: boolean;
  error?: string;
  farmId?: string;
};

export function FarmCreateForm() {
  const router = useRouter();
  const snack = useSnack();

  const [name, setName] = useState("");
  const [hectares, setHectares] = useState("");
  const [lowGain, setLowGain] = useState("0.3");
  const [overdue, setOverdue] = useState("45");
  const [saving, setSaving] = useState(false);

  const createFarm = async () => {
    const farmName = name.trim();
    if (!farmName) {
      snack.error("Nombre requerido", "Ingresa un nombre para la finca.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/admin/farms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: farmName,
        hectares: hectares ? Number(hectares) : null,
        low_gain_threshold_adg: Number(lowGain),
        overdue_days: Number(overdue),
      }),
    });

    const payload = (await res.json()) as CreateFarmResponse;

    if (!res.ok || !payload.ok || !payload.farmId) {
      snack.error("Error al crear finca", payload.error ?? "No fue posible crear la finca.");
      setSaving(false);
      return;
    }

    snack.success("Finca creada", "La finca fue creada y se te asignó como administrador.");
    router.push(`/admin/fincas/${payload.farmId}`);
    router.refresh();
  };

  return (
    <Card className="space-y-3">
      <CardTitle>Nueva finca</CardTitle>
      <CardDescription>
        Esta operación crea la finca y registra automáticamente tu membresía con rol administrador.
      </CardDescription>

      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hacienda El Roble" />
      </div>

      <div>
        <Label>Hectáreas</Label>
        <Input
          value={hectares}
          onChange={(e) => setHectares(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Ej: 125"
        />
      </div>

      <div>
        <Label>ADG mínimo (kg/día)</Label>
        <Input value={lowGain} onChange={(e) => setLowGain(e.target.value)} type="number" step="0.01" />
      </div>

      <div>
        <Label>Días para pesaje vencido</Label>
        <Input value={overdue} onChange={(e) => setOverdue(e.target.value)} type="number" />
      </div>

      <Button onClick={createFarm} disabled={saving}>
        {saving ? "Creando..." : "Crear finca"}
      </Button>
    </Card>
  );
}
