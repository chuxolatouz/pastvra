"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSnack } from "@/components/ui/snack";

type Animal = {
  id: string;
  rubro: "bovino" | "bufalino";
  chip_id: string | null;
  ear_tag: string | null;
  name: string | null;
};

export default function BuscarPage() {
  const snack = useSnack();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Animal[]>([]);

  const search = async () => {
    const query = term.trim();
    if (!query) {
      snack.error("Búsqueda vacía", "Ingresa un término para buscar.");
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("animals")
      .select("id,rubro,chip_id,ear_tag,name")
      .or(`chip_id.ilike.%${query}%,ear_tag.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      snack.error("Error al buscar animales", error.message);
      return;
    }

    const list = (data ?? []) as Animal[];
    setResults(list);
    snack.success("Búsqueda completada", `Resultados encontrados: ${list.length}.`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Buscar animal</h2>
      <div className="flex gap-2">
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="chip, arete, nombre" />
        <Button onClick={search}>Buscar</Button>
      </div>
      <div className="space-y-2">
        {results.map((a) => (
          <Card key={a.id} className="flex items-center justify-between">
            <div>
              <CardTitle>{a.name || "Sin nombre"}</CardTitle>
              <CardDescription>
                Rubro: {a.rubro === "bovino" ? "Bovino" : "Bufalino"} | Chip: {a.chip_id || "-"} | Arete: {a.ear_tag || "-"}
              </CardDescription>
            </div>
            <Link href={`/app/animales/${a.id}`} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">
              Abrir
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
