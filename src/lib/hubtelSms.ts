/**
 * Hubtel Programmable SMS
 * Docs: https://developers.hubtel.com/docs/business/api_documentation/notification_apis/sms
 *
 * Env vars (server-only):
 *   HUBTEL_SMS_CLIENT_ID      — SMS API client ID
 *   HUBTEL_SMS_CLIENT_SECRET  — SMS API client secret
 *   HUBTEL_SMS_SENDER         — Sender ID shown to recipient (max 11 chars, must be registered)
 *
 * Falls back to HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET if the SMS-specific vars are absent.
 *
 * API behaviour (from Hubtel docs):
 *   POST https://sms.hubtel.com/v1/messages/send
 *   Authorization: Basic base64(clientId:clientSecret)
 *   Body: { "From": "...", "To": "233XXXXXXXXX", "Content": "..." }
 *
 *   Success → HTTP 201, body { status: 0, ... }
 *   Failure → HTTP 201 (or 4xx), body { status: <non-zero>, statusDescription: "..." }
 *
 *   Phone numbers MUST be in the format 233XXXXXXXXX (no leading +).
 */

const SMS_ENDPOINT = "https://sms.hubtel.com/v1/messages/send";

interface HubtelSmsResponse {
  status:            number;
  statusDescription: string;
  messageId?:        string;
  rate?:             number;
  networkId?:        string;
}

/** Normalise any Ghana phone number to Hubtel's required 233XXXXXXXXX format (no +). */
function toHubtelPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;          // already 233XXXXXXXXX
  if (digits.startsWith("0"))   return "233" + digits.slice(1); // 0XXXXXXXXX → 233XXXXXXXXX
  return "233" + digits;                                // bare 9-digit → 233XXXXXXXXX
}

/** Strip WhatsApp-style markup (*bold*, _italic_) for plain SMS. */
export function smsPlainText(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1");
}

function getCredentials(): { clientId: string; clientSecret: string; sender: string } | null {
  const clientId     = process.env.HUBTEL_SMS_CLIENT_ID?.trim()
                    || process.env.HUBTEL_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBTEL_SMS_CLIENT_SECRET?.trim()
                    || process.env.HUBTEL_CLIENT_SECRET?.trim();
  const sender       = process.env.HUBTEL_SMS_SENDER?.trim();

  if (!clientId || !clientSecret) {
    console.warn("[Hubtel SMS] Missing HUBTEL_SMS_CLIENT_ID or HUBTEL_SMS_CLIENT_SECRET");
    return null;
  }
  if (!sender) {
    console.warn("[Hubtel SMS] Missing HUBTEL_SMS_SENDER");
    return null;
  }
  if (sender.length > 11) {
    console.warn(`[Hubtel SMS] Sender ID "${sender}" exceeds 11 characters — Hubtel will reject it`);
  }

  return { clientId, clientSecret, sender };
}

/**
 * Send a single SMS via Hubtel.
 * Returns true on confirmed delivery submission, false on any failure.
 */
export async function sendHubtelSms(to: string, content: string): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) return false;

  const recipient    = toHubtelPhone(to);
  const plainContent = smsPlainText(content);
  const basicAuth    = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");

  console.log(`[Hubtel SMS] Sending to ${recipient} from "${creds.sender}"…`);

  try {
    const res = await fetch(SMS_ENDPOINT, {
      method:  "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({
        From:    creds.sender,
        To:      recipient,
        Content: plainContent,
      }),
    });

    const raw = await res.text();

    // Hubtel returns 201 for both success AND some errors — must check JSON status field
    let json: HubtelSmsResponse | null = null;
    try { json = JSON.parse(raw); } catch { /* not JSON */ }

    if (!res.ok) {
      console.error(`[Hubtel SMS] HTTP ${res.status}:`, raw.slice(0, 300));
      return false;
    }

    if (json && json.status !== 0) {
      // HTTP 201 but non-zero status = Hubtel-level error
      console.error(
        `[Hubtel SMS] Hubtel error status=${json.status}: ${json.statusDescription || raw.slice(0, 200)}`
      );
      // Helpful hints for common error codes
      if (json.status === 1)  console.error("[Hubtel SMS] → Invalid destination number. Check the recipient's phone number.");
      if (json.status === 2)  console.error("[Hubtel SMS] → Invalid source address. Ensure your Sender ID is registered & approved in the Hubtel console.");
      if (json.status === 12) console.error("[Hubtel SMS] → Insufficient credit. Fund your Hubtel SMS wallet.");
      return false;
    }

    console.log(`[Hubtel SMS] ✓ Submitted — messageId: ${json?.messageId}, rate: ${json?.rate}`);
    return true;
  } catch (err) {
    console.error("[Hubtel SMS] Network/fetch error:", err);
    return false;
  }
}
