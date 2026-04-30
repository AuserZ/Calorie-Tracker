import { verdict, verdictColor, verdictLabel } from "@/lib/calories";
import Card from "./ui/Card";
import { cn } from "@/lib/cn";

type Props = {
  eaten: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
};

function Ring({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1.5, pct));
  const dash = c * Math.min(1, clamped);
  const overflow = clamped > 1;
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-32 h-32"
      role="img"
      aria-label={`${Math.round(pct * 100)} percent of daily target`}
    >
      <circle cx="60" cy="60" r={r} stroke="#e2e8f0" strokeWidth="10" fill="none" />
      <circle
        cx="60"
        cy="60"
        r={r}
        stroke={overflow ? "#ef4444" : "#2563eb"}
        strokeWidth="10"
        fill="none"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

export default function DailySummary({ eaten, target, protein, carbs, fat }: Props) {
  const v = verdict(eaten, target);
  const pctRaw = target > 0 ? eaten / target : 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Ring pct={pctRaw} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-2xl tabular-nums">
              {Math.round(eaten)}
            </span>
            <span className="text-xs text-ink-soft uppercase tracking-wide">
              / {target} kcal
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-2xl">Today</h2>
          <span
            className={cn(
              "inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
              verdictColor(v)
            )}
          >
            {verdictLabel(v, eaten, target)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Protein", value: protein, color: "bg-primary" },
          { label: "Carbs", value: carbs, color: "bg-cta" },
          { label: "Fat", value: fat, color: "bg-good" },
        ].map((m) => (
          <div key={m.label} className="bg-bg rounded-lg p-2">
            <div className="font-display font-bold text-lg tabular-nums">
              {Math.round(m.value)}<span className="text-xs text-ink-soft">g</span>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-ink-soft">
              {m.label}
            </div>
            <div className={cn("h-1 rounded mt-1", m.color)} />
          </div>
        ))}
      </div>
    </Card>
  );
}
