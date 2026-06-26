"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

type DayBucket = { dateKey: string; meals: unknown[]; total: number };

type Props = {
  days: DayBucket[];
  target: number;
};

export default function CaloriesChart({ days, target }: Props) {
  const chartData = [...days]
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-14)
    .map((d) => ({
      date: d.dateKey.slice(5),
      calories: d.total,
    }));

  if (chartData.length < 2) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {chartData.map((d) => (
          <div key={d.date} className="flex items-center gap-3 text-[13px]">
            <span className="tnum text-ink-soft w-12">{d.date}</span>
            <div className="flex-1 h-1.5 bg-blue/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue to-blue-2"
                style={{ width: `${Math.min(100, (d.calories / target) * 100)}%` }}
              />
            </div>
            <span className="tnum text-ink font-semibold">{d.calories}</span>
          </div>
        ))}
        {target > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-px border-t border-dashed border-ink-soft" />
            <span className="text-[10px] text-ink-soft">Target: {target} kcal</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(21,20,15,0.07)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "var(--font-body)",
              boxShadow: "0 4px 16px -4px rgba(21,20,15,0.2)",
            }}
            labelStyle={{ color: "var(--color-ink-soft)", fontSize: 11 }}
            itemStyle={{ color: "var(--color-ink)", fontWeight: 600 }}
            formatter={(value) => [`${value} kcal`, "Eaten"]}
          />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke="var(--color-tang)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              label={{
                value: String(target),
                position: "insideTopRight",
                fontSize: 9,
                fill: "var(--color-tang)",
                fontFamily: "var(--font-body)",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="calories"
            stroke="var(--color-blue)"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "var(--color-blue)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--color-tang)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
