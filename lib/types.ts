import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain";
export type Confidence = "low" | "medium" | "high";
export type Verdict = "under" | "on-track" | "over" | "way-over";

export type Profile = {
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyTargetOverride?: number;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  confidence: Confidence;
  loggedAt: Timestamp;
  dateKey: string;
  /** Original portion/preparation notes the user typed when logging. */
  notes?: string;
};

export type WeightEntry = {
  id: string;
  kg: number;
  loggedAt: Timestamp;
  dateKey: string;
};

export type AnalysisResult =
  | {
      ok: true;
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      confidence: Confidence;
      imageUrl: string;
    }
  | { ok: false; error: "not_food" | "parse_failed" | "api_error" | "bad_request"; message?: string };
