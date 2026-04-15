/**
 * Hubtel Programmable SMS — booking confirmations & appointment reminders.
 * https://developers.hubtel.com/ (Messaging → Programmable SMS)
 *
 * Env (server-only):
 *   HUBTEL_SMS_SENDER           — registered Sender ID (From), e.g. "Verene" or "QueenVerene"
 *   HUBTEL_SMS_AUTH_MODE        — optional; "token" | "basic" (default "token")
 *   HUBTEL_SMS_API_TOKEN        — required when auth mode is "token"
 *   HUBTEL_SMS_TOKEN_PREFIX     — optional auth prefix for token mode (default "Bearer")
 *   HUBTEL_SMS_CLIENT_ID        — required when auth mode is "basic"; defaults to HUBTEL_CLIENT_ID
 *   HUBTEL_SMS_CLIENT_SECRET    — required when auth mode is "basic"; defaults to HUBTEL_CLIENT_SECRET
 *   HUBTEL_SMS_API_URL          — optional; default https://smsc.hubtel.com/v1/messages
 */

import { formatPhone } from "@/lib/utils";

const DEFAULT_API = "https://smsc.hubtel.com/v1/messages";

type SmsAuth =
  | { mode: "token"; token: string; tokenPrefix: string }
  | { mode: "basic"; clientId: string; clientSecret: string };

function getSmsCredentials(): { from: string; url: string; auth: SmsAuth } | null {
  const from = process.env.HUBTEL_SMS_SENDER?.trim();
  const url = process.env.HUBTEL_SMS_API_URL?.trim() || DEFAULT_API;
  const authMode = (process.env.HUBTEL_SMS_AUTH_MODE?.trim().toLowerCase() || "token") as
    | "token"
    | "basic";

  if (!from) return null;

  if (authMode === "token") {
    const token = process.env.HUBTEL_SMS_API_TOKEN?.trim();
    const tokenPrefix = process.env.HUBTEL_SMS_TOKEN_PREFIX?.trim() || "Bearer";
    if (!token || token === "your_hubtel_sms_api_token") return null;
    return { from, url, auth: { mode: "token", token, tokenPrefix } };
  }

  const clientId = process.env.HUBTEL_SMS_CLIENT_ID?.trim() || process.env.HUBTEL_CLIENT_ID?.trim();
  const clientSecret =
    process.env.HUBTEL_SMS_CLIENT_SECRET?.trim() || process.env.HUBTEL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  if (clientId === "your_hubtel_client_id" || clientSecret === "your_hubtel_client_secret") return null;

  return { from, url, auth: { mode: "basic", clientId, clientSecret } };
}

/** Strip WhatsApp-style markup for SMS. */
export function smsPlainText(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1");
}

/**
 * Send a single SMS via Hubtel.
 */
export async function sendHubtelSms(to: string, content: string): Promise<boolean> {
  const cfg = getSmsCredentials();
  if (!cfg) {
    console.warn(
      "[Hubtel SMS] Missing credentials. Configure HUBTEL_SMS_SENDER and either HUBTEL_SMS_API_TOKEN (token mode) or HUBTEL_SMS_CLIENT_* / HUBTEL_CLIENT_* (basic mode)."
    );
    return false;
  }

  const recipient = formatPhone(to);
  const authorizationHeader =
    cfg.auth.mode === "token"
      ? `${cfg.auth.tokenPrefix} ${cfg.auth.token}`
      : `Basic ${Buffer.from(`${cfg.auth.clientId}:${cfg.auth.clientSecret}`).toString("base64")}`;

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        From: cfg.from,
        To: recipient,
        Content: smsPlainText(content),
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error("[Hubtel SMS] HTTP error:", res.status, raw);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Hubtel SMS] Send failed:", err);
    return false;
  }
}
