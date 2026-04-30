"use client";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { Meal } from "@/lib/types";
import { cn } from "@/lib/cn";

type Props = {
  meal: Meal;
  onDelete?: (id: string) => void;
};

const confColor: Record<Meal["confidence"], string> = {
  low: "bg-bad/10 text-bad",
  medium: "bg-warn/15 text-warn",
  high: "bg-good/15 text-good",
};

export default function MealCard({ meal, onDelete }: Props) {
  const t = meal.loggedAt?.toDate?.();
  const time = t
    ? t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";
  return (
    <article className="flex gap-3 bg-surface rounded-card border border-line p-3 items-center">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-line shrink-0">
        {meal.imageUrl ? (
          <Image
            src={meal.imageUrl}
            alt={meal.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{meal.name}</h3>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold",
              confColor[meal.confidence]
            )}
          >
            {meal.confidence}
          </span>
        </div>
        <div className="flex gap-3 text-xs text-ink-soft mt-1 tabular-nums">
          <span className="font-display font-bold text-base text-ink">
            {meal.calories}
            <span className="text-xs text-ink-soft font-medium ml-0.5">kcal</span>
          </span>
          <span>P {meal.protein}g</span>
          <span>C {meal.carbs}g</span>
          <span>F {meal.fat}g</span>
        </div>
        <div className="text-[11px] text-ink-soft mt-0.5">{time}</div>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(meal.id)}
          aria-label={`Delete ${meal.name}`}
          className="shrink-0 min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-ink-soft hover:text-bad hover:bg-bad/10 active:scale-95 transition cursor-pointer"
        >
          <Trash2 size={18} />
        </button>
      )}
    </article>
  );
}
