import type { ActivityLevel, Goal, Profile, Verdict } from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function bmr(profile: Profile, weightKg: number): number {
  const base =
    10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === "male" ? base + 5 : base - 161;
}

export function tdee(profile: Profile, weightKg: number): number {
  return bmr(profile, weightKg) * ACTIVITY_MULTIPLIER[profile.activityLevel];
}

export function dailyTarget(profile: Profile, weightKg: number): number {
  if (profile.dailyTargetOverride) return profile.dailyTargetOverride;
  return Math.round(tdee(profile, weightKg) + GOAL_DELTA[profile.goal]);
}

export function verdict(eaten: number, target: number): Verdict {
  if (target <= 0) return "on-track";
  const ratio = eaten / target;
  if (ratio < 0.85) return "under";
  if (ratio <= 1.05) return "on-track";
  if (ratio <= 1.2) return "over";
  return "way-over";
}

export function verdictLabel(v: Verdict, eaten: number, target: number): string {
  const diff = Math.round(eaten - target);
  switch (v) {
    case "under":
      return `${Math.abs(diff)} kcal under target`;
    case "on-track":
      return "On track";
    case "over":
      return `${diff} kcal over`;
    case "way-over":
      return `Way over (+${diff} kcal)`;
  }
}

export function verdictColor(v: Verdict): string {
  switch (v) {
    case "under":
      return "bg-warn/15 text-warn";
    case "on-track":
      return "bg-good/15 text-good";
    case "over":
      return "bg-warn/20 text-warn";
    case "way-over":
      return "bg-bad/15 text-bad";
  }
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
