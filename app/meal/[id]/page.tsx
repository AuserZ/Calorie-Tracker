"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, Sparkles, Calendar, Clock } from "lucide-react";
import {
  isFirebaseConfigured,
  subscribeMeal,
  deleteMeal,
} from "@/lib/store";
import type { Meal } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import { cn } from "@/lib/cn";

const confColor: Record<Meal["confidence"], string> = {
  low: "bg-bad/10 text-bad",
  medium: "bg-warn/15 text-warn",
  high: "bg-good/15 text-good",
};

const macroBlock = [
  { key: "calories" as const, label: "kcal", color: "bg-primary", big: true },
  { key: "protein" as const, label: "Protein", color: "bg-primary", unit: "g" },
  { key: "carbs" as const, label: "Carbs", color: "bg-cta", unit: "g" },
  { key: "fat" as const, label: "Fat", color: "bg-good", unit: "g" },
];

export default function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null | undefined>(undefined); // undefined = loading
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeMeal(id, (m) => setMeal(m));
  }, [id]);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;

  if (meal === undefined) {
    return (
      <div className="p-4 text-center text-ink-soft text-sm pt-12">Loading…</div>
    );
  }

  if (meal === null) {
    return (
      <div className="p-4 max-w-2xl mx-auto pt-8">
        <BackBar />
        <Card className="text-center py-10">
          <p className="font-semibold mb-1">Meal not found</p>
          <p className="text-sm text-ink-soft">It may have been deleted.</p>
        </Card>
      </div>
    );
  }

  const t = meal.loggedAt?.toDate?.();
  const time = t
    ? t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "—";

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMeal(id);
      router.replace("/");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <BackBar />

      <Card className="p-0 overflow-hidden">
        <div className="relative aspect-square w-full bg-line">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
              priority
            />
          ) : null}
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <h1 className="font-display font-bold text-2xl flex-1 leading-tight">
              {meal.name}
            </h1>
            <span
              className={cn(
                "shrink-0 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide",
                confColor[meal.confidence]
              )}
              title="AI confidence in identification + portion"
            >
              <Sparkles size={10} className="inline mr-1 -mt-0.5" />
              {meal.confidence}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} aria-hidden /> {meal.dateKey}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden /> {time}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2">
            {macroBlock.map((m) => {
              const v = meal[m.key];
              return (
                <div key={m.key} className="bg-bg rounded-lg p-2 text-center">
                  <div
                    className={cn(
                      "font-display font-bold tabular-nums",
                      m.big ? "text-3xl" : "text-xl"
                    )}
                  >
                    {v}
                    {m.unit && (
                      <span className="text-xs text-ink-soft font-medium">
                        {m.unit}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-soft">
                    {m.label}
                  </div>
                  <div className={cn("h-1 rounded mt-1", m.color)} />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {meal.notes && (
        <Card>
          <h2 className="font-display font-bold uppercase tracking-wide text-sm text-ink-soft mb-1">
            Your notes
          </h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {meal.notes}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="font-display font-bold uppercase tracking-wide text-sm text-ink-soft mb-2">
          Raw data
        </h2>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-ink-soft">Meal ID</dt>
          <dd className="font-mono text-xs break-all">{meal.id}</dd>
          <dt className="text-ink-soft">Date key</dt>
          <dd className="font-mono text-xs">{meal.dateKey}</dd>
          <dt className="text-ink-soft">Confidence</dt>
          <dd className="font-semibold">{meal.confidence}</dd>
          <dt className="text-ink-soft">Calories</dt>
          <dd className="tabular-nums">{meal.calories} kcal</dd>
          <dt className="text-ink-soft">Protein</dt>
          <dd className="tabular-nums">{meal.protein} g</dd>
          <dt className="text-ink-soft">Carbs</dt>
          <dd className="tabular-nums">{meal.carbs} g</dd>
          <dt className="text-ink-soft">Fat</dt>
          <dd className="tabular-nums">{meal.fat} g</dd>
        </dl>
      </Card>

      {!confirming ? (
        <Button
          variant="ghost"
          onClick={() => setConfirming(true)}
          className="text-bad hover:bg-bad/10"
        >
          <Trash2 size={16} /> Delete this meal
        </Button>
      ) : (
        <Card className="bg-bad/5 border-bad/30">
          <p className="text-sm font-semibold mb-1">Delete this meal?</p>
          <p className="text-xs text-ink-soft mb-3">
            The image file is also removed from disk on next cleanup. This can&apos;t
            be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              block
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              block
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function BackBar() {
  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink min-h-11 px-2 -ml-2 rounded-lg hover:bg-line/40 transition"
      >
        <ArrowLeft size={16} /> Back
      </Link>
    </div>
  );
}
