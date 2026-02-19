"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InventoryMovement } from "@/lib/db/types";
import { buildInventoryLedger, money } from "@/lib/utils/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  movement_date: string;
  partner_name: string;
  destination_name: string;
  category_name: string;
  opening_balance: string;
  purchases_qty: string;
  sales_qty: string;
  transfers_qty: string;
  unit_value_usd: string;
  observed_weight_kg: string;
  price_per_kg: string;
  kg_negotiated: string;
  freight_usd: string;
  commission_rate: string;
  notes: string;
};

const initialForm: FormState = {
  movement_date: new Date().toISOString().slice(0, 10),
  partner_name: "",
  destination_name: "",
  category_name: "",
  opening_balance: "",
  purchases_qty: "",
  sales_qty: "",
  transfers_qty: "",
  unit_value_usd: "",
  observed_weight_kg: "",
  price_per_kg: "",
  kg_negotiated: "",
  freight_usd: "",
  commission_rate: "",
  notes: "",
};

function toNullableNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isNaN(n) ? null : n;
}

export function InventoryManager({ farmId, userId, canWrite }: { farmId: string; userId: string; canWrite: boolean }) {
  const supabase = createClient();

  const [rows, setRows] = useState<InventoryMovement[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("inventory_movements")
      .select("*")
      .eq("farm_id", farmId)
      .order("movement_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (fromDate) query = query.gte("movement_date", fromDate);
    if (toDate) query = query.lte("movement_date", toDate);
    if (destinationFilter !== "todos") query = query.eq("destination_name", destinationFilter);
    if (categoryFilter !== "todos") query = query.eq("category_name", categoryFilter);

    const { data, error } = await query;
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as InventoryMovement[]);
    setLoading(false);
  };

  const loadFilterOptions = async () => {
    const { data } = await supabase
      .from("inventory_movements")
      .select("destination_name,category_name")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true });

    const list = (data ?? []) as Array<{ destination_name: string | null; category_name: string | null }>;
    setDestinations([...new Set(list.map((x) => x.destination_name).filter(Boolean) as string[])]);
    setCategories([...new Set(list.map((x) => x.category_name).filter(Boolean) as string[])]);
  };

  useEffect(() => {
    load().catch(() => undefined);
    loadFilterOptions().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, fromDate, toDate, destinationFilter, categoryFilter]);

  const { ledger, totals } = useMemo(() => buildInventoryLedger(rows), [rows]);
  const activeFilterCount = [fromDate, toDate, destinationFilter !== "todos", categoryFilter !== "todos"].filter(Boolean)
    .length;

  const saveMovement = async () => {
    setLoading(true);
    const payload = {
      farm_id: farmId,
      movement_date: form.movement_date,
      partner_name: form.partner_name || null,
      destination_name: form.destination_name || null,
      category_name: form.category_name || null,
      opening_balance: toNullableNumber(form.opening_balance),
      purchases_qty: toNullableNumber(form.purchases_qty),
      sales_qty: toNullableNumber(form.sales_qty),
      transfers_qty: toNullableNumber(form.transfers_qty),
      unit_value_usd: toNullableNumber(form.unit_value_usd),
      observed_weight_kg: toNullableNumber(form.observed_weight_kg),
      price_per_kg: toNullableNumber(form.price_per_kg),
      kg_negotiated: toNullableNumber(form.kg_negotiated),
      freight_usd: toNullableNumber(form.freight_usd),
      commission_rate: toNullableNumber(form.commission_rate),
      notes: form.notes || null,
      created_by: userId,
      source: "manual",
    };

    const { error } = await supabase.from("inventory_movements").insert(payload);
    setMessage(error ? error.message : "Movimiento guardado");

    if (!error) {
      setForm({ ...initialForm, movement_date: form.movement_date });
      await load();
      await loadFilterOptions();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Totales del período</CardTitle>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">Saldo final: {totals.closing_balance.toFixed(2)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Compras: {totals.purchases_qty.toFixed(2)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Ventas: {totals.sales_qty.toFixed(2)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Traslados: {totals.transfers_qty.toFixed(2)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Compras USD: {money(totals.purchases_usd)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Ventas USD: {money(totals.sales_usd)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Transferencias USD: {money(totals.transfers_usd)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Flete USD: {money(totals.freight_usd)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Comisiones USD: {money(totals.commission_usd)}</div>
          <div className="rounded-xl bg-slate-50 p-3">Costo total adquisición: {money(totals.total_acquisition_usd)}</div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Filtros</CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">{activeFilterCount} activos</span>}
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
          </div>
        </div>
        {showFilters ? (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label>Desde</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div>
                <Label>Destino</Label>
                <Select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)}>
                  <option value="todos">Todos</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="todos">Todas</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setDestinationFilter("todos");
                  setCategoryFilter("todos");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </>
        ) : (
          <CardDescription>Filtros avanzados ocultos para mantener la vista compacta.</CardDescription>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Nuevo movimiento</CardTitle>
        <CardDescription>
          Traslados positivos se consideran salida para el cálculo de saldo. Para entradas usa valor negativo.
        </CardDescription>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Fecha">
            <Input
              type="date"
              value={form.movement_date}
              onChange={(e) => setForm((s) => ({ ...s, movement_date: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Vendedor/Comprador">
            <Input
              value={form.partner_name}
              onChange={(e) => setForm((s) => ({ ...s, partner_name: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Destino">
            <Input
              value={form.destination_name}
              onChange={(e) => setForm((s) => ({ ...s, destination_name: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Categoría">
            <Input
              value={form.category_name}
              onChange={(e) => setForm((s) => ({ ...s, category_name: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Saldo inicial">
            <Input
              type="number"
              value={form.opening_balance}
              onChange={(e) => setForm((s) => ({ ...s, opening_balance: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Compras">
            <Input
              type="number"
              value={form.purchases_qty}
              onChange={(e) => setForm((s) => ({ ...s, purchases_qty: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Ventas">
            <Input
              type="number"
              value={form.sales_qty}
              onChange={(e) => setForm((s) => ({ ...s, sales_qty: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Traslados (+ salida)">
            <Input
              type="number"
              value={form.transfers_qty}
              onChange={(e) => setForm((s) => ({ ...s, transfers_qty: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Valor USD/unidad">
            <Input
              type="number"
              step="0.01"
              value={form.unit_value_usd}
              onChange={(e) => setForm((s) => ({ ...s, unit_value_usd: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Obs. peso (kg)">
            <Input
              type="number"
              step="0.01"
              value={form.observed_weight_kg}
              onChange={(e) => setForm((s) => ({ ...s, observed_weight_kg: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Precio por kg">
            <Input
              type="number"
              step="0.01"
              value={form.price_per_kg}
              onChange={(e) => setForm((s) => ({ ...s, price_per_kg: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Kg negociada">
            <Input
              type="number"
              step="0.01"
              value={form.kg_negotiated}
              onChange={(e) => setForm((s) => ({ ...s, kg_negotiated: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Flete USD">
            <Input
              type="number"
              step="0.01"
              value={form.freight_usd}
              onChange={(e) => setForm((s) => ({ ...s, freight_usd: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
          <Field label="Comisión (0.03)">
            <Input
              type="number"
              step="0.001"
              value={form.commission_rate}
              onChange={(e) => setForm((s) => ({ ...s, commission_rate: e.target.value }))}
              disabled={!canWrite || loading}
            />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            disabled={!canWrite || loading}
          />
        </Field>

        <Button onClick={saveMovement} disabled={!canWrite || loading} size="lg">
          {loading ? "Guardando..." : "Guardar movimiento"}
        </Button>
        {!canWrite && <CardDescription>Modo lectura: solo admin/supervisor pueden editar inventario.</CardDescription>}
      </Card>

      <Card>
        <CardTitle>Control de inventario</CardTitle>
        <CardDescription>Fila de datos en planilla original inicia en la fila 6.</CardDescription>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[1800px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                {[
                  "Fecha",
                  "Vendedor/Comprador",
                  "Saldo Inicial",
                  "Compras",
                  "Ventas",
                  "Traslados",
                  "Saldo Final",
                  "Valor",
                  "Obs. Peso",
                  "Ventas USD",
                  "Compras USD",
                  "Transferencias USD",
                  "Flete USD",
                  "Comisiones USD",
                  "Costo Total",
                  "Destino",
                  "Categoría",
                  "Precio/kg",
                  "Kg negociada",
                ].map((h) => (
                  <th key={h} className="px-2 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="px-2 py-2">{row.movement_date}</td>
                  <td className="px-2 py-2">{row.partner_name ?? "-"}</td>
                  <td className="px-2 py-2">{row.effective_opening_balance.toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.purchases_qty ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.sales_qty ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.transfers_qty ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{row.closing_balance.toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.unit_value_usd ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.observed_weight_kg ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{money(row.sales_usd)}</td>
                  <td className="px-2 py-2">{money(row.purchases_usd)}</td>
                  <td className="px-2 py-2">{money(row.transfers_usd)}</td>
                  <td className="px-2 py-2">{money(Number(row.freight_usd ?? 0))}</td>
                  <td className="px-2 py-2">{money(row.commission_usd)}</td>
                  <td className="px-2 py-2">{money(row.total_acquisition_usd)}</td>
                  <td className="px-2 py-2">{row.destination_name ?? "-"}</td>
                  <td className="px-2 py-2">{row.category_name ?? "-"}</td>
                  <td className="px-2 py-2">{Number(row.price_per_kg ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">{Number(row.kg_negotiated ?? 0).toFixed(2)}</td>
                </tr>
              ))}
              {!ledger.length && (
                <tr>
                  <td colSpan={19} className="px-2 py-4 text-center text-slate-500">
                    Sin movimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
