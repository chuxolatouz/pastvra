import { differenceInCalendarDays, format, parseISO } from "date-fns";

export type WeightPoint = { weighed_at: string; weight_kg: number };

export function calculateAdg(previous: WeightPoint | null, current: WeightPoint) {
  if (!previous) return null;
  const days = Math.max(differenceInCalendarDays(parseISO(current.weighed_at), parseISO(previous.weighed_at)), 1);
  return (current.weight_kg - previous.weight_kg) / days;
}

export function monthlyAverages(points: WeightPoint[]) {
  const grouped = new Map<string, number[]>();
  points.forEach((p) => {
    const key = format(parseISO(p.weighed_at), "yyyy-MM");
    grouped.set(key, [...(grouped.get(key) ?? []), p.weight_kg]);
  });

  return [...grouped.entries()].map(([month, values]) => ({
    month,
    avg: values.reduce((sum, v) => sum + v, 0) / values.length,
  }));
}

export function project30Days(points: WeightPoint[], lookback = 5) {
  if (points.length < 2) return null;
  const recent = points.slice(-lookback);
  const baseDate = parseISO(recent[0].weighed_at).getTime();

  const xs = recent.map((p) => (parseISO(p.weighed_at).getTime() - baseDate) / (1000 * 60 * 60 * 24));
  const ys = recent.map((p) => p.weight_kg);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const lastX = xs[xs.length - 1];
  const projectedX = lastX + 30;

  return {
    slope,
    projectedWeight: intercept + slope * projectedX,
  };
}

export function buildTags(params: {
  previous: WeightPoint | null;
  current: WeightPoint;
  lowGainThreshold: number;
  overdueDays: number;
}) {
  const tags: string[] = [];
  const adg = calculateAdg(params.previous, params.current);

  if (params.previous && params.current.weight_kg < params.previous.weight_kg) tags.push("weight_loss");
  if (adg !== null && adg < params.lowGainThreshold) tags.push("low_gain");
  if (
    params.previous &&
    differenceInCalendarDays(parseISO(params.current.weighed_at), parseISO(params.previous.weighed_at)) >
      params.overdueDays
  ) {
    tags.push("overdue");
  }

  return tags;
}
