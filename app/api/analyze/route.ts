import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { analyzeFoodImage } from "@/lib/gemini";
import { resolveMealsDir } from "@/lib/paths";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/gif": "gif",
};

function safeExt(mime: string, fallback = "jpg") {
  return EXT_BY_MIME[mime] ?? fallback;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "image field required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "image too large (>8MB)" },
      { status: 413 }
    );
  }

  const mimeType = file.type || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "not an image" },
      { status: 415 }
    );
  }

  const notesRaw = form.get("notes");
  const notes =
    typeof notesRaw === "string" ? notesRaw.slice(0, 1000) : "";

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  const result = await analyzeFoodImage(base64, mimeType, notes);
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }

  const mealsDir = resolveMealsDir();
  await mkdir(mealsDir, { recursive: true });
  const ext = safeExt(mimeType);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(mealsDir, filename);
  await writeFile(filepath, buf);
  // Always serve via the same URL pattern. A Next.js rewrite + the
  // /api/meals/[filename] handler take care of streaming from disk,
  // regardless of whether MEALS_DIR points inside or outside /public.
  const imageUrl = `/meals/${filename}`;

  return NextResponse.json({ ...result, imageUrl }, { status: 200 });
}
