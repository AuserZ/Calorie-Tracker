import type { AnalysisFoodItem, Confidence } from "./types";
import { utensilsForPrompt } from "./utensils";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// The available food keys (kept in sync with lib/foods.ts).
const FOOD_KEYS = `Available food recognition keys (match these when you recognize a dish):
- rice: Steamed white rice
- fried_rice: Nasi goreng
- ayam_goreng: Ayam goreng / fried chicken
- ayam_bakar: Ayam bakar / grilled chicken
- telur_dadar: Telur dadar / omelette
- telur_rebus: Telur rebus / boiled egg
- tempe_goreng: Tempe goreng
- tahu_goreng: Tahu goreng
- rendang: Rendang
- soto: Soto ayam
- gado_gado: Gado-gado
- nasi_kuning: Nasi kuning
- nasi_uduk: Nasi uduk
- bubur: Bubur ayam
- mie_goreng: Mie goreng
- bakso: Bakso
- roti: White bread
- pisang: Banana
- tahu_saus_tiram: Tahu saus tiram
- sayur_goreng: Stir-fried vegetables
- sambal: Sambal
`;

function buildPrompt(notes: string): string {
  const trimmed = notes.trim();
  const userNotes = trimmed.length > 0 ? trimmed : "(none)";

  return `You are a precise nutrition estimation assistant. Examine the food image and the user's portion/preparation notes (if provided), then identify EACH distinct food item visible on the plate and estimate nutritional content for the visible portion only.

# Reference utensils
The user may describe portions using the utensils below (Indonesian / English). Use these as size cues when interpreting the photo and the user notes:

${utensilsForPrompt()}

# Known food keys
Use these keys when you recognize a dish. They match a local nutrition database:

${FOOD_KEYS}

# User notes
${userNotes}

# Output format
Return STRICT JSON only. No prose. No markdown fences. Use exactly this structure:
[
  {
    "name": "Human-readable dish name in English, e.g. Fried chicken thigh with rice",
    "food_key": "ayam_goreng" or null,
    "portion_grams": 250,
    "portion_label": "1 plate + 1 cup" or null,
    "cooking_method": "fried" or null,
    "calories": 420,
    "protein_g": 35,
    "carbs_g": 28,
    "fat_g": 20,
    "confidence": "high" or "medium" or "low",
    "alternatives": [] or null
  }
]

Return ONE item per distinct food type visible. If there are 3 things on the plate, return 3 items.

# Rules
- Numbers must be integers (round to nearest). Calories in kcal, macros in grams.
- "name" is concise, 2–6 words in English.
- "food_key" is the best match from the list above (lowercase, underscore separated). Return null if unsure or it doesn't match.
- "portion_grams" is your best visual estimate in grams (typical rice ≈ 1 bowl ≈ 150–200g, 1 medium chicken thigh ≈ 120g, 1 large egg ≈ 50g).
- "conf" — high: clear photo + clear portion/notes; medium: identifiable but portion ambiguous; low: blurry, obscured, or notes contradict image.
- If confidence is "low", provide alternatives: [{"name": "Alternative identification"}].
- If user notes specify quantity ("2 sendok rice", "1 mangkuk sup"), trust them and adjust.
- Be realistic: typical home/restaurant portions, not extreme.
- If NO food is visible, return: {"error": "not_food"}

# Critical: count every food item on the plate, don't lump them together.`;
}

type GeminiTextPart = { text: string };
type GeminiInlineData = { inlineData: { mimeType: string; data: string } };
type GeminiContent = { parts: (GeminiTextPart | GeminiInlineData)[] };

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function extractText(json: GeminiResponse): string | null {
  const parts = json.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  return parts.map((p) => p.text ?? "").join("").trim();
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function analyzeFoodImage(
  base64: string,
  mimeType: string,
  notes: string = ""
): Promise<{ ok: true; items: AnalysisFoodItem[]; imageUrl: string } | { ok: false; error: "not_food" | "parse_failed" | "api_error" | "bad_request"; message?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "api_error", message: "GEMINI_API_KEY missing" };
  }

  const body = {
    contents: [
      {
        parts: [
          { text: buildPrompt(notes) },
          { inlineData: { mimeType, data: base64 } },
        ] as GeminiContent["parts"],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return {
      ok: false,
      error: "api_error",
      message: e instanceof Error ? e.message : "network failure",
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: "api_error", message: `${res.status}: ${text}` };
  }

  const json = (await res.json()) as GeminiResponse;
  let text = extractText(json);
  if (!text) {
    return { ok: false, error: "parse_failed", message: "empty response" };
  }

  // Normalize: if it returned a single object, wrap in array
  const cleaned = stripFences(text);
  const isArray = cleaned.trimStart().startsWith("[");
  const jsonStr = isArray ? cleaned : `[${cleaned}]`;

  let parsed: AnalysisFoodItem[];
  try {
    parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      // fallback: wrap if it's somehow an object
      parsed = [parsed as unknown as AnalysisFoodItem];
    }
  } catch {
    return { ok: false, error: "parse_failed", message: text.slice(0, 200) };
  }

  // Validate and normalize items
  const items: AnalysisFoodItem[] = [];
  for (const raw of parsed) {
    // Skip not_food marker if embedded
    if ((raw as any).error === "not_food") {
      return { ok: false, error: "not_food" };
    }

    const name = typeof raw.name === "string" ? raw.name : null;
    const calories = Number(raw.calories);
    const protein_g = Number(raw.protein_g);
    const carbs_g = Number(raw.carbs_g);
    const fat_g = Number(raw.fat_g);
    const portion_grams = Number(raw.portion_grams);
    const confidence: Confidence =
      raw.confidence === "low" || raw.confidence === "medium" || raw.confidence === "high"
        ? raw.confidence
        : "medium";
    const food_key = typeof raw.food_key === "string" ? raw.food_key : undefined;
    const portion_label = typeof raw.portion_label === "string" ? raw.portion_label : undefined;
    const cooking_method = typeof raw.cooking_method === "string" ? raw.cooking_method : undefined;
    const alternatives = Array.isArray(raw.alternatives)
      ? (raw.alternatives as { name: string; food_key?: string }[])
      : undefined;

    if (
      !name ||
      !Number.isFinite(calories) ||
      !Number.isFinite(protein_g) ||
      !Number.isFinite(carbs_g) ||
      !Number.isFinite(fat_g)
    ) {
      continue; // skip malformed items
    }

    items.push({
      name,
      food_key,
      portion_grams: portion_grams || 100,
      portion_label,
      cooking_method,
      calories: Math.round(calories),
      protein_g: Math.round(protein_g),
      carbs_g: Math.round(carbs_g),
      fat_g: Math.round(fat_g),
      confidence,
      alternatives,
    });
  }

  if (items.length === 0) {
    return { ok: false, error: "parse_failed", message: "no valid items detected" };
  }

  return { ok: true, items, imageUrl: "" };
}
