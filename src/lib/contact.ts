/**
 * Public phone numbers — configure in `.env.local`:
 * - NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER (main WhatsApp / primary line)
 * - NEXT_PUBLIC_CALL_NUMBER_2 (additional call line)
 */
export const WHATSAPP_BUSINESS_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER ?? "").trim() || "+233269892224";

export const SECONDARY_CALL_NUMBER =
  (process.env.NEXT_PUBLIC_CALL_NUMBER_2 ?? "").trim() || "+233539523961";

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
