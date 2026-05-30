"use client";
import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  isFirebaseConfigured,
  subscribeMeal,
  deleteMeal,
  getAllMeals,
} from "@/lib/store";
import type { Meal } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import { useCountUp } from "@/lib/useCountUp";

const confColors: Record<
  Meal["confidence"],
  { bg: string; fg: string }
> = {
  high: { bg: "rgba(31,179,107,.12)", fg: "#0F8F4D" },
  medium: { bg: "rgba(242,163,58,.18)", fg: "#A36514" },
  low: { bg: "rgba(230,70,70,.12)", fg: "#A82828" },
};

const macroInfo = [
  { key: "protein" as const, label: "Protein", color: "var(--color-blue)" },
  { key: "carbs" as const, label: "Carbs", color: "var(--color-tang)" },
  { key: "fat" as const, label: "Fat", color: "#7BB12A" },
];

function CountUpDisplay({ to }: { to: number }) {
  const v = useCountUp(to, { duration: 900 });
  return <>{Math.round(v)}</>;
}

export default function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [similar, setSimilar] = useState<Meal[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeMeal(id, (m) => setMeal(m));
  }, [id]);

  useEffect(() => {
    if (!meal || !isFirebaseConfigured) return;
    getAllMeals()
      .then((all) => {
        const same = all.filter(
          (m) =>
            m.id !== meal.id &&
            (m.name.toLowerCase().includes(meal.name.toLowerCase().split(" ")[0]) ||
              Math.abs(m.calories - meal.calories) < meal.calories * 0.3)
        );
        setSimilar(same.slice(0, 6));
      })
      .catch(() => {});
  }, [meal]);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;

  if (meal === undefined) {
    return (
      <div className="p-4 text-center text-ink-soft text-sm pt-12">
        Loading…
      </div>
    );
  }

  if (meal === null) {
    return (
      <div className="p-4 max-w-2xl mx-auto pt-8 md:ml-60">
        <BackButton />
        <Card className="text-center py-10 mt-4">
          <p className="font-semibold mb-1">Meal not found</p>
          <p className="text-sm text-ink-soft">
            It may have been deleted.
          </p>
        </Card>
      </div>
    );
  }

  const t = meal.loggedAt?.toDate?.();
  const time = t
    ? t.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
  const c = confColors[meal.confidence] ?? confColors.medium;
  const totalMacro = meal.protein + meal.carbs + meal.fat || 1;

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
    <div
      className="relative min-h-full md:ml-60"
      style={{ animation: "fadeIn .3s" }}
    >
      {/* Hero image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "1/1" }}
      >
        {meal.imageUrl ? (
          <Image
            src={meal.imageUrl}
            alt={meal.name}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
            style={{ animation: "kenburns 8s ease-in-out infinite alternate" }}
            unoptimized
            priority
          />
        ) : (
          <div className="w-full h-full bg-cream-2 flex items-center justify-center text-6xl">
            🍽
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,246,230,.18) 0%, transparent 30%, transparent 60%, var(--color-cream) 100%)",
          }}
        />

        {/* Back button */}
        <BackButton floating />

        {/* Badges */}
        <div className="absolute top-3.5 right-3.5 flex gap-1.5">
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-bold tracking-[.04em]"
            style={{
              background: "rgba(255,253,248,.92)",
              backdropFilter: "blur(10px)",
              color: c.fg,
            }}
          >
            ✦ {meal.confidence} match
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="relative px-5 pb-8"
        style={{ marginTop: -30 }}
      >
        <h1
          className="serif m-0 text-ink leading-[1.05]"
          style={{ fontSize: 38, letterSpacing: "-0.02em" }}
        >
          {meal.name}
        </h1>
        <p className="text-[13px] text-ink-soft mt-1.5">
          {meal.dateKey} · {time}
        </p>

        {/* Calorie + macro panel */}
        <section
          className="mt-4 p-4 bg-surface rounded-[24px] border border-line"
          style={{ animation: "fadeUp .5s .1s both" }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="serif tnum"
              style={{
                fontSize: 64,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              <CountUpDisplay to={meal.calories} />
            </span>
            <span className="text-sm text-ink-soft">kcal</span>
            <span className="ml-auto text-[11px] tracking-[.1em] uppercase text-ink-soft font-bold">
              this meal
            </span>
          </div>

          {/* Macro split bar */}
          <div
            className="h-2.5 rounded-full mt-3.5 overflow-hidden flex"
            style={{ background: "rgba(21,20,15,.06)" }}
          >
            <div
              style={{
                flex: meal.protein,
                background:
                  "linear-gradient(90deg,var(--color-blue),var(--color-blue-2))",
                animation: "fadeUp .8s .2s both",
              }}
            />
            <div
              style={{
                flex: meal.carbs,
                background:
                  "linear-gradient(90deg,var(--color-tang),var(--color-tang-2))",
                animation: "fadeUp .8s .3s both",
              }}
            />
            <div
              style={{
                flex: meal.fat,
                background:
                  "linear-gradient(90deg,#7BB12A,var(--color-lime))",
                animation: "fadeUp .8s .4s both",
              }}
            />
          </div>

          {/* Macro numbers */}
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            {macroInfo.map((m) => (
              <div
                key={m.key}
                className="flex flex-col gap-0.5"
              >
                <span className="flex items-center gap-1.5 text-[10px] tracking-[.1em] uppercase text-ink-soft font-bold">
                  <span
                    className="rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: m.color,
                    }}
                  />
                  {m.label}
                </span>
                <span
                  className="serif tnum text-2xl leading-none"
                >
                  {meal[m.key]}
                  <span className="text-[11px] text-ink-soft ml-0.5">
                    g
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        {meal.notes && (
          <section
            className="mt-3.5 p-4 bg-surface rounded-[20px] border border-line"
            style={{ animation: "fadeUp .5s .2s both" }}
          >
            <div className="text-[10px] tracking-[.16em] uppercase text-ink-soft font-bold mb-1.5">
              Your note
            </div>
            <p
              className="m-0 text-[13px] leading-relaxed text-ink-2"
              style={{ fontStyle: "italic" }}
            >
              &ldquo;{meal.notes}&rdquo;
            </p>
          </section>
        )}

        {/* Similar meals */}
        {similar.length > 0 && (
          <section className="mt-5">
            <h2 className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-bold mb-3">
              Similar meals
            </h2>
            <div
              ref={scrollRef}
              className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 scroll-hide"
            >
              {similar.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/meal/${m.id}`}
                  className="shrink-0 w-[110px] flex flex-col gap-1.5"
                  style={{ animation: `fadeIn .4s ${i * 0.07}s both` }}
                >
                  <div
                    className="relative overflow-hidden rounded-2xl bg-cream-2"
                    style={{ aspectRatio: "1/1" }}
                  >
                    {m.imageUrl ? (
                      <Image
                        src={m.imageUrl}
                        alt={m.name}
                        fill
                        sizes="110px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍽
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-ink leading-tight line-clamp-2">
                    {m.name}
                  </p>
                  <p className="serif tnum text-[12px] text-ink-soft">
                    {m.calories}
                    <span className="text-[10px] ml-0.5">kcal</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Delete */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 p-3.5 w-full bg-transparent border border-line rounded-2xl text-bad font-semibold cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-bad/5 transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Delete this meal
          </button>
        ) : (
          <div
            className="mt-4 p-4 rounded-[18px] border"
            style={{
              background: "rgba(230,70,70,.06)",
              borderColor: "rgba(230,70,70,.2)",
              animation: "scaleIn .25s",
            }}
          >
            <div className="font-semibold mb-1.5">
              Delete this meal?
            </div>
            <div className="text-xs text-ink-soft mb-2.5">
              This can&apos;t be undone.
            </div>
            <div className="flex gap-2">
              <Button
                variant="soft"
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
          </div>
        )}
      </div>
    </div>
  );
}

function BackButton({ floating }: { floating?: boolean }) {
  if (floating) {
    return (
      <Link
        href="/"
        aria-label="Back"
        className="absolute z-10 top-3.5 left-3.5 w-[42px] h-[42px] rounded-full border border-line flex items-center justify-center text-ink cursor-pointer"
        style={{
          background: "rgba(255,253,248,.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    );
  }

  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink min-h-11 px-2 -ml-2 rounded-xl hover:bg-ink/5 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </Link>
    </div>
  );
}
