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

  if (!file || !farm || !user) {
    throw new Error("Uso: tsx scripts/import-inventario-xlsx.ts --file <xlsx> --farm <farm_id> --user <user_id>");
  }

  return { file, farm, user };
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return date.toISOString().slice(0, 10);
  }

  const maybe = new Date(String(value));
  if (Number.isNaN(maybe.getTime())) return null;
  return maybe.toISOString().slice(0, 10);
}

function hashRow(parts: unknown[]) {
  return crypto
    .createHash("sha256")
    .update(
      parts
        .map((p) => (p === null || p === undefined ? "" : String(p).trim().toLowerCase()))
        .join("|"),
    )
    .digest("hex");
}

async function main() {
  const { file, farm, user } = getArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");

  const supabase = createClient(url, key);

  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheetName = "Control de Inventario";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No se encontró la hoja '${sheetName}'`);

  const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const headerRowIndex = rows.findIndex((r) => String(r[1] ?? "").trim().toLowerCase() === "fecha");
  if (headerRowIndex < 0) throw new Error("No se detectó encabezado 'Fecha' en hoja de inventario");

  const dataRows = rows.slice(headerRowIndex + 1);
  const payload = dataRows
    .map((row) => {
      const movementDate = toIsoDate(row[1]);
      const purchasesQty = toNumber(row[4]);
      const salesQty = toNumber(row[5]);
      const transfersQty = toNumber(row[6]);
      const unitValueUsd = toNumber(row[8]);
      const purchasesUsd = (purchasesQty ?? 0) * (unitValueUsd ?? 0);
      const commissionUsd = toNumber(row[14]);
      const commissionRate = purchasesUsd > 0 && commissionUsd !== null ? commissionUsd / purchasesUsd : null;

      const hasMovement =
        movementDate !== null &&
        [purchasesQty, salesQty, transfersQty, unitValueUsd, toNumber(row[13]), toNumber(row[9])].some((v) => v !== null);

      if (!hasMovement) return null;

      const sourceRowHash = hashRow([
        farm,
        movementDate,
        row[2],
        row[16],
        row[17],
        purchasesQty,
        salesQty,
        transfersQty,
        unitValueUsd,
        row[13],
        commissionRate,
      ]);

      return {
        farm_id: farm,
        movement_date: movementDate,
        partner_name: row[2] ? String(row[2]) : null,
        opening_balance: toNumber(row[3]),
        purchases_qty: purchasesQty,
        sales_qty: salesQty,
        transfers_qty: transfersQty,
        unit_value_usd: unitValueUsd,
        observed_weight_kg: toNumber(row[9]),
        freight_usd: toNumber(row[13]),
        destination_name: row[16] ? String(row[16]) : null,
        category_name: row[17] ? String(row[17]) : null,
        price_per_kg: toNumber(row[18]),
        kg_negotiated: toNumber(row[19]),
        commission_rate: commissionRate,
        notes: "Importado desde Planilla 8",
        created_by: user,
        source: "xlsx_inventario_import",
        source_row_hash: sourceRowHash,
      };
    })
    .filter(Boolean);

  if (!payload.length) {
    console.log("No se encontraron filas de inventario para importar.");
    return;
  }

  const chunk = 200;
  let imported = 0;

  for (let i = 0; i < payload.length; i += chunk) {
    const part = payload.slice(i, i + chunk);
    const { error } = await supabase.from("inventory_movements").upsert(part, {
      onConflict: "farm_id,source_row_hash",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Error importando inventario en bloque ${i / chunk + 1}: ${error.message}`);
    }

    imported += part.length;
  }

  console.log(`Importación inventario completada. Filas procesadas: ${imported}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
