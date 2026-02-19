import type { InventoryMovement } from "@/lib/db/types";

export type InventoryLedgerRow = InventoryMovement & {
  effective_opening_balance: number;
  closing_balance: number;
};

export type InventoryTotals = {
  purchases_qty: number;
  sales_qty: number;
  transfers_qty: number;
  net_delta_qty: number;
  sales_usd: number;
  purchases_usd: number;
  transfers_usd: number;
  freight_usd: number;
  commission_usd: number;
  total_acquisition_usd: number;
  closing_balance: number;
};

function safe(n: number | null | undefined) {
  return Number(n ?? 0);
}

export function buildInventoryLedger(rows: InventoryMovement[]) {
  const ordered = [...rows].sort((a, b) => {
    const byDate = a.movement_date.localeCompare(b.movement_date);
    if (byDate !== 0) return byDate;
    return a.created_at.localeCompare(b.created_at);
  });

  let previousClosing = 0;
  const ledger: InventoryLedgerRow[] = ordered.map((row) => {
    const opening = row.opening_balance ?? previousClosing;
    const closing = opening + safe(row.purchases_qty) - safe(row.sales_qty) - safe(row.transfers_qty);
    previousClosing = closing;

    return {
      ...row,
      effective_opening_balance: opening,
      closing_balance: closing,
    };
  });

  const totals = ledger.reduce<InventoryTotals>(
    (acc, row) => {
      acc.purchases_qty += safe(row.purchases_qty);
      acc.sales_qty += safe(row.sales_qty);
      acc.transfers_qty += safe(row.transfers_qty);
      acc.net_delta_qty += safe(row.net_delta_qty);
      acc.sales_usd += safe(row.sales_usd);
      acc.purchases_usd += safe(row.purchases_usd);
      acc.transfers_usd += safe(row.transfers_usd);
      acc.freight_usd += safe(row.freight_usd);
      acc.commission_usd += safe(row.commission_usd);
      acc.total_acquisition_usd += safe(row.total_acquisition_usd);
      acc.closing_balance = row.closing_balance;
      return acc;
    },
    {
      purchases_qty: 0,
      sales_qty: 0,
      transfers_qty: 0,
      net_delta_qty: 0,
      sales_usd: 0,
      purchases_usd: 0,
      transfers_usd: 0,
      freight_usd: 0,
      commission_usd: 0,
      total_acquisition_usd: 0,
      closing_balance: 0,
    },
  );

  return { ledger, totals };
}

export function money(v: number) {
  return `$${v.toFixed(2)}`;
}
