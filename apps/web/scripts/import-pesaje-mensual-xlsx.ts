import path from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type Args = {
  file: string;
  farm: string;
  user: string;
  year: number;
};

type Animal = {
  id: string;
  farm_id: string;
  chip_id: string | null;
  ear_tag: string | null;
  name: string | null;
};

type Mapping = {
  external_identifier: string;
  animal_id: string;
};

const MONTH_MAP: Record<string, number> = {
  ENE: 0,
  FEB: 1,
  MAR: 2,
  ABR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DIC: 11,
};

function getArgs(): Args {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];
    if (key?.startsWith("--") && value) {
      map.set(key.slice(2), value);
      i += 1;
    }
  }

  const file = map.get("file");
  const farm = map.get("farm");
  const user = map.get("user");
  const year = Number(map.get("year") ?? new Date().getFullYear());

  if (!file || !farm || !user || Number.isNaN(year)) {
    throw new Error(
      "Uso: tsx scripts/import-pesaje-mensual-xlsx.ts --file <xlsx> --farm <farm_id> --user <user_id> [--year 2025]",
    );
  }

  return { file, farm, user, year };
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function identifierDigits(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

function toMonthDate(year: number, month: number) {
  const d = new Date(Date.UTC(year, month + 1, 0));
  return d.toISOString().slice(0, 10);
}

function deterministicUuidFromHash(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function main() {
  const { file, farm, user, year } = getArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");

  const supabase = createClient(url, key);

  const [{ data: animals, error: animalsError }, { data: mappings, error: mappingsError }] = await Promise.all([
    supabase.from("animals").select("id,farm_id,chip_id,ear_tag,name").eq("farm_id", farm),
    supabase
      .from("weight_import_identifier_mappings")
      .select("external_identifier,animal_id")
      .eq("farm_id", farm),
  ]);

  if (animalsError) throw new Error(animalsError.message);
  if (mappingsError) throw new Error(mappingsError.message);

  const animalList = (animals ?? []) as Animal[];
  const mappingList = (mappings ?? []) as Mapping[];

  const byText = new Map<string, Animal>();
  animalList.forEach((a) => {
    if (a.chip_id) byText.set(normalize(a.chip_id), a);
    if (a.ear_tag) byText.set(normalize(a.ear_tag), a);
    if (a.name) byText.set(normalize(a.name), a);
    byText.set(normalize(a.id), a);
  });

  const byDigits = new Map<string, Animal>();
  animalList.forEach((a) => {
    const values = [a.chip_id, a.ear_tag, a.name];
    values.forEach((v) => {
      const d = identifierDigits(String(v ?? ""));
      if (d) byDigits.set(d, a);
    });
  });

  const mappingMap = new Map(mappingList.map((m) => [normalize(m.external_identifier), m.animal_id]));

  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheetName = "Controle de pesaje";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No se encontró la hoja '${sheetName}'`);

  const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const headerRowIndex = rows.findIndex((r) => String(r[1] ?? "").toLowerCase().includes("identific"));
  if (headerRowIndex < 0) throw new Error("No se encontró la fila de encabezados de meses/identificación");

  const headerRow = rows[headerRowIndex] ?? [];
  const monthColumns: Array<{ col: number; month: number }> = [];

  headerRow.forEach((value, idx) => {
    const keyText = String(value ?? "").trim().toUpperCase();
    if (keyText in MONTH_MAP) {
      monthColumns.push({ col: idx, month: MONTH_MAP[keyText] });
    }
  });

  if (!monthColumns.length) {
    throw new Error("No se detectaron columnas de meses (ENE..DIC)");
  }

  const unresolved: string[] = [];
  const weightsPayload: Array<Record<string, unknown>> = [];
  const mappingPayload: Array<Record<string, unknown>> = [];

  for (const row of rows.slice(headerRowIndex + 1)) {
    const identifierRaw = row[1];
    if (identifierRaw === null || identifierRaw === undefined || String(identifierRaw).trim() === "") continue;

    const identifier = String(identifierRaw).trim();
    const idKey = normalize(identifier);

    let animal: Animal | undefined;

    const mappedAnimalId = mappingMap.get(idKey);
    if (mappedAnimalId) {
      animal = animalList.find((a) => a.id === mappedAnimalId);
    }

    if (!animal) {
      animal = byText.get(idKey);
    }

    if (!animal) {
      const digits = identifierDigits(identifier);
      if (digits) animal = byDigits.get(digits);
    }

    if (!animal) {
      unresolved.push(identifier);
      continue;
    }

    mappingPayload.push({
      farm_id: farm,
      external_identifier: identifier,
      animal_id: animal.id,
      created_by: user,
    });

    for (const { col, month } of monthColumns) {
      const rawWeight = row[col];
      const weight = Number(rawWeight);

      if (!rawWeight || Number.isNaN(weight) || weight <= 0) continue;

      const weighedAt = toMonthDate(year, month);
      const sourceRowHash = crypto
        .createHash("sha256")
        .update(`${farm}|${animal.id}|${identifier}|${year}|${month}|${weight}`)
        .digest("hex");

      const clientGeneratedId = deterministicUuidFromHash(sourceRowHash);

      weightsPayload.push({
        farm_id: farm,
        animal_id: animal.id,
        weighed_at: weighedAt,
        weight_kg: weight,
        client_generated_id: clientGeneratedId,
        created_by: user,
        source: "xlsx_pesaje_import",
        source_row_hash: sourceRowHash,
      });
    }
  }

  if (!weightsPayload.length) {
    console.log("No se detectaron pesajes válidos para importar.");
    if (unresolved.length) {
      console.log("Identificadores sin match:", [...new Set(unresolved)].join(", "));
    }
    return;
  }

  const uniqueMappings = Array.from(
    new Map(mappingPayload.map((m) => [String(m.external_identifier).toLowerCase(), m])).values(),
  );

  const { error: mappingUpsertError } = await supabase.from("weight_import_identifier_mappings").upsert(uniqueMappings, {
    onConflict: "farm_id,external_identifier",
    ignoreDuplicates: false,
  });

  if (mappingUpsertError) throw new Error(`Error guardando mappings: ${mappingUpsertError.message}`);

  const chunk = 200;
  let imported = 0;

  for (let i = 0; i < weightsPayload.length; i += chunk) {
    const part = weightsPayload.slice(i, i + chunk);
    const { error } = await supabase.from("animal_weights").upsert(part, {
      onConflict: "farm_id,source_row_hash",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Error importando pesos en bloque ${i / chunk + 1}: ${error.message}`);
    }

    imported += part.length;
  }

  console.log(`Importación de pesaje mensual completada. Filas procesadas: ${imported}`);
  if (unresolved.length) {
    console.log(`Identificadores sin match (${[...new Set(unresolved)].length}): ${[...new Set(unresolved)].join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
