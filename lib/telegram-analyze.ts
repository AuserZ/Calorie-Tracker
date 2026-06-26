// Telegram-side analyze pipeline:
// 1. Run analyzeFoodImage on each photo (same code path the web app uses).
// 2. Merge result arrays; dedupe overlapping items by food_key.
// 3. Recompute totals from the merged list.
// 4. Validate against local food DB for stable numbers.

import { AnalysisFoodItem } from "@/lib/types";
import { analyzeFoodImage } from "@/lib/gemini";
import { resolveFood } from "@/lib/foods";

export type MergedResult = {
  items: AnalysisFoodItem[];
  totalCal: number;
  totalP: number;
  totalC: number;
  totalF: number;
  /** First Gemini-side error encountered, if any. Surfaced to the user when no items were detected. */
  error?: string;
};

export async function analyzePhotos(
  photos: { bytes: Buffer; mimeType: string }[],
  notes: string
): Promise<MergedResult> {
  const allItems: AnalysisFoodItem[] = [];
  let firstError: string | undefined;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const result = await analyzeFoodImage(
      p.bytes.toString("base64"),
      p.mimeType,
      notes
    );
    if (!result.ok) {
      if (!firstError) firstError = result.message ?? result.error;
      console.warn(`[telegram-analyze] photo ${i + 1} failed:`, firstError);
      continue;
    }
    console.log(`[telegram-analyze] photo ${i + 1}: ${result.items.length} items detected`, JSON.stringify(result.items.map(x => ({ name: x.name, food_key: x.food_key, cal: x.calories }))));
    for (const item of result.items) {
      allItems.push({ ...item, uid: `${i}-${allItems.length}` });
    }
  }

  const merged = mergeItems(allItems);
  const validated = validateAgainstDB(merged);

  if (validated.length === 0 && firstError) {
    console.error("[telegram-analyze] no items detected, first Gemini error:", firstError);
  }

  return {
    items: validated,
    totalCal: validated.reduce((a, it) => a + it.calories, 0),
    totalP: validated.reduce((a, it) => a + it.protein_g, 0),
    totalC: validated.reduce((a, it) => a + it.carbs_g, 0),
    totalF: validated.reduce((a, it) => a + it.fat_g, 0),
    error: validated.length === 0 ? firstError : undefined,
  };
}

/** Merge duplicate items sharing the same food_key. Sums macros. */
export function mergeItems(items: AnalysisFoodItem[]): AnalysisFoodItem[] {
  const out: AnalysisFoodItem[] = [];
  for (const it of items) {
    const idx = out.findIndex(
      (o) => o.food_key && o.food_key === it.food_key
    );
    if (idx >= 0) {
      const prev = out[idx];
      out[idx] = {
        ...prev,
        calories: prev.calories + it.calories,
        protein_g: prev.protein_g + it.protein_g,
        carbs_g: prev.carbs_g + it.carbs_g,
        fat_g: prev.fat_g + it.fat_g,
        portion_grams: (prev.portion_grams ?? 0) + (it.portion_grams ?? 0),
        confidence: worseConfidence(prev.confidence, it.confidence),
      };
    } else {
      out.push(it);
    }
  }
  return out;
}

function worseConfidence(
  a: "low" | "medium" | "high",
  b: "low" | "medium" | "high"
): "low" | "medium" | "high" {
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return rank[a] <= rank[b] ? a : b;
}

/** Re-resolve food_key items against the local DB for stable numbers. */
export function validateAgainstDB(items: AnalysisFoodItem[]): AnalysisFoodItem[] {
  return items.map((it) => {
    if (it.food_key) {
      const r = resolveFood(it.food_key, it.portion_grams);
      if (r) {
        return {
          ...it,
          calories: r.calories,
          protein_g: r.protein_g,
          carbs_g: r.carbs_g,
          fat_g: r.fat_g,
        };
      }
    }
    return it;
  });
}
