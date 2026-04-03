/**
 * Public contact numbers — set in `.env.local` (Vercel env in production):
 *   NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER  → WhatsApp chat & wa.me links (+233269892224)
 *   NEXT_PUBLIC_CALL_NUMBER               → voice call line (+233539523961)
 *   NEXT_PUBLIC_CALL_NUMBER_2             → legacy alias for CALL_NUMBER
 */

/** Normalize env phone values to +233… (handles +233, 233, 0XX, or 9-digit mobile). */
function normalizeGhanaE164(raw: string | undefined, fallbackDigits: string): string {
  const fb = fallbackDigits.replace(/\D/g, "");
  const t = (raw ?? "").trim();
  if (!t) return `+${fb}`;
  let d = t.replace(/\D/g, "");
  if (d.startsWith("0")) d = `233${d.slice(1)}`;
  else if (!d.startsWith("233")) d = `233${d}`;
  return `+${d}`;
}

/** WhatsApp Business / primary chat number */
export const WHATSAPP_BUSINESS_NUMBER = normalizeGhanaE164(
  process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER,
  "233269892224"
);

/** Main phone number for voice calls */
export const CALL_NUMBER = normalizeGhanaE164(
  process.env.NEXT_PUBLIC_CALL_NUMBER ?? process.env.NEXT_PUBLIC_CALL_NUMBER_2,
  "233539523961"
);

/** @deprecated use CALL_NUMBER */
export const SECONDARY_CALL_NUMBER = CALL_NUMBER;

/** +233XXXXXXXXX → +233 XX XXX XXXX */
export function formatGhanaPhoneDisplay(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("233")) {
    const r = d.slice(3);
    return `+233 ${r.slice(0, 2)} ${r.slice(2, 5)} ${r.slice(5)}`;
  }
  return e164;
}

export function waMeDigits(e164: string): string {
  return e164.replace(/\D/g, "").replace(/^0/, "233");
}

/** Open WhatsApp chat to the business number (optional pre-filled message). */
export function businessWhatsAppHref(prefillMessage?: string): string {
  const base = `https://wa.me/${waMeDigits(WHATSAPP_BUSINESS_NUMBER)}`;
  if (!prefillMessage?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefillMessage)}`;
}
