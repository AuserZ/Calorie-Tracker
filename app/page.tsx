"use client";
import { useEffect, useState } from "react";
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
import Wordmark from "@/components/Wordmark";

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
      <div className="p-4 text-center text-ink-soft text-sm pt-12">
        Loading…
      </div>
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

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative min-h-full md:ml-60">
      {/* Floating gradient blobs */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-60px",
          right: "-60px",
          width: 240,
          height: 240,
          background:
            "radial-gradient(circle, rgba(255,162,69,.45), transparent 65%)",
          filter: "blur(20px)",
          animation: "blob1 14s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "180px",
          left: "-80px",
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(46,91,255,.3), transparent 65%)",
          filter: "blur(20px)",
          animation: "blob2 18s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-3.5 pb-8 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between md:hidden">
          <Wordmark />
          <button
            className="w-10 h-10 rounded-full border border-line bg-surface inline-flex items-center justify-center cursor-pointer text-ink hover:bg-cream-2 transition"
            aria-label="Profile"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="9"
                r="3.2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5 19c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Greeting */}
        <header className="pt-1 pb-1">
          <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-semibold mb-1.5">
            {dayName} · {dateStr}
          </div>
          <h1
            className="serif m-0 text-ink leading-[.95]"
            style={{ fontSize: 42, letterSpacing: "-0.02em" }}
          >
            <span style={{ fontStyle: "italic", color: "var(--color-tang)" }}>
              Hi
            </span>{" "}
            {profile.name?.split(" ")[0] ?? "there"},
          </h1>
          <p className="text-[13px] text-ink-soft mt-2">
            Here&apos;s your bite of the day.
          </p>
        </header>

        {/* Ring + macros */}
        <DailySummary
          eaten={totals.cal}
          target={target}
          protein={totals.p}
          carbs={totals.c}
          fat={totals.f}
        />

        {/* Meals list */}
        <section
          style={{
            animation: "fadeUp .7s .25s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <div className="flex items-baseline justify-between mb-2.5">
            <h2
              className="serif m-0"
              style={{ fontSize: 26, letterSpacing: "-0.01em" }}
            >
              Today&apos;s plate{" "}
              <span
                className="text-ink-soft"
                style={{ fontStyle: "italic", fontSize: 18 }}
              >
                · {meals.length}
              </span>
            </h2>
            <button className="bg-transparent border-none text-ink-soft text-xs font-semibold tracking-[.06em] uppercase cursor-pointer">
              Sort
            </button>
          </div>

          {meals.length === 0 ? (
            <div
              className="p-8 text-center bg-surface rounded-[20px] border border-dashed border-line"
            >
              <div className="text-4xl mb-1.5">🥣</div>
              <div
                className="serif text-[22px]"
                style={{ fontStyle: "italic" }}
              >
                nothing logged yet
              </div>
              <div className="text-[13px] text-ink-soft mt-1">
                Snap your first meal of the day.
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {meals.map((m, i) => (
                <li
                  key={m.id}
                  style={{
                    animation: `fadeUp .6s ${
                      0.3 + i * 0.08
                    }s cubic-bezier(.2,.8,.2,1) both`,
                  }}
                >
                  <MealCard meal={m} onDelete={deleteMeal} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Floating action button */}
      <button
        onClick={() => setCaptureOpen(true)}
        aria-label="Log a meal"
        className="hidden md:flex fixed z-[4] cursor-pointer border-none text-cream items-center justify-center"
        style={{
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          width: 64,
          height: 64,
          borderRadius: 9999,
          background: "linear-gradient(135deg, var(--color-ink) 30%, #2a2a2a)",
          boxShadow:
            "0 12px 28px rgba(255,106,26,.45), 0 1px 0 rgba(255,255,255,.15) inset",
          animation: "float 3.4s ease-in-out infinite",
        }}
      >
        {/* Conic gradient border */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: -2,
            background:
              "conic-gradient(from 0deg, var(--color-tang), var(--color-lime), var(--color-blue), var(--color-tang))",
            animation: "spinSlow 6s linear infinite",
            zIndex: -1,
            opacity: 0.85,
            filter: "blur(2px)",
          }}
        />
        <span
          aria-hidden
          className="absolute rounded-full bg-ink"
          style={{ inset: 2, zIndex: -1 }}
        />
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
        >
          <rect
            x="3"
            y="6.5"
            width="18"
            height="13"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 6.5l1.5-2h5L16 6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="13"
            r="3.4"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M12 11v4M10 13h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

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
