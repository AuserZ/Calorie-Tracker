// POST /api/telegram/webhook
// Receives updates from Telegram Bot API, dispatches by command/callback.
// State: in-memory Map<chatId, Session> via lib/botsession.ts.

import { NextRequest, NextResponse } from "next/server";
import { verifySecret } from "@/lib/telegram-middleware";
import {
  sendMessage,
  editMessage,
  answerCallback,
  downloadFile,
  inlineKeyboard,
  isAllowedChat,
  escHtml,
  replyKeyboard,
  replyKeyboardRemove,
  setMyCommands,
} from "@/lib/telegram";
import {
  getSession,
  setSession,
  updateSession,
  removeSession,
  SessionStep,
  cleanExpired,
} from "@/lib/botsession";
import { analyzePhotos, MergedResult } from "@/lib/telegram-analyze";
import { db, USER_ID } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { todayKey } from "@/lib/calories";

export const runtime = "nodejs";

// Deduplicate updates — Telegram may retry the same update_id on network blips.
const processedIds = new Set<number>();
const MAX_PROCESSED = 1000;
let lastDrain = Date.now();

/** Map reply-keyboard button labels to the underlying slash command. */
function normalizeButtonText(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "📸 Add food") return "/add-food";
  if (trimmed === "✅ Done") return "/done";
  if (trimmed === "❌ Cancel") return "/cancel";
  if (trimmed === "ℹ️ Help") return "/help";
  if (trimmed === "➕ Extend +1") return "/extend 1";
  if (trimmed === "🔁 Try again") return "/add-food";
  return trimmed;
}

/** Sniff the image format from the first bytes so we tell Gemini the truth. */
function detectMimeType(bytes: Buffer): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 && bytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (bytes.length >= 6 && (bytes.slice(0, 6).toString("ascii") === "GIF87a" || bytes.slice(0, 6).toString("ascii") === "GIF89a")) {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 12 && bytes.slice(4, 8).toString("ascii") === "ftyp") {
    // Could be HEIC/HVEC/MP4 — don't mislabel as jpeg
    return "image/heic";
  }
  return "image/jpeg";
}

export async function POST(req: NextRequest) {
  try {
    if (!verifySecret(req.headers)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    cleanExpired();

    // Drain the dedup set once it grows past MAX_PROCESSED or every 10 minutes.
    if (processedIds.size > MAX_PROCESSED || Date.now() - lastDrain > 10 * 60 * 1000) {
      processedIds.clear();
      lastDrain = Date.now();
    }

    const body = await req.json();

    // Silently acknowledge duplicates and update types we ignore.
    if (!body.update_id || processedIds.has(body.update_id)) {
      return NextResponse.json({ ok: true });
    }
    if (!body.message && !body.callback_query) {
      return NextResponse.json({ ok: true });
    }
    if (body.edited_message) {
      return NextResponse.json({ ok: true });
    }

    processedIds.add(body.update_id);

    if (body.callback_query) {
      return NextResponse.json(await handleCallback(body.callback_query));
    }
    return NextResponse.json(await handleMessage(body.message));
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}

// ─── Message handler ────────────────────────────────────────────────────

type TgMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  photo?: { file_id: string; width: number; height: number; file_size?: number }[];
  caption?: string;
};

async function handleMessage(msg: TgMessage): Promise<NextResponse> {
  const chatId = msg.chat.id;
  const rawText = msg.text ?? "";
  const text = normalizeButtonText(rawText);

  // Command routing
  if (text === "/start" || text === "/help") {
    setMyCommands().catch(() => {});
    return sendMessage(
      chatId,
      `<b>Calorie tracker bot</b>
Use the buttons below to log a meal, analyze photos, or abort.

<b>Flow:</b>
1️⃣ Tap <b>📸 Add food</b>
2️⃣ Pick photo count (1–5)
3️⃣ Send photos one by one
4️⃣ (Optional) Send notes like "extra sambal"
5️⃣ Tap <b>✅ Done</b> to analyze
6️⃣ Tap <b>Log it</b> on the result to save

Use /cancel at any time to abort.`,
      {
        reply_markup: replyKeyboard([
          ["📸 Add food", "✅ Done"],
          ["➕ Extend +1", "❌ Cancel"],
          ["ℹ️ Help"],
        ]),
      }
    );
  }

  if (text === "/add-food" || text === "/add") {
    return askCount(chatId);
  }

  if (text === "/cancel") {
    removeSession(chatId);
    return sendMessage(chatId, "Cancelled. /add-food to start fresh.");
  }

  if (text === "/done") {
    const curSession = getSession(chatId);
    return handleAnalyze(chatId, curSession?.photoIds.length ?? 0);
  }

  // /extend N
  if (text.startsWith("/extend")) {
    const parts = text.split(" ");
    const extra = parseInt(parts[1], 10);
    const session = getSession(chatId);
    if (!session) return sendMessage(chatId, "No active meal. Use /add-food first.");
    if (isNaN(extra) || extra < 1 || extra > 5) {
      return sendMessage(chatId, "Use: /extend 3 (1–5).");
    }
    if (session.totalExpected + extra > 5) {
      return sendMessage(chatId, `Max 5 photos total. You have ${session.totalExpected} already.`);
    }
    updateSession(chatId, (s) => {
      s.totalExpected += extra;
    });
    const remaining = session.totalExpected - session.photoIds.length;
    return sendMessage(chatId, `Added ${extra} slot(s). Send ${remaining} more photo(s) or /done to analyze.`);
  }

  const session = getSession(chatId);
  if (!session) {
    return sendMessage(chatId, "Start with /add-food to log a meal.");
  }

  // Photo upload
  if (msg.photo && msg.photo.length > 0) {
    return handlePhoto(chatId, msg.photo[0].file_id);
  }

  // Text while in photo-collection step: treat as notes for the LLM
  if (text && session.step === SessionStep.AWAITING_PHOTOS) {
    updateSession(chatId, (s) => {
      // @ts-expect-error - extend at runtime
      s.notes = ((s as any).notes ?? "") + (((s as any).notes) ? " " : "") + text;
    });
    const remaining = session.totalExpected - session.photoIds.length;
    const allIn = remaining <= 0;
    const tail = allIn
      ? " Send /done to analyze."
      : ` Still need ${remaining} photo(s), or /done to analyze now.`;
    return sendMessage(chatId, `Notes received. ${tail}`);
  }

  return sendMessage(chatId, "Send a photo or use /add-food.");
}

// ─── Callback handler ──────────────────────────────────────────────────

type TgCallback = {
  id: string;
  from: { id: number };
  data?: string;
  message?: { chat: { id: number }; message_id: number };
};

async function handleCallback(cbq: TgCallback): Promise<NextResponse> {
  const chatId = cbq.message?.chat.id ?? cbq.from.id;
  if (!isAllowedChat(chatId)) return answerCallback(cbq.id);
  const data = cbq.data ?? "";
  const msgId = cbq.message?.message_id;

  // count1..count5 from askCount inline keyboard
  if (data.startsWith("count") && msgId != null) {
    const n = parseInt(data.slice(5), 10);
    if (n >= 1 && n <= 5) {
      return handleCountSelect(chatId, msgId, n);
    }
  }

  if (data === "start_add") {
    // The /start welcome is the user's own message; the bot cannot edit it.
    // Send a fresh question instead.
    return askCount(chatId);
  }

  if (data === "log_meal") {
    const session = getSession(chatId);
    if (!session?.analyzedResult) {
      return answerCallback(cbq.id, "Session expired.");
    }
    await saveMealToFirestore(session.analyzedResult);
    removeSession(chatId);
    if (msgId != null) {
      await editMessage(
        chatId,
        msgId,
        "✅ Meal saved to your tracker!",
        { reply_markup: inlineKeyboard([]) }
      );
    }
    return answerCallback(cbq.id, "Logged");
  }

  if (data === "cancel_confirm") {
    removeSession(chatId);
    if (msgId != null) {
      await editMessage(chatId, msgId, "❌ Cancelled.", { reply_markup: inlineKeyboard([]) });
    }
    return answerCallback(cbq.id);
  }

  return answerCallback(cbq.id);
}

// ─── Step handlers ─────────────────────────────────────────────────────

async function askCount(chatId: number) {
  setSession(chatId, {
    step: SessionStep.AWAITING_COUNT,
    totalExpected: 0,
    photoIds: [],
    analyzedResult: null,
  });
  return sendMessage(
    chatId,
    "<b>How many photos?</b> (1–5)\nSend a number or tap below.",
    {
      reply_markup: inlineKeyboard([
        [
          { text: "1", callback_data: "count1" },
          { text: "2", callback_data: "count2" },
          { text: "3", callback_data: "count3" },
          { text: "4", callback_data: "count4" },
          { text: "5", callback_data: "count5" },
        ],
      ]),
    }
  );
}

async function handleCountSelect(chatId: number, msgId: number, count: number) {
  if (count < 1 || count > 5) {
    try {
      return await editMessage(chatId, msgId, "Pick 1–5.");
    } catch {
      return sendMessage(chatId, "Pick 1–5.");
    }
  }
  setSession(chatId, {
    step: SessionStep.AWAITING_PHOTOS,
    totalExpected: count,
    photoIds: [],
    analyzedResult: null,
  });
  // The number buttons live on the bot's own message, so editing is usually safe.
  try {
    return await editMessage(chatId, msgId, `📸 Photo 1 of ${count} — send it now!`);
  } catch {
    return sendMessage(chatId, `📸 Photo 1 of ${count} — send it now!`);
  }
}

async function handlePhoto(chatId: number, fileId: string) {
  updateSession(chatId, (s) => {
    s.photoIds.push(fileId);
  });
  const session = getSession(chatId)!;
  const received = session.photoIds.length;
  if (received >= session.totalExpected) {
    return sendMessage(
      chatId,
      `📸 All ${received} photo(s) received! Add any extra details now (portions, ingredients, sauce, etc.) — then tap ✅ Done to analyze.`
    );
  }
  return sendMessage(
    chatId,
    `✅ Got it (${received}/${session.totalExpected}). Send photo ${received + 1} of ${session.totalExpected}.`
  );
}

async function handleAnalyze(chatId: number, _received: number) {
  const session = getSession(chatId);
  if (!session) {
    return sendMessage(chatId, "No active meal. Use /add-food first.");
  }
  if (session.photoIds.length === 0) {
    return sendMessage(chatId, "You need at least one photo.");
  }
  await sendMessage(chatId, `🤖 Tasting ${session.photoIds.length} photo(s)...`);

  // Download all photos
  const photos: { bytes: Buffer; mimeType: string }[] = [];
  for (const fid of session.photoIds) {
    try {
      const bytes = await downloadFile(fid);
      const mimeType = detectMimeType(bytes);
      console.log(`[telegram-analyze] downloaded ${bytes.length} bytes, mime=${mimeType}`);
      photos.push({ bytes, mimeType });
    } catch (e) {
      return sendMessage(
        chatId,
        `Failed to download photo: ${e instanceof Error ? e.message : "unknown error"}`
      );
    }
  }

  // Run analyze + merge
  const result = await analyzePhotos(photos, ((session as any).notes as string) ?? "");

  if (result.items.length === 0) {
    const err = (result.error ?? "").toString();
    const isRateLimit = err.startsWith("503") || /high demand|UNAVAILABLE|429|overloaded/i.test(err);
    const isNotFood = err === "not_food" || /no valid items/i.test(err);
    const isParse = /parse_failed|empty response|invalid/i.test(err);

    let title: string;
    let hint: string;
    if (isRateLimit) {
      title = "⏳ Gemini is overloaded.";
      hint = "The free tier is busy right now. Try again in a minute with /add-food.";
    } else if (isNotFood) {
      title = "🤔 I couldn't see food in this photo.";
      hint = "Make sure the dish is the main subject, well-lit, and fills most of the frame. Then /add-food and try again.";
    } else if (isParse) {
      title = "🧩 The model returned an unexpected response.";
      hint = "Please try again with /add-food — a different photo often works.";
    } else {
      title = "❌ Analysis failed.";
      hint = "Try /add-food with a clearer photo, or /cancel to abort.";
    }

    removeSession(chatId);
    const detail = err ? `\n\n<i>${err.slice(0, 240)}</i>` : "";
    return sendMessage(chatId, `${title}\n\n${hint}${detail}`, {
      reply_markup: inlineKeyboard([
        [
          { text: "🔁 Try again", callback_data: "start_add" },
          { text: "❌ Cancel", callback_data: "cancel_confirm" },
        ],
      ]),
    });
  }

  // Save into session so the confirm callback can use it
  updateSession(chatId, (s) => {
    s.step = SessionStep.AWAITING_CONFIRM;
    s.analyzedResult = { ...result, confirmMsg: buildConfirmText(result) } as any;
  });

  const confirmMsg = buildConfirmText(result);
  return sendMessage(chatId, confirmMsg, {
    reply_markup: inlineKeyboard([
      [
        { text: "✅ Log it", callback_data: "log_meal" },
        { text: "❌ Cancel", callback_data: "cancel_confirm" },
      ],
    ]),
  });
}

function buildConfirmText(r: MergedResult): string {
  const lines: string[] = [];
  lines.push(`<b>I see ${r.items.length} item${r.items.length !== 1 ? "s" : ""}:</b>`);
  r.items.forEach((it, i) => {
    const conf = it.confidence === "high" ? "🟢" : it.confidence === "medium" ? "🟡" : "🔴";
    const label = it.portion_label ? ` <i>(${escHtml(it.portion_label)})</i>` : "";
    lines.push(`${i + 1}. ${conf} ${escHtml(it.name)} — ${it.calories} kcal${label}`);
  });
  lines.push("");
  lines.push(
    `<b>Total: ${r.totalCal} kcal</b> · P:${r.totalP} C:${r.totalC} F:${r.totalF}`
  );
  return lines.join("\n");
}

// ─── Firestore save ────────────────────────────────────────────────────

async function saveMealToFirestore(result: MergedResult) {
  const totalConf = result.items.every((it) => it.confidence === "high")
    ? "high"
    : result.items.some((it) => it.confidence === "low")
    ? "low"
    : "medium";

  const summary =
    result.items.length === 1
      ? result.items[0].name
      : result.items
          .slice(0, 3)
          .map((it) => it.name)
          .join(", ") + (result.items.length > 3 ? "…" : "");

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const col = collection(db(), "users", USER_ID, "meals");
  const payload: Record<string, unknown> = {
    name: summary,
    calories: result.totalCal,
    protein: result.totalP,
    carbs: result.totalC,
    fat: result.totalF,
    imageUrl: "",
    confidence: totalConf,
    items: result.items,
    loggedAt: serverTimestamp(),
    dateKey: todayKey(),
  };
  await setDoc(doc(col, id), payload);
}
