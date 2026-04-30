import path from "node:path";

/**
 * Resolves the absolute filesystem directory where meal images are stored.
 *
 * Reads MEALS_DIR from env. If unset, defaults to `<cwd>/public/meals`
 * so dev "just works" without configuration.
 *
 * In production on a VPS you should set this to an absolute path OUTSIDE
 * the project root so images survive `git pull && npm run build`:
 *
 *   MEALS_DIR=/var/lib/eaten/uploads
 *
 * Then point your reverse proxy / serve via /api/meals/<filename>.
 */
export function resolveMealsDir(): string {
  const raw = process.env.MEALS_DIR?.trim();
  if (!raw) return path.join(process.cwd(), "public", "meals");
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

const ALLOWED_FILENAME = /^[A-Za-z0-9._-]+$/;

/**
 * Verify a filename from a URL parameter is safe (no path traversal,
 * no slashes, no null bytes, no shell metacharacters).
 */
export function isSafeMealFilename(name: string): boolean {
  if (!name || name.length > 128) return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  return ALLOWED_FILENAME.test(name);
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  gif: "image/gif",
};

export function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
}
