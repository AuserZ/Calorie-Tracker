// Telegram bot helpers — pure functions over the Bot API.
// Uses webhooks; see /api/telegram/webhook/route.ts.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : "";

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
};

export type TgMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; username?: string };
  text?: string;
  photo?: TgPhotoSize[];
  caption?: string;
};

export type TgPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TgCallbackQuery = {
  id: string;
  from: { id: number };
  data?: string;
  message?: { chat: { id: number }; message_id: number };
};

async function call(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Telegram ${method} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function sendMessage(
  chatId: number,
  text: string,
  opts: { reply_markup?: object; parse_mode?: "HTML" | "Markdown" } = {}
) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    reply_markup: opts.reply_markup,
  });
}

export async function editMessage(chatId: number, messageId: number, text: string, opts: { reply_markup?: object } = {}) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: opts.reply_markup,
  });
}

export async function answerCallback(callbackQueryId: string, text?: string) {
  return call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const meta = await call("getFile", { file_id: fileId });
  const path = (meta as { result: { file_path?: string } }).result.file_path;
  if (!path) throw new Error("no file_path returned");
  const res = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`);
  if (!res.ok) throw new Error(`file download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export function inlineKeyboard(buttons: { text: string; callback_data: string }[][]) {
  return { inline_keyboard: buttons };
}

/** Reply keyboard — persistent buttons at the bottom of the chat. */
export function replyKeyboard(buttons: string[][]) {
  return {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

/** Remove the persistent reply keyboard. */
export function replyKeyboardRemove() {
  return { remove_keyboard: true };
}

export function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Allowlist a single Telegram chat id. Set TELEGRAM_ALLOWED_CHAT_ID in .env. */
export function isAllowedChat(chatId: number): boolean {
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (!allowed) return false; // fail closed if not configured
  return String(chatId) === String(allowed);
}

/** Register the bot's command menu so Telegram shows them in the "/" autocomplete. */
export async function setMyCommands() {
  return call("setMyCommands", {
    commands: [
      { command: "start", description: "Show welcome message" },
      { command: "add-food", description: "Log a meal with photos" },
      { command: "done", description: "Analyze uploaded photos now" },
      { command: "extend", description: "Add 1–5 more photo slots" },
      { command: "cancel", description: "Abort the current meal" },
      { command: "help", description: "Show usage" },
    ],
  });
}
