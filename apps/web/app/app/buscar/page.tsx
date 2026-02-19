"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Animal = {
  id: string;
  chip_id: string | null;
  ear_tag: string | null;
  name: string | null;
};

export default function BuscarPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Animal[]>([]);

  const search = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("animals")
      .select("id,chip_id,ear_tag,name")
      .or(`chip_id.ilike.%${term}%,ear_tag.ilike.%${term}%,name.ilike.%${term}%`)
      .limit(20);

    setResults((data ?? []) as Animal[]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Buscar animal</h2>
      <div className="flex gap-2">
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="chipId, arete, nombre" />
        <Button onClick={search}>Buscar</Button>
      </div>
      <div className="space-y-2">
        {results.map((a) => (
          <Card key={a.id} className="flex items-center justify-between">
            <div>
              <CardTitle>{a.name || "Sin nombre"}</CardTitle>
              <CardDescription>
                Chip: {a.chip_id || "-"} | Arete: {a.ear_tag || "-"}
              </CardDescription>
            </div>
            <Link href={`/animal/${a.id}`} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">
              Abrir
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
