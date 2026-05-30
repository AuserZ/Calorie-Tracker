"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Meal } from "@/lib/types";
import { cn } from "@/lib/cn";

type Props = {
  meal: Meal;
  onDelete?: (id: string) => void;
};

const confColors: Record<
  Meal["confidence"],
  { bg: string; fg: string }
> = {
  high: { bg: "rgba(31,179,107,.12)", fg: "#0F8F4D" },
  medium: { bg: "rgba(242,163,58,.18)", fg: "#A36514" },
  low: { bg: "rgba(230,70,70,.12)", fg: "#A82828" },
};

export default function MealCard({ meal, onDelete }: Props) {
  const [hover, setHover] = useState(false);
  const c = confColors[meal.confidence] ?? confColors.medium;
  const t = meal.loggedAt?.toDate?.();
  const time = t
    ? t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex items-center gap-3.5 p-2.5 bg-surface rounded-[20px] border border-line cursor-pointer overflow-hidden"
      style={{
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover
          ? "0 14px 30px -12px rgba(21,20,15,.22)"
          : "0 4px 14px -10px rgba(21,20,15,.15)",
        transition:
          "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s",
      }}
    >
      <Link
        href={`/meal/${meal.id}`}
        className="flex flex-1 min-w-0 gap-3.5 items-center"
      >
        {/* Image thumbnail */}
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-cream-2 shrink-0">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              sizes="64px"
              className="object-cover"
              style={{
                transform: hover ? "scale(1.08)" : "scale(1)",
                transition: "transform .5s cubic-bezier(.2,.8,.2,1)",
              }}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🍽
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[15px] text-ink truncate">
              {meal.name}
            </h3>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-[.06em] uppercase shrink-0"
              style={{ background: c.bg, color: c.fg }}
            >
              {meal.confidence}
            </span>
          </div>
          <div className="flex items-baseline gap-3.5 mt-1.5 text-[11px] text-ink-soft">
            <span>
              <span
                className="serif tnum text-ink mr-0.5"
                style={{ fontSize: 20 }}
              >
                {meal.calories}
              </span>
              kcal
            </span>
            <span className="tnum">P {meal.protein}</span>
            <span className="tnum">C {meal.carbs}</span>
            <span className="tnum">F {meal.fat}</span>
          </div>
          {time && (
            <div className="text-[11px] text-ink-soft mt-0.5">{time}</div>
          )}
        </div>

        {/* Chevron */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="text-ink-soft shrink-0"
          style={{
            transform: hover ? "translateX(4px)" : "translateX(0)",
            transition: "transform .25s",
          }}
          aria-hidden
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      {/* Delete button (if provided) */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(meal.id);
          }}
          aria-label={`Delete ${meal.name}`}
          className="shrink-0 min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-ink-soft hover:text-bad hover:bg-bad/10 active:scale-95 transition cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </article>
  );
}
