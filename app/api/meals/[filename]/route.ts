import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import {
  resolveMealsDir,
  isSafeMealFilename,
  contentTypeFor,
} from "@/lib/paths";

export const runtime = "nodejs";

/**
 * Streams a previously-saved meal image from MEALS_DIR.
 *
 * Reachable at:
 *   /api/meals/<filename>          (direct)
 *   /meals/<filename>              (via the rewrite in next.config.ts)
 *
 * The second URL keeps existing Firestore records valid even after we
 * moved storage off /public/.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ filename: string }> }
) {
  const { filename } = await ctx.params;

  if (!isSafeMealFilename(filename)) {
    return new NextResponse("Bad filename", { status: 400 });
  }

  const dir = resolveMealsDir();
  const filepath = path.join(dir, filename);

  let size: number;
  try {
    const s = await stat(filepath);
    if (!s.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
    size = s.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = await readFile(filepath);
  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(filename),
      "Content-Length": String(size),
      // Filenames embed timestamp + random suffix → effectively immutable
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
