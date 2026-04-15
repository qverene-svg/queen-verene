/**
 * Hubtel Programmable SMS — booking confirmations & appointment reminders.
 * https://developers.hubtel.com/ (Messaging → Programmable SMS)
 *
 * Env (server-only):
 *   HUBTEL_SMS_SENDER        — registered Sender ID, e.g. "VereneQueen"
 *   HUBTEL_SMS_AUTH_MODE     — "basic" (default) | "token"
 *
 *   Basic mode (Hubtel v1 query-param API):
 *     HUBTEL_SMS_CLIENT_ID     — API client ID  (or falls back to HUBTEL_CLIENT_ID)
 *     HUBTEL_SMS_CLIENT_SECRET — API client secret (or falls back to HUBTEL_CLIENT_SECRET)
 *     HUBTEL_SMS_API_URL       — optional; base URL only, default https://sms.hubtel.com/v1/messages/send
 *
 *   Token mode (Bearer header, POST JSON):
 *     HUBTEL_SMS_API_TOKEN     — API token
 *     HUBTEL_SMS_TOKEN_PREFIX  — optional prefix, default "Bearer"
 *     HUBTEL_SMS_API_URL       — optional; default https://smsc.hubtel.com/v1/messages
 */

import { formatPhone } from "@/lib/utils";

const DEFAULT_BASIC_API = "https://sms.hubtel.com/v1/messages/send";
const DEFAULT_TOKEN_API  = "https://smsc.hubtel.com/v1/messages";

type SmsAuth =
  | { mode: "token"; token: string; tokenPrefix: string }
  | { mode: "basic"; clientId: string; clientSecret: string };

function getSmsCredentials(): { from: string; baseUrl: string; auth: SmsAuth } | null {
  const from = process.env.HUBTEL_SMS_SENDER?.trim();
  if (!from) {
    console.warn("[Hubtel SMS] HUBTEL_SMS_SENDER is not set.");
    return null;
  }

  const authMode = (process.env.HUBTEL_SMS_AUTH_MODE?.trim().toLowerCase() || "basic") as "token" | "basic";

  if (authMode === "token") {
    const token = process.env.HUBTEL_SMS_API_TOKEN?.trim();
    if (!token || token === "your_hubtel_sms_api_token") {
      console.warn("[Hubtel SMS] HUBTEL_SMS_API_TOKEN is not set.");
      return null;
    }
    const tokenPrefix = process.env.HUBTEL_SMS_TOKEN_PREFIX?.trim() || "Bearer";
    // Strip any pre-filled query params from the URL — we build them ourselves
    const rawUrl = process.env.HUBTEL_SMS_API_URL?.trim() || DEFAULT_TOKEN_API;
    const baseUrl = rawUrl.split("?")[0];
    return { from, baseUrl, auth: { mode: "token", token, tokenPrefix } };
  }

  // Basic mode
  const clientId     = (process.env.HUBTEL_SMS_CLIENT_ID?.trim()     || process.env.HUBTEL_CLIENT_ID?.trim());
  const clientSecret = (process.env.HUBTEL_SMS_CLIENT_SECRET?.trim() || process.env.HUBTEL_CLIENT_SECRET?.trim());

  if (!clientId || !clientSecret) {
    console.warn("[Hubtel SMS] HUBTEL_SMS_CLIENT_ID or HUBTEL_SMS_CLIENT_SECRET is not set.");
    return null;
  }
  if (clientId === "your_hubtel_client_id" || clientSecret === "your_hubtel_client_secret") {
    console.warn("[Hubtel SMS] Placeholder credentials detected — configure real values.");
    return null;
  }

  // Strip any pre-filled query params (the env may have a full sample URL)
  const rawUrl = process.env.HUBTEL_SMS_API_URL?.trim() || DEFAULT_BASIC_API;
  const baseUrl = rawUrl.split("?")[0];

  return { from, baseUrl, auth: { mode: "basic", clientId, clientSecret } };
}

/** Strip WhatsApp-style markup (*bold*, _italic_) for plain SMS. */
export function smsPlainText(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1");
}

/**
 * Send a single SMS via Hubtel.
 *
 * Basic mode → GET https://sms.hubtel.com/v1/messages/send?clientid=…&clientsecret=…&from=…&to=…&content=…
 * Token mode  → POST https://smsc.hubtel.com/v1/messages  (JSON body, Authorization: Bearer …)
 */
export async function sendHubtelSms(to: string, content: string): Promise<boolean> {
  const cfg = getSmsCredentials();
  if (!cfg) return false;

  const recipient    = formatPhone(to);
  const plainContent = smsPlainText(content);

  console.log(`[Hubtel SMS] Sending to ${recipient} via ${cfg.auth.mode} mode…`);

  try {
    let res: Response;

    if (cfg.auth.mode === "basic") {
      // ── Hubtel v1 SMS: GET with query params ──────────────────────────────
      const url = new URL(cfg.baseUrl);
      url.searchParams.set("clientid",     cfg.auth.clientId);
      url.searchParams.set("clientsecret", cfg.auth.clientSecret);
      url.searchParams.set("from",         cfg.from);
      url.searchParams.set("to",           recipient);
      url.searchParams.set("content",      plainContent);

      res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } else {
      // ── Token mode: POST with JSON body + Authorization header ────────────
      res = await fetch(cfg.baseUrl, {
        method: "POST",
        headers: {
          Authorization:  `${cfg.auth.tokenPrefix} ${cfg.auth.token}`,
          "Content-Type": "application/json",
          Accept:         "application/json",
        },
        body: JSON.stringify({
          From:    cfg.from,
          To:      recipient,
          Content: plainContent,
        }),
      });
    }

    const raw = await res.text();

    if (!res.ok) {
      console.error(`[Hubtel SMS] HTTP ${res.status}:`, raw);
      return false;
    }

    console.log("[Hubtel SMS] ✓ Sent successfully:", raw.slice(0, 120));
    return true;
  } catch (err) {
    console.error("[Hubtel SMS] Network error:", err);
    return false;
  }
}
