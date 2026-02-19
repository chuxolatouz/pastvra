"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Paddock } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PaddocksManager({ farmId }: { farmId: string }) {
  const [items, setItems] = useState<Paddock[]>([]);
  const [code, setCode] = useState("");
  const [hectares, setHectares] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("paddocks").select("*").eq("farm_id", farmId).order("code");
    setItems((data ?? []) as Paddock[]);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [farmId]);

  const create = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("paddocks").insert({
      farm_id: farmId,
      code,
      hectares: hectares ? Number(hectares) : null,
      notes: notes || null,
    });
    setMessage(error ? error.message : "Potrero creado");
    if (!error) {
      setCode("");
      setHectares("");
      setNotes("");
      await load();
    }
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
        {message && <CardDescription>{message}</CardDescription>}
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
