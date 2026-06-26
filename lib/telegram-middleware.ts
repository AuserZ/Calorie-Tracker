// HMAC signature verification for Telegram webhook updates.
// Telegram signs each update with X-Telegram-Bot-Api-Secret-Token when you
// register a webhook with a secret_token. We compare it to TELEGRAM_WEBHOOK_SECRET.

export function verifySecret(headers: Headers): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true; // dev mode: skip if not configured
  const got = headers.get("x-telegram-bot-api-secret-token");
  return got === expected;
}

export function getSecretToken(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET || undefined;
}
