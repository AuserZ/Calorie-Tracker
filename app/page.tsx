"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  isFirebaseConfigured,
  getProfile,
  saveProfile,
  subscribeMealsForDay,
  logMeal,
  deleteMeal,
  logWeight,
  getLatestWeight,
} from "@/lib/store";
import { dailyTarget, todayKey } from "@/lib/calories";
import type { Meal, Profile } from "@/lib/types";
import DailySummary from "@/components/DailySummary";
import MealCard from "@/components/MealCard";
import FoodCapture from "@/components/FoodCapture";
import ProfileSetup from "@/components/ProfileSetup";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import Button from "@/components/ui/Button";

export default function TodayPage() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const [p, w] = await Promise.all([getProfile(), getLatestWeight()]);
      setProfile(p);
      setLatestWeight(w);
      unsub = subscribeMealsForDay(todayKey(), setMeals);
      setReady(true);
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;
  if (!ready) {
    return (
      <div className="p-4 text-center text-ink-soft text-sm pt-12">Loading…</div>
    );
  }

  if (!profile || latestWeight == null) {
    return (
      <div className="p-4 pt-8">
        <ProfileSetup
          initial={profile ?? undefined}
          initialWeightKg={latestWeight ?? undefined}
          onSave={async (p, kg) => {
            await saveProfile(p);
            await logWeight(kg);
            setProfile(p);
            setLatestWeight(kg);
          }}
        />
      </div>
    );
  }

  const target = dailyTarget(profile, latestWeight);
  const totals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + m.calories,
      p: acc.p + m.protein,
      c: acc.c + m.carbs,
      f: acc.f + m.fat,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <DailySummary
        eaten={totals.cal}
        target={target}
        protein={totals.p}
        carbs={totals.c}
        fat={totals.f}
      />

      <Button
        variant="cta"
        block
        onClick={() => setCaptureOpen(true)}
        className="text-base h-14"
      >
        <Plus size={20} /> Log a meal
      </Button>

      <section className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-lg uppercase tracking-wide">
          Meals today
        </h3>
        {meals.length === 0 ? (
          <div className="text-center text-ink-soft py-8 text-sm bg-surface border border-line rounded-card">
            Nothing logged yet. Snap your first meal!
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {meals.map((m) => (
              <li key={m.id}>
                <MealCard meal={m} onDelete={deleteMeal} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <FoodCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onLogged={async (result, notes) => {
          await logMeal({
            name: result.name,
            calories: result.calories,
            protein: result.protein_g,
            carbs: result.carbs_g,
            fat: result.fat_g,
            imageUrl: result.imageUrl,
            confidence: result.confidence,
            notes: notes || undefined,
          });
        }}
      />
    </div>
  );
}
