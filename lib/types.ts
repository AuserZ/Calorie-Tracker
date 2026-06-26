import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain";
export type Confidence = "low" | "medium" | "high";
export type Verdict = "under" | "on-track" | "over" | "way-over";

export type Profile = {
  name: string;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyTargetOverride?: number;
};

/** A single detected food item inside a meal photo. */
export type AnalysisFoodItem = {
  /** Stable id assigned client-side after the LLM returns. */
  uid?: string;
  name: string;
  food_key?: string;
  portion_grams: number;
  portion_label?: string;
  cooking_method?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: Confidence;
  /** When confidence is low, alternative identifications to present as a picker. */
  alternatives?: { name: string; food_key?: string }[];
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
  /** Breakdown of items in this meal (post-aggregation). */
  items?: AnalysisFoodItem[];
};

export type WeightEntry = {
  id: string;
  kg: number;
  loggedAt: Timestamp;
  dateKey: string;
};

export type WaterEntry = {
  id: string;
  ml: number;
  loggedAt: Timestamp;
  dateKey: string;
};

export type AnalysisResult =
  | {
      ok: true;
      items: AnalysisFoodItem[];
      imageUrl: string;
    }
  | { ok: false; error: "not_food" | "parse_failed" | "api_error" | "bad_request"; message?: string };
