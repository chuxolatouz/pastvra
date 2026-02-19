"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import type { Animal, AnimalWeight } from "@/lib/db/types";
import { buildMonthlyMatrix, defaultWeighedAtForMonth, MONTH_LABELS } from "@/lib/utils/monthly-weight";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditState = {
  animalId: string;
  animalName: string;
  month: number;
  date: string;
  weight: string;
};

export function MonthlyWeightReport({
  farmId,
  userId,
  animals,
}: {
  farmId: string;
  userId: string;
  animals: Animal[];
}) {
  const supabase = createClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [weights, setWeights] = useState<AnimalWeight[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [edit, setEdit] = useState<EditState | null>(null);

  const load = async () => {
    setLoading(true);
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;

    const { data, error } = await supabase
      .from("animal_weights")
      .select("*")
      .eq("farm_id", farmId)
      .gte("weighed_at", from)
      .lte("weighed_at", to)
      .order("weighed_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setWeights((data ?? []) as AnimalWeight[]);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, farmId]);

  const rows = useMemo(() => buildMonthlyMatrix({ animals, weights, year }), [animals, weights, year]);

  const openEditor = (animalId: string, animalName: string, month: number, currentWeight: number | null) => {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const date = isCurrentMonth ? format(now, "yyyy-MM-dd") : defaultWeighedAtForMonth(year, month);

    setEdit({
      animalId,
      animalName,
      month,
      date,
      weight: currentWeight?.toString() ?? "",
    });
  };

  const saveCell = async () => {
    if (!edit || !edit.weight) return;
    setLoading(true);

    const { error } = await supabase.from("animal_weights").insert({
      farm_id: farmId,
      animal_id: edit.animalId,
      weighed_at: edit.date,
      weight_kg: Number(edit.weight),
      client_generated_id: uuidv4(),
      created_by: userId,
      source: "monthly_matrix",
      source_row_hash: null,
    });

    setMessage(error ? error.message : "Peso guardado");
    if (!error) {
      setEdit(null);
      await load();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Control de pesaje mensual</CardTitle>
        <CardDescription>
          Regla de cálculo: aumento mensual = peso actual - peso mes anterior. GMD = aumento / 30.
        </CardDescription>
        <div className="max-w-40">
          <Label>Año</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </Card>

      <Card>
        <CardTitle>Matriz ENE..DIC</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[1850px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                <th className="px-2 py-2">Identificación</th>
                {MONTH_LABELS.map((month) => (
                  <th key={month} className="px-2 py-2 text-center">
                    {month}
                  </th>
                ))}
                <th className="px-2 py-2">TOTAL</th>
                <th className="px-2 py-2">GMD anual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.animal.id} className="border-b align-top">
                  <td className="px-2 py-2">
                    <p className="font-semibold">{row.animal.name || row.animal.ear_tag || row.animal.chip_id || row.animal.id}</p>
                    <p className="text-xs text-slate-500">{row.animal.chip_id || row.animal.ear_tag || "Sin ID"}</p>
                    {row.pendingCurrentMonth && <p className="text-xs font-bold text-red-600">Pendiente mes actual</p>}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={`${row.animal.id}-${cell.month}`} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left hover:bg-slate-50"
                        onClick={() =>
                          openEditor(
                            row.animal.id,
                            row.animal.name || row.animal.ear_tag || row.animal.chip_id || row.animal.id,
                            cell.month,
                            cell.weight,
                          )
                        }
                      >
                        <p className="font-semibold">{cell.weight !== null ? `${cell.weight.toFixed(1)} kg` : "-"}</p>
                        <p className="text-xs text-slate-600">{cell.gain !== null ? `+${cell.gain.toFixed(1)} kg` : ""}</p>
                        <p className="text-xs text-slate-600">{cell.gmd !== null ? `GMD ${cell.gmd.toFixed(3)}` : ""}</p>
                      </button>
                    </td>
                  ))}
                  <td className="px-2 py-2">{row.totalAnnual !== null ? `${row.totalAnnual.toFixed(1)} kg` : "-"}</td>
                  <td className="px-2 py-2">{row.gmdAnnual !== null ? row.gmdAnnual.toFixed(3) : "-"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={15} className="px-2 py-4 text-center text-slate-500">
                    No hay animales para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md space-y-3">
            <CardTitle>
              Cargar peso - {edit.animalName} ({MONTH_LABELS[edit.month]})
            </CardTitle>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={edit.date} onChange={(e) => setEdit((s) => (s ? { ...s, date: e.target.value } : s))} />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={edit.weight}
                onChange={(e) => setEdit((s) => (s ? { ...s, weight: e.target.value } : s))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCell} disabled={loading || !edit.weight}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setEdit(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
