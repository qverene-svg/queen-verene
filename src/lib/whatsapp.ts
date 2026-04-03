/**
 * WhatsApp Business Cloud API helper (Meta Graph API v20.0)
 *
 * ─── HOW TO SET UP ─────────────────────────────────────────────────────────
 *
 * 1. Create a Meta for Developers app at https://developers.facebook.com
 *    - "Business" app type → Add "WhatsApp" product
 *
 * 2. In "WhatsApp → API Setup":
 *    - Add your WhatsApp Business number (same as NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER) as a test/production number
 *    - Copy the "Phone number ID"  → WHATSAPP_PHONE_NUMBER_ID in .env.local
 *
 * 3. Generate a Permanent System User access token:
 *    - Meta Business Suite → Business Settings → System Users
 *    - Create a System User with "EMPLOYEE" role
 *    - Assign the WhatsApp Business App with "whatsapp_business_messaging" permission
 *    - Generate a token → WHATSAPP_API_TOKEN in .env.local
 *
 * 4. Complete Business Verification in Meta Business Manager if sending to
 *    numbers outside the test whitelist.
 *
 * 5. For production messages TO customers (outbound-only, not replying):
 *    - You MUST use pre-approved Message Templates (Utility or Marketing)
 *    - Free-form text is only allowed within a 24-hour customer-initiated window
 *    - Create templates in "WhatsApp → Message Templates" → Submit for review
 *
 * ─── WHAT THIS FILE PROVIDES ─────────────────────────────────────────────
 *
 * sendWhatsAppText()     - Send a free-form text message (within 24h window)
 * sendWhatsAppTemplate() - Send a pre-approved template message
 * buildWaLink()          - Build a wa.me click-to-chat URL (no API needed)
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

function getCredentials() {
  const apiToken      = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!apiToken || apiToken === "your_whatsapp_api_token") return null;
  if (!phoneNumberId || phoneNumberId === "your_phone_number_id") return null;
  return { apiToken, phoneNumberId };
}

/** Normalize a Ghanaian phone number to E.164 digits (no +) */
export function normalizeGhPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0/, "233");
}

/**
 * Send a free-form text message via the WhatsApp Cloud API.
 *
 * ⚠️  Only works within a 24-hour customer service window (i.e. the customer
 *     must have messaged you first). For outbound proactive messages, use
 *     `sendWhatsAppTemplate()` with an approved template.
 */
export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) {
    console.warn("[WhatsApp] Missing credentials — message not sent.");
    return false;
  }

  const res = await fetch(
    `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${creds.apiToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   normalizeGhPhone(to),
        type: "text",
        text: { body, preview_url: false },
      }),
    }
  );

  if (!res.ok) {
    console.error("[WhatsApp] Send failed:", await res.text());
    return false;
  }
  return true;
}

/**
 * Send a pre-approved template message.
 *
 * Example usage — booking confirmation template:
 * ```ts
 * await sendWhatsAppTemplate(customerPhone, "booking_confirmation", "en", [
 *   { type: "text", text: customerName },
 *   { type: "text", text: serviceName },
 *   { type: "text", text: appointmentDate },
 * ]);
 * ```
 *
 * Templates must be approved in Meta Business Manager → WhatsApp → Message Templates.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: {
    type: "header" | "body" | "button";
    parameters?: { type: "text" | "image" | "document"; text?: string }[];
  }[]
): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) {
    console.warn("[WhatsApp] Missing credentials — template not sent.");
    return false;
  }

  const res = await fetch(
    `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${creds.apiToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   normalizeGhPhone(to),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    }
  );

  if (!res.ok) {
    console.error("[WhatsApp] Template send failed:", await res.text());
    return false;
  }
  return true;
}

/**
 * Build a wa.me click-to-chat URL for any phone + optional pre-filled message.
 * This works WITHOUT the Cloud API — just opens the customer's WhatsApp app.
 */
export function buildWaLink(phone: string, prefilledMessage?: string): string {
  const digits = normalizeGhPhone(phone);
  const base   = `https://wa.me/${digits}`;
  if (!prefilledMessage) return base;
  return `${base}?text=${encodeURIComponent(prefilledMessage)}`;
}
