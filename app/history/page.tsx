"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  isFirebaseConfigured,
  getAllMeals,
  getProfile,
  getLatestWeight,
} from "@/lib/store";
import type { Meal, Profile } from "@/lib/types";
import { dailyTarget, verdict } from "@/lib/calories";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import Wordmark from "@/components/Wordmark";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/cn";

type DayBucket = { dateKey: string; meals: Meal[]; total: number };

function CountUpDisplay({
  to,
  digits = 0,
}: {
  to: number;
  digits?: number;
}) {
  const v = useCountUp(to, { duration: 1200 });
  return <>{v.toFixed(digits)}</>;
}

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
    return [...map.values()].sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey)
    );
  }, [meals]);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;
  if (loading)
    return (
      <div className="p-4 text-center text-ink-soft text-sm pt-12">
        Loading…
      </div>
    );

  const target =
    profile && weightKg ? dailyTarget(profile, weightKg) : 0;
  const avg =
    days.length > 0
      ? Math.round(
          days.reduce((a, d) => a + d.total, 0) / days.length
        )
      : 0;
  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="relative min-h-screen md:ml-60">
      <div className="relative max-w-2xl mx-auto px-4 pt-3.5 pb-8 flex flex-col gap-3.5">
        {/* Top bar */}
        <div className="flex items-center justify-between md:hidden">
          <Wordmark />
        </div>

        {/* Header */}
        <header className="pt-1">
          <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-semibold mb-1.5">
            Last {days.length} days
          </div>
          <h1
            className="serif m-0 text-ink leading-[.95]"
            style={{ fontSize: 42, letterSpacing: "-0.02em" }}
          >
            Your{" "}
            <em style={{ color: "var(--color-tang)" }}>rhythm</em>
          </h1>
          <p className="text-[13px] text-ink-soft mt-2">
            Patterns over plates.
          </p>
        </header>

        {/* Bar chart summary */}
        {days.length > 0 && (
          <section
            className="bg-surface rounded-[24px] border border-line p-4"
            style={{ animation: "fadeUp .5s both" }}
          >
            <div className="flex items-baseline justify-between mb-3.5">
              <div>
                <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-bold">
                  Avg / day
                </div>
                <div className="serif tnum text-4xl leading-none mt-1">
                  <CountUpDisplay to={avg} />
                  <span className="text-sm text-ink-soft ml-1">
                    kcal
                  </span>
                </div>
              </div>
              {target > 0 && (
                <div className="text-right">
                  <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-bold">
                    Target
                  </div>
                  <div className="tnum serif text-[22px] mt-1">
                    {target}
                  </div>
                </div>
              )}
            </div>

            {/* Bars */}
            <div
              className="grid gap-1.5 items-end"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  days.length,
                  7
                )}, 1fr)`,
                height: 120,
              }}
            >
              {[...days]
                .slice(0, 7)
                .reverse()
                .map((d, i) => {
                  const h = Math.max(8, (d.total / maxTotal) * 100);
                  const over = target > 0 && d.total > target;
                  const selected = openDay === d.dateKey;
                  return (
                    <button
                      key={d.dateKey}
                      onClick={() =>
                        setOpenDay(
                          selected ? null : d.dateKey
                        )
                      }
                      className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-0 h-full justify-end"
                    >
                      <span className="tnum text-[9px] text-ink-soft font-semibold">
                        {Math.round(d.total / 100)}
                        <sub className="text-[7px]">×100</sub>
                      </span>
                      <div
                        className="w-full rounded-lg"
                        style={{
                          height: `${h}%`,
                          background: selected
                            ? "linear-gradient(180deg,var(--color-tang),var(--color-tang-2))"
                            : over
                            ? "linear-gradient(180deg,#FFA245,#FFD08A)"
                            : "linear-gradient(180deg,var(--color-blue),var(--color-blue-2))",
                          opacity: selected ? 1 : 0.8,
                          animation: `barGrow .8s ${
                            i * 0.05
                          }s cubic-bezier(.2,.8,.2,1) both`,
                          transformOrigin: "bottom",
                          boxShadow: selected
                            ? "0 8px 16px -6px rgba(255,106,26,.5)"
                            : "none",
                        }}
                      />
                      <span
                        className="text-[10px] font-semibold"
                        style={{
                          color: selected
                            ? "var(--color-ink)"
                            : "var(--color-ink-soft)",
                        }}
                      >
                        {d.dateKey.slice(8)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {/* Day breakdown */}
        <section>
          {days.length === 0 ? (
            <div className="bg-surface rounded-[24px] border border-line p-8 text-center">
              <p className="text-ink-soft text-sm">
                No history yet. Log a meal on Today.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {days.map((d, i) => {
                const isOpen = openDay === d.dateKey;
                const v =
                  target > 0
                    ? verdict(d.total, target)
                    : "on-track";
                const vColor =
                  v === "on-track"
                    ? "#0F8F4D"
                    : v === "over" || v === "way-over"
                    ? "#A36514"
                    : "var(--color-ink-soft)";
                const vBg =
                  v === "on-track"
                    ? "rgba(31,179,107,.12)"
                    : v === "over" || v === "way-over"
                    ? "rgba(242,163,58,.18)"
                    : "rgba(21,20,15,.06)";
                const vText =
                  v === "on-track"
                    ? "On track"
                    : v === "over" || v === "way-over"
                    ? `+${d.total - target}`
                    : target > 0
                    ? `−${target - d.total}`
                    : "";

                return (
                  <li
                    key={d.dateKey}
                    style={{
                      animation: `fadeUp .5s ${
                        0.1 + i * 0.04
                      }s both`,
                    }}
                  >
                    <div
                      className={cn(
                        "bg-surface rounded-[18px] border border-line overflow-hidden transition-shadow",
                        isOpen &&
                          "shadow-[0_12px_28px_-16px_rgba(21,20,15,.25)]"
                      )}
                    >
                      <button
                        onClick={() =>
                          setOpenDay(
                            isOpen ? null : d.dateKey
                          )
                        }
                        className="w-full p-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
                        aria-expanded={isOpen}
                      >
                        <div className="flex-1">
                          <div
                            className="serif text-xl"
                            style={{
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {d.dateKey}
                          </div>
                          <div className="text-[11px] text-ink-soft">
                            {d.meals.length} meal
                            {d.meals.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="serif tnum text-2xl leading-none">
                            {d.total}
                            <span className="text-[11px] text-ink-soft ml-0.5">
                              kcal
                            </span>
                          </div>
                          {target > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[.04em] mt-1.5"
                              style={{
                                background: vBg,
                                color: vColor,
                              }}
                            >
                              {vText}
                            </span>
                          )}
                        </div>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-ink-soft"
                          style={{
                            transform: isOpen
                              ? "rotate(90deg)"
                              : "rotate(0)",
                            transition: "transform .25s",
                          }}
                        >
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div
                          className="px-4 pb-3.5 border-t border-line"
                          style={{
                            animation: "fadeUp .3s",
                          }}
                        >
                          <ul className="list-none p-0 mt-2.5 flex flex-col gap-1.5">
                            {d.meals.map((m) => (
                              <li key={m.id}>
                                <Link
                                  href={`/meal/${m.id}`}
                                  className="flex items-center gap-2.5 p-2 bg-cream rounded-xl cursor-pointer hover:bg-cream-2 transition"
                                >
                                  <span className="flex-1 text-[13px] truncate">
                                    {m.name}
                                  </span>
                                  <span className="tnum text-[13px] font-semibold">
                                    {m.calories}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
