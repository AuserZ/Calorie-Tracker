// In-memory session store for the Telegram bot.
// Keys are chat IDs. Sessions expire after IDLE_TIMEOUT_MS to clean up abandoned /add-food flows.
// For multi-region / Vercel serverless deployments, use a persistent store (Redis, Firestore).
// For now this is fine — a single Vercel instance serves one user at a time.

import { AnalysisFoodItem } from "@/lib/types";

export enum SessionStep {
  AWAITING_COUNT = "awaiting_count",
  AWAITING_PHOTOS = "awaiting_photos",
  AWAITING_ANALYZE = "awaiting_analyze",
  AWAITING_CONFIRM = "awaiting_confirm",
}

export type Session = {
  step: SessionStep;
  totalExpected: number;
  photoIds: string[]; // Telegram photo[0].file_id
  analyzedResult: {
    items: AnalysisFoodItem[];
    totalCal: number;
    totalP: number;
    totalC: number;
    totalF: number;
    confirmMsg: string;
  } | null;
  expiresAt: number;
};

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const sessions = new Map<number, Session>();

export function getSession(chatId: number): Session | undefined {
  return sessions.get(chatId);
}

export function setSession(chatId: number, session: Omit<Session, "expiresAt">): void {
  sessions.set(chatId, { ...session, expiresAt: Date.now() + IDLE_TIMEOUT_MS });
}

export function updateSession(
  chatId: number,
  fn: (s: Session) => void
): boolean {
  const s = sessions.get(chatId);
  if (!s) return false;
  fn(s);
  s.expiresAt = Math.max(s.expiresAt, Date.now() + IDLE_TIMEOUT_MS);
  return true;
}

export function removeSession(chatId: number): boolean {
  return sessions.delete(chatId);
}

/** Clean expired sessions. Call periodically from the webhook handler. */
export function cleanExpired(now = Date.now()): number {
  let count = 0;
  for (const [cid, s] of sessions) {
    if (s.expiresAt < now) {
      sessions.delete(cid);
      count++;
    }
  }
  return count;
}

/** Create an initial "awaiting_count" session. */
export function newCountSession(chatId: number): Session {
  const s: Session = {
    step: SessionStep.AWAITING_COUNT,
    totalExpected: 0,
    photoIds: [],
    analyzedResult: null,
    expiresAt: Date.now() + IDLE_TIMEOUT_MS,
  };
  sessions.set(chatId, s);
  return s;
}
