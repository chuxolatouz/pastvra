"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { weighed_at: string; weight_kg: number; projected?: number | null };

export function WeightChart({ points }: { points: Point[] }) {
  return (
    <div className="h-80 w-full rounded-xl bg-slate-50 p-3">
      <ResponsiveContainer>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="weighed_at" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="weight_kg" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="projected" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
