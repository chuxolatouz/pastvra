"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db/offline";
import { useOnlineStatus } from "@/lib/db/hooks";
import { buildTags, calculateAdg, monthlyAverages, project30Days, type WeightPoint } from "@/lib/utils/weights";
import { formatKg } from "@/lib/utils";
import { QrScanner } from "./qr-scanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSnack } from "@/components/ui/snack";
import type { Animal, Farm, AnimalWeight } from "@/lib/db/types";

const steps = ["Escanear", "Confirmar", "Peso", "Guardar", "Resultado"];

export function WeightWizard({ farm, userId }: { farm: Farm; userId: string }) {
  const supabase = createClient();
  const snack = useSnack();
  const online = useOnlineStatus();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [weights, setWeights] = useState<AnimalWeight[]>([]);
  const [weightKg, setWeightKg] = useState("");
  const [weighedAt, setWeighedAt] = useState(new Date().toISOString().slice(0, 10));
  const [savedPoint, setSavedPoint] = useState<WeightPoint | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const lastWeight = weights[0] ?? null;

  const fetchAnimal = async (value: string) => {
    const term = value.trim();
    if (!term) {
      snack.error("Identificador requerido", "Escribe chip, arete o identificador libre.");
      return;
    }

    if (online) {
      const base = supabase
        .from("animals")
        .select("*")
        .eq("farm_id", farm.id)
        .or(`chip_id.eq.${term},ear_tag.eq.${term}`)
        .limit(1);

      const { data, error } = await base;
      if (error) {
        setMessage(error.message);
        snack.error("Error al buscar animal", error.message);
        return;
      }

      const found = (data?.[0] ?? null) as Animal | null;

      if (!found) {
        setMessage("No se encontró animal");
        snack.error("Animal no encontrado", "Verifica el identificador e intenta nuevamente.");
        return;
      }

      const { data: w, error: weightsError } = await supabase
        .from("animal_weights")
        .select("*")
        .eq("animal_id", found.id)
        .order("weighed_at", { ascending: false });

      if (weightsError) {
        setMessage(weightsError.message);
        snack.error("No se pudo cargar historial", weightsError.message);
        return;
      }

      const local = (w ?? []) as AnimalWeight[];
      setAnimal(found);
      setWeights(local);
      setStep(1);
      setMessage("");
      snack.success("Animal encontrado", found.name || found.chip_id || found.ear_tag || found.id.slice(0, 8));

      await db.animal_cache.put({
        id: found.id,
        farm_id: found.farm_id,
        chip_id: found.chip_id,
        ear_tag: found.ear_tag,
        name: found.name,
        photo_path: found.photo_path,
        last_weight_kg: local[0]?.weight_kg ?? null,
        last_weighed_at: local[0]?.weighed_at ?? null,
      });
      return;
    }

    const cached = await db.animal_cache
      .where("farm_id")
      .equals(farm.id)
      .filter((a) => a.chip_id === term || a.ear_tag === term)
      .first();

    if (!cached) {
      setMessage("Sin conexión y animal no está en caché local.");
      snack.error("Sin conexión", "El animal no está disponible en caché local.");
      return;
    }

    setAnimal({
      id: cached.id,
      farm_id: cached.farm_id,
      rubro: "bovino",
      chip_id: cached.chip_id,
      ear_tag: cached.ear_tag,
      name: cached.name,
      photo_path: cached.photo_path,
      sex: "H",
      breed: null,
      birth_date: new Date().toISOString().slice(0, 10),
      cost: null,
      status: "vivo",
      notes: null,
      current_paddock_id: null,
      sire_id: null,
      dam_id: null,
      sire_external: null,
      dam_external: null,
    });

    setWeights(
      cached.last_weight_kg
        ? [
            {
              id: "offline-last",
              farm_id: cached.farm_id,
              animal_id: cached.id,
              weighed_at: cached.last_weighed_at ?? new Date().toISOString().slice(0, 10),
              weight_kg: cached.last_weight_kg,
              client_generated_id: "offline",
              source: "offline_cache",
              source_row_hash: null,
              created_by: userId,
              created_at: new Date().toISOString(),
            },
          ]
        : [],
    );
    setStep(1);
    setMessage("");
    snack.success("Animal cargado en modo local", cached.name || cached.chip_id || cached.ear_tag || cached.id.slice(0, 8));
  };

  const save = async () => {
    if (!animal) return;
    setSaving(true);
    const newPoint = { weighed_at: weighedAt, weight_kg: Number(weightKg) };
    const clientGeneratedId = uuidv4();

    if (online) {
      const { error } = await supabase.from("animal_weights").insert({
        farm_id: farm.id,
        animal_id: animal.id,
        weighed_at: weighedAt,
        weight_kg: Number(weightKg),
        client_generated_id: clientGeneratedId,
        source: "wizard",
        created_by: userId,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        snack.error("Error al guardar pesaje", error.message);
        setSaving(false);
        return;
      }
    } else {
      await db.pending_weights.put({
        client_generated_id: clientGeneratedId,
        farm_id: farm.id,
        animal_id: animal.id,
        weighed_at: weighedAt,
        weight_kg: Number(weightKg),
        created_at: new Date().toISOString(),
      });
    }

    setSavedPoint(newPoint);
    setStep(4);
    setSaving(false);
    setMessage(online ? "Guardado en línea" : "Guardado sin conexión (pendiente de sincronizar)");
    if (online) {
      snack.success("Pesaje guardado", "El registro se almacenó correctamente en la base de datos.");
    } else {
      snack.info("Pesaje guardado localmente", "Se sincronizará cuando vuelvas a tener conexión.");
    }
  };

  const result = useMemo(() => {
    if (!savedPoint) return null;
    const previous = lastWeight
      ? {
          weighed_at: lastWeight.weighed_at,
          weight_kg: lastWeight.weight_kg,
        }
      : null;

    const adg = calculateAdg(previous, savedPoint);
    const monthly = monthlyAverages([
      ...weights
        .map((w) => ({ weighed_at: w.weighed_at, weight_kg: w.weight_kg }))
        .sort((a, b) => a.weighed_at.localeCompare(b.weighed_at)),
      savedPoint,
    ]);
    const projection = project30Days(
      [...weights.map((w) => ({ weighed_at: w.weighed_at, weight_kg: w.weight_kg })), savedPoint].sort((a, b) =>
        a.weighed_at.localeCompare(b.weighed_at),
      ),
    );
    const tags = buildTags({
      previous,
      current: savedPoint,
      lowGainThreshold: farm.low_gain_threshold_adg,
      overdueDays: farm.overdue_days,
    });

    return { adg, monthly, projection, tags };
  }, [savedPoint, lastWeight, weights, farm.low_gain_threshold_adg, farm.overdue_days]);

  useEffect(() => {
    if (step === 2 && !weightKg) {
      setWeightKg(lastWeight ? lastWeight.weight_kg.toString() : "");
    }
  }, [step, lastWeight, weightKg]);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Asistente de pesaje</CardTitle>
        <CardDescription>Pasos: {steps.map((s, i) => `${i + 1}.${s}${i === step ? "*" : ""}`).join(" | ")}</CardDescription>
      </Card>

      {step === 0 && (
        <Card className="space-y-4">
          <CardTitle>Paso 1: Escanear o ingresar ID</CardTitle>
          <CardDescription>Escanea QR con cámara o escribe chip/arete manualmente.</CardDescription>
          <QrScanner
            onDetected={(value) => {
              setQuery(value);
              fetchAnimal(value).catch(() => undefined);
            }}
          />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="chip o arete" />
          <Button onClick={() => fetchAnimal(query)} size="lg">
            Buscar animal
          </Button>
        </Card>
      )}

      {step === 1 && animal && (
        <Card className="space-y-3">
          <CardTitle>Paso 2: Confirmar animal</CardTitle>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xl font-black">{animal.name || "Sin nombre"}</p>
            <p>Rubro: {animal.rubro === "bovino" ? "Bovino" : "Bufalino"}</p>
            <p>Chip: {animal.chip_id || "-"}</p>
            <p>Arete: {animal.ear_tag || "-"}</p>
            <p>
              Último peso: {formatKg(lastWeight?.weight_kg)} | Fecha: {lastWeight?.weighed_at ?? "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} size="lg">
              Confirmar
            </Button>
            <Button onClick={() => setStep(0)} variant="outline">
              Volver
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && animal && (
        <Card className="space-y-3">
          <CardTitle>Paso 3: Ingresar nuevo peso</CardTitle>
          <div>
            <p className="mb-1 font-semibold">Peso (kg)</p>
            <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 font-semibold">Fecha</p>
            <Input type="date" value={weighedAt} onChange={(e) => setWeighedAt(e.target.value)} />
          </div>
          <Button onClick={() => setStep(3)} size="lg" disabled={!weightKg}>
            Continuar
          </Button>
        </Card>
      )}

      {step === 3 && animal && (
        <Card className="space-y-3">
          <CardTitle>Paso 4: Guardar</CardTitle>
          <CardDescription>
            {online ? "Conexión activa: se guardará en Supabase." : "Sin conexión: se guardará pendiente en el equipo."}
          </CardDescription>
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? "Guardando..." : "Guardar pesaje"}
          </Button>
        </Card>
      )}

      {step === 4 && result && animal && (
        <Card className="space-y-3">
          <CardTitle>Paso 5: Resultado</CardTitle>
          <CardDescription>{message}</CardDescription>
          <p>
            ADG: <strong>{result.adg !== null ? `${result.adg.toFixed(3)} kg/día` : "Sin base"}</strong>
          </p>
          <p>
            Proyección 30 días: <strong>{result.projection ? `${result.projection.projectedWeight.toFixed(1)} kg` : "N/A"}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {result.tags.length ? result.tags.map((t) => <Badge key={t}>{t}</Badge>) : <Badge>Sin alertas</Badge>}
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            Tendencia mensual: {result.monthly.map((m) => `${m.month}: ${m.avg.toFixed(1)}kg`).join(" | ") || "N/A"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setStep(0);
                setAnimal(null);
                setWeights([]);
                setSavedPoint(null);
                setQuery("");
              }}
            >
              Nuevo pesaje
            </Button>
            <Link href={`/app/animales/${animal.id}`} className="rounded-xl bg-slate-200 px-4 py-2 font-semibold">
              Ver animal
            </Link>
          </div>
        </Card>
      )}

      {message && step < 4 && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
