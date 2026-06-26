import type { AnalysisFoodItem } from "./types";

// Per-100g nutrition for common Indonesian/Asian foods.
// LLM returns food_key when it recognizes a match. We resolve
// macros by multiplying by (portion_grams / 100).
// Only used for post-validation; LLM always estimates first.

export type FoodEntry = { name: string; cal: number; protein: number; carbs: number; fat: number };

const FOODS: Record<string, FoodEntry> = {
  rice:              { name: "Steamed white rice",           cal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  fried_rice:        { name: "Nasi goreng",                  cal: 165, protein: 5,   carbs: 22, fat: 7 },
  ayam_goreng:       { name: "Ayam goreng / fried chicken",  cal: 210, protein: 25,  carbs: 2,  fat: 11 },
  ayam_bakar:        { name: "Ayam bakar / grilled chicken", cal: 170, protein: 28,  carbs: 0,  fat: 6 },
  telur_dadar:       { name: "Telur dadar / omelette",       cal: 150, protein: 11,  carbs: 1,  fat: 11 },
  telur_rebus:       { name: "Telur rebus / boiled egg",     cal: 155, protein: 13,  carbs: 1,  fat: 11 },
  tempe_goreng:      { name: "Tempe goreng",                 cal: 190, protein: 11,  carbs: 12, fat: 12 },
  tahu_goreng:       { name: "Tahu goreng",                  cal: 180, protein: 10,  carbs: 5,  fat: 13 },
  rendang:           { name: "Rendang",                      cal: 205, protein: 20,  carbs: 4,  fat: 13 },
  soto:              { name: "Soto ayam",                    cal: 80,  protein: 7,   carbs: 5,  fat: 4 },
  gado_gado:         { name: "Gado-gado",                    cal: 150, protein: 8,   carbs: 10, fat: 9 },
  nasi_kuning:       { name: "Nasi kuning",                  cal: 150, protein: 3,   carbs: 24, fat: 5 },
  nasi_uduk:         { name: "Nasi uduk",                    cal: 145, protein: 2.5, carbs: 25, fat: 4 },
  bubur:             { name: "Bubur ayam",                   cal: 90,  protein: 4,   carbs: 14, fat: 2 },
  mie_goreng:        { name: "Mie goreng",                   cal: 155, protein: 5,   carbs: 20, fat: 6 },
  bakso:             { name: "Bakso",                        cal: 165, protein: 14,  carbs: 10, fat: 8 },
  roti:              { name: "White bread",                  cal: 265, protein: 9,   carbs: 49, fat: 3 },
  pisang:            { name: "Pisang / banana",              cal: 89,  protein: 1.1, carbs: 23, fat: 0.3 },
  tahu_saus_tiram:   { name: "Tahu saus tiram",              cal: 110, protein: 7,   carbs: 4,  fat: 7 },
  sayur_goreng:      { name: "Sayuran goreng",               cal: 70,  protein: 2,   carbs: 6,  fat: 4 },
  sambal:            { name: "Sambal",                       cal: 180, protein: 1.5, carbs: 10, fat: 15 },
};

export function resolveFood(key: string, portionGrams: number) {
  const entry = FOODS[key.toLowerCase()];
  if (!entry) return null;
  const ratio = portionGrams / 100;
  return {
    name: entry.name,
    calories: Math.round(entry.cal * ratio),
    protein_g: Math.round(entry.protein * ratio),
    carbs_g: Math.round(entry.carbs * ratio),
    fat_g: Math.round(entry.fat * ratio),
  };
}

export function resolveFallbacks(items: AnalysisFoodItem[]): AnalysisFoodItem[] {
  return items.map((item) => {
    if (item.food_key) {
      const resolved = resolveFood(item.food_key, item.portion_grams ?? 100);
      if (resolved) return { ...item, ...resolved };
    }
    return item;
  });
}
