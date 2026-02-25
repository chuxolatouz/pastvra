"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Paddock } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnack } from "@/components/ui/snack";
import { Textarea } from "@/components/ui/textarea";

export function PaddocksManager({ farmId }: { farmId: string }) {
  const snack = useSnack();
  const [items, setItems] = useState<Paddock[]>([]);
  const [code, setCode] = useState("");
  const [hectares, setHectares] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("paddocks").select("*").eq("farm_id", farmId).order("code");
    if (error) {
      snack.error("No se pudo cargar potreros", error.message);
      return;
    }
    setItems((data ?? []) as Paddock[]);
  }, [farmId, snack]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const create = async () => {
    if (!code.trim()) {
      snack.error("Código requerido", "Ingresa un código para el potrero.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("paddocks").insert({
      farm_id: farmId,
      code,
      hectares: hectares ? Number(hectares) : null,
      notes: notes || null,
    });
    if (error) {
      snack.error("Error al crear potrero", error.message);
      return;
    }

    snack.success("Potrero creado", `Se registró el potrero ${code}.`);
    setCode("");
    setHectares("");
    setNotes("");
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Nuevo potrero</CardTitle>
        <div>
          <Label>Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-01" />
        </div>
        <div>
          <Label>Hectáreas</Label>
          <Input value={hectares} onChange={(e) => setHectares(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={create}>Crear potrero</Button>
        <CardDescription>Los cambios se guardan y se reflejan de inmediato en la lista.</CardDescription>
      </Card>

      <div className="space-y-3">
        {items.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <CardTitle>{p.code}</CardTitle>
              <CardDescription>{p.hectares ? `${p.hectares} ha` : "Sin hectáreas"}</CardDescription>
            </div>
            <Link href={`/admin/potreros/${p.id}`} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">
              Ver detalle
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
