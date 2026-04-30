"use client";
import { useEffect, useMemo, useState } from "react";
import {
  isFirebaseConfigured,
  getAllMeals,
  getProfile,
  getLatestWeight,
} from "@/lib/store";
import type { Meal, Profile } from "@/lib/types";
import Card from "@/components/ui/Card";
import { dailyTarget, verdict, verdictColor, verdictLabel } from "@/lib/calories";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import { cn } from "@/lib/cn";

type DayBucket = { dateKey: string; meals: Meal[]; total: number };

export default function HistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    (async () => {
      const [m, p, w] = await Promise.all([
        getAllMeals(),
        getProfile(),
        getLatestWeight(),
      ]);
      setMeals(m);
      setProfile(p);
      setWeightKg(w);
      setLoading(false);
    })();
  }, []);

  const days = useMemo<DayBucket[]>(() => {
    const map = new Map<string, DayBucket>();
    for (const m of meals) {
      const b =
        map.get(m.dateKey) ??
        { dateKey: m.dateKey, meals: [], total: 0 };
      b.meals.push(m);
      b.total += m.calories;
      map.set(m.dateKey, b);
    }
    return [...map.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [meals]);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;
  if (loading)
    return (
      <div className="p-4 text-center text-ink-soft text-sm pt-12">Loading…</div>
    );

  const target = profile && weightKg ? dailyTarget(profile, weightKg) : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-3">
      <h2 className="font-display font-bold text-2xl">History</h2>
      {days.length === 0 ? (
        <Card>
          <p className="text-center text-ink-soft py-8 text-sm">
            No history yet. Log a meal on Today.
          </p>
        </Card>
      ) : (
        days.map((d) => {
          const v = target > 0 ? verdict(d.total, target) : "on-track";
          const isOpen = openDay === d.dateKey;
          return (
            <Card key={d.dateKey} className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : d.dateKey)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-bg active:scale-[0.997] transition"
                aria-expanded={isOpen}
              >
                <div className="flex flex-col">
                  <span className="font-display font-semibold uppercase tracking-wide">
                    {d.dateKey}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {d.meals.length} meal{d.meals.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-2xl tabular-nums">
                    {d.total}
                    <span className="text-xs text-ink-soft font-medium ml-1">
                      kcal
                    </span>
                  </span>
                  {target > 0 && (
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide",
                        verdictColor(v)
                      )}
                    >
                      {verdictLabel(v, d.total, target)}
                    </span>
                  )}
                </div>
              </button>
              {isOpen && (
                <ul className="border-t border-line divide-y divide-line">
                  {d.meals.map((m) => (
                    <li
                      key={m.id}
                      className="p-3 flex items-center justify-between text-sm"
                    >
                      <span className="truncate flex-1 mr-2">{m.name}</span>
                      <span className="tabular-nums font-semibold">
                        {m.calories} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
