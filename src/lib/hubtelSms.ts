/**
 * Hubtel Programmable SMS — booking confirmations & appointment reminders.
 * https://developers.hubtel.com/ (Messaging → Programmable SMS)
 *
 * Env (server-only):
 *   HUBTEL_SMS_SENDER        — registered Sender ID (From), e.g. "Verene" or "QueenVerene"
 *   HUBTEL_SMS_CLIENT_ID     — optional; defaults to HUBTEL_CLIENT_ID (payments)
 *   HUBTEL_SMS_CLIENT_SECRET — optional; defaults to HUBTEL_CLIENT_SECRET
 *   HUBTEL_SMS_API_URL       — optional; default https://smsc.hubtel.com/v1/messages
 */

import { formatPhone } from "@/lib/utils";

const DEFAULT_API = "https://smsc.hubtel.com/v1/messages";

function getSmsCredentials(): { clientId: string; clientSecret: string; from: string; url: string } | null {
  const clientId =
    process.env.HUBTEL_SMS_CLIENT_ID?.trim() || process.env.HUBTEL_CLIENT_ID?.trim();
  const clientSecret =
    process.env.HUBTEL_SMS_CLIENT_SECRET?.trim() || process.env.HUBTEL_CLIENT_SECRET?.trim();
  const from = process.env.HUBTEL_SMS_SENDER?.trim();
  const url = process.env.HUBTEL_SMS_API_URL?.trim() || DEFAULT_API;

  if (!clientId || !clientSecret || !from) return null;
  if (clientId === "your_hubtel_client_id" || clientSecret === "your_hubtel_client_secret") return null;

  return { clientId, clientSecret, from, url };
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
      "[Hubtel SMS] Missing HUBTEL_SMS_SENDER or Hubtel client credentials (HUBTEL_SMS_CLIENT_* / HUBTEL_CLIENT_*)."
    );
    return false;
  }

  const auth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const recipient = formatPhone(to);

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
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
