"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { WeightEntry } from "@/lib/types";

type Props = { entries: WeightEntry[] };

export default function WeightChart({ entries }: Props) {
  const data = [...entries]
    .sort(
      (a, b) =>
        a.loggedAt.toMillis?.() - b.loggedAt.toMillis?.() ||
        a.dateKey.localeCompare(b.dateKey)
    )
    .map((e) => ({
      date: e.dateKey.slice(5),
      kg: e.kg,
    }));

  if (data.length === 0) {
    return (
      <div className="text-center text-ink-soft py-12 text-sm">
        No weight entries yet — log your first one above.
      </div>
    );
  }

  return (
    <div className="w-full h-64" aria-label="Weight trend chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#475569", fontSize: 11 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 1", "dataMax + 1"]}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#e2e8f0",
              fontSize: 12,
            }}
            formatter={(v) => [`${v} kg`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2563eb" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
