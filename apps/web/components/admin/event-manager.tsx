"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSnack } from "@/components/ui/snack";
import { Textarea } from "@/components/ui/textarea";
import type { AnimalEvent } from "@/lib/db/types";

const eventTypes = ["vacuna", "desparasitacion", "parto", "venta", "compra", "traslado_potrero", "otro"];

export function EventManager({ farmId, animalId, userId }: { farmId: string; animalId: string; userId: string }) {
  const snack = useSnack();
  const [items, setItems] = useState<AnimalEvent[]>([]);
  const [eventType, setEventType] = useState("vacuna");
  const [eventAt, setEventAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [payload, setPayload] = useState("{}");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("animal_events")
      .select("*")
      .eq("animal_id", animalId)
      .order("event_at", { ascending: false });
    if (error) {
      snack.error("No se pudo cargar eventos", error.message);
      return;
    }
    setItems((data ?? []) as AnimalEvent[]);
  }, [animalId, snack]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const create = async () => {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = payload.trim() ? (JSON.parse(payload) as Record<string, unknown>) : null;
    } catch {
      snack.error("JSON inválido", "Verifica el contenido del campo JSON.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("animal_events").insert({
      farm_id: farmId,
      animal_id: animalId,
      event_type: eventType,
      event_at: eventAt,
      payload: parsed,
      notes: notes || null,
      created_by: userId,
    });

    if (error) {
      snack.error("Error al guardar evento", error.message);
      return;
    }

    snack.success("Evento creado", "El evento quedó registrado en el historial del animal.");
    setNotes("");
    setPayload("{}");
    await load();
  };

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <CardTitle>Registrar evento</CardTitle>
        <div>
          <Label>Tipo</Label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        </div>
        <div>
          <Label>Datos JSON</Label>
          <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} />
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={create}>Guardar evento</Button>
        <CardDescription>Usa JSON para campos extra cuando el tipo de evento lo requiera.</CardDescription>
      </Card>

      <Card>
        <CardTitle>Historial de eventos</CardTitle>
        <div className="mt-3 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <strong>{it.event_type}</strong> | {it.event_at}
              {it.notes ? ` | ${it.notes}` : ""}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
