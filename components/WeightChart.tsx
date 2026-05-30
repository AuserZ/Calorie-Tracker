"use client";
import type { WeightEntry } from "@/lib/types";

type Props = { entries: WeightEntry[] };

export default function WeightChart({ entries }: Props) {
  const data = [...entries]
    .sort(
      (a, b) =>
        (a.loggedAt?.toMillis?.() ?? 0) - (b.loggedAt?.toMillis?.() ?? 0) ||
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

  const W = 320;
  const H = 160;
  const P = 18;
  const n = data.length;

  const xs = data.map((_, i) => P + (W - P * 2) * (i / Math.max(1, n - 1)));
  const kgs = data.map((d) => d.kg);
  const kgMin = Math.min(...kgs) - 0.4;
  const kgMax = Math.max(...kgs) + 0.4;
  const range = kgMax - kgMin || 1;
  const ys = data.map((d) => H - P - (H - P * 2) * ((d.kg - kgMin) / range));

  const path = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`)
    .join(" ");
  const areaPath = `${path} L${xs[n - 1]},${H - P} L${xs[0]},${H - P} Z`;
  const totalLen = n * 30;

  const lastX = xs[n - 1];
  const lastY = ys[n - 1];

  return (
    <div className="w-full" aria-label="Weight trend chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="wAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-blue)"
              stopOpacity=".35"
            />
            <stop
              offset="100%"
              stopColor="var(--color-blue)"
              stopOpacity="0"
            />
          </linearGradient>
          <linearGradient id="wLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-blue)" />
            <stop offset="100%" stopColor="var(--color-tang)" />
          </linearGradient>
        </defs>

        {/* Grid baselines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={P}
            x2={W - P}
            y1={P + (H - P * 2) * p}
            y2={P + (H - P * 2) * p}
            stroke="rgba(21,20,15,.06)"
            strokeDasharray="3 4"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#wAreaGrad)"
          opacity="0"
          style={{ animation: "fadeIn 1.4s .6s forwards" }}
        />

        {/* Line (draw-in animation) */}
        <path
          d={path}
          fill="none"
          stroke="url(#wLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={totalLen}
          style={{
            animation: `drawLine 1.6s .2s cubic-bezier(.4,.1,.2,1) forwards`,
          }}
        />

        {/* Dots */}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r="3.2"
            fill="var(--color-cream)"
            stroke="var(--color-ink)"
            strokeWidth="1.6"
            opacity="0"
            style={{
              animation: `fadeIn .3s ${0.6 + i * 0.06}s forwards`,
            }}
          />
        ))}

        {/* End marker pulse */}
        <circle
          cx={lastX}
          cy={lastY}
          r="6"
          fill="none"
          stroke="var(--color-tang)"
          strokeWidth="1.5"
          opacity="0"
          style={{
            animation: `pulseRing 1.6s 1.6s infinite, fadeIn .3s 1.6s forwards`,
            transformOrigin: `${lastX}px ${lastY}px`,
          }}
        />

        {/* Last value annotation */}
        <g opacity="0" style={{ animation: "fadeUp .4s 1.6s forwards" }}>
          <rect
            x={lastX - 32}
            y={lastY - 30}
            width="56"
            height="20"
            rx="6"
            fill="var(--color-ink)"
          />
          <text
            x={lastX}
            y={lastY - 16}
            fontSize="11"
            fill="var(--color-cream)"
            fontWeight="600"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {data[n - 1].kg.toFixed(1)} kg
          </text>
        </g>
      </svg>
    </div>
  );
}
