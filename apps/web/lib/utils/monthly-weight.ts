import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import type { Animal, AnimalWeight } from "@/lib/db/types";

export const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export type MonthlyCell = {
  month: number;
  weight: number | null;
  gain: number | null;
  gmd: number | null;
  weighed_at: string | null;
};

export type MonthlyRow = {
  animal: Animal;
  cells: MonthlyCell[];
  totalAnnual: number | null;
  gmdAnnual: number | null;
  pendingCurrentMonth: boolean;
};

function weightForMonth(weights: AnimalWeight[], year: number, monthIndex: number) {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);

  const monthly = weights.filter((w) =>
    isWithinInterval(parseISO(w.weighed_at), {
      start,
      end,
    }),
  );

  if (!monthly.length) return null;

  const latest = [...monthly].sort((a, b) => b.weighed_at.localeCompare(a.weighed_at))[0];
  return {
    weight: Number(latest.weight_kg),
    weighed_at: latest.weighed_at,
  };
}

export function buildMonthlyMatrix({
  animals,
  weights,
  year,
}: {
  animals: Animal[];
  weights: AnimalWeight[];
  year: number;
}) {
  const byAnimal = new Map<string, AnimalWeight[]>();
  weights.forEach((w) => {
    byAnimal.set(w.animal_id, [...(byAnimal.get(w.animal_id) ?? []), w]);
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const rows: MonthlyRow[] = animals.map((animal) => {
    const animalWeights = byAnimal.get(animal.id) ?? [];
    const cells: MonthlyCell[] = [];

    for (let month = 0; month < 12; month += 1) {
      const current = weightForMonth(animalWeights, year, month);
      const previous = month > 0 ? weightForMonth(animalWeights, year, month - 1) : null;

      const gain = current && previous ? current.weight - previous.weight : null;
      const gmd = gain !== null ? gain / 30 : null;

      cells.push({
        month,
        weight: current?.weight ?? null,
        gain,
        gmd,
        weighed_at: current?.weighed_at ?? null,
      });
    }

    const ene = cells[0]?.weight;
    const dic = cells[11]?.weight;
    const totalAnnual = ene !== null && dic !== null ? dic - ene : null;
    const gmdAnnual = totalAnnual !== null ? totalAnnual / 365 : null;

    return {
      animal,
      cells,
      totalAnnual,
      gmdAnnual,
      pendingCurrentMonth: year === currentYear ? cells[currentMonth].weight === null : false,
    };
  });

  return rows;
}

export function defaultWeighedAtForMonth(year: number, month: number) {
  return format(endOfMonth(new Date(year, month, 1)), "yyyy-MM-dd");
}
