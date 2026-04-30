import type { AnalysisResult } from "./types";
import { utensilsForPrompt } from "./utensils";

const MODEL = "gemini-flash-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildPrompt(notes: string): string {
  const trimmed = notes.trim();
  const userNotes = trimmed.length > 0 ? trimmed : "(none)";

  return `You are a precise nutrition estimation assistant. Inspect the food image and the user's portion/preparation notes (if provided), then estimate nutritional content for the visible portion only.

# Reference utensils
The user may describe portions using the utensils below (Indonesian / English). Use these as size cues when interpreting the photo and the user notes:

${utensilsForPrompt()}

# User notes
${userNotes}

# Output
Return STRICT JSON only. No prose. No markdown fences. Use exactly this shape:
{"name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": "low"|"medium"|"high"}

If the image does not contain food at all, return:
{"error": "not_food"}

# Rules
- Numbers must be integers (round). Calories in kcal, macros in grams.
- "name" is concise, 2–6 words, in English. Include preparation method when obvious (e.g. "Grilled chicken thigh with rice").
- "confidence" reflects how sure you are about both the identification AND the portion size:
  - high: clear photo + clear portion (or user notes pin the portion exactly)
  - medium: identifiable but portion is somewhat ambiguous
  - low: blurry, partially visible, or user notes contradict the image
- If user notes specify a quantity ("2 sendok makan rice", "1 mangkuk sup"), trust them and adjust portion accordingly.
- Be realistic: typical home/restaurant portions, not extreme.`;
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
): Promise<AnalysisResult> {
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
  const text = extractText(json);
  if (!text) {
    return { ok: false, error: "parse_failed", message: "empty response" };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    return { ok: false, error: "parse_failed", message: text.slice(0, 200) };
  }

  if (parsed.error === "not_food") {
    return { ok: false, error: "not_food" };
  }

  const name = typeof parsed.name === "string" ? parsed.name : null;
  const calories = Number(parsed.calories);
  const protein_g = Number(parsed.protein_g);
  const carbs_g = Number(parsed.carbs_g);
  const fat_g = Number(parsed.fat_g);
  const confidence =
    parsed.confidence === "low" ||
    parsed.confidence === "medium" ||
    parsed.confidence === "high"
      ? parsed.confidence
      : "medium";

  if (
    !name ||
    !Number.isFinite(calories) ||
    !Number.isFinite(protein_g) ||
    !Number.isFinite(carbs_g) ||
    !Number.isFinite(fat_g)
  ) {
    return { ok: false, error: "parse_failed", message: text.slice(0, 200) };
  }

  return {
    ok: true,
    name,
    calories: Math.round(calories),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fat_g: Math.round(fat_g),
    confidence,
    imageUrl: "",
  };
}
