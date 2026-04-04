/** Supabase stores emails lowercased; trim avoids accidental spaces from paste. */
export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Converts a Ghana phone number into a deterministic synthetic Supabase-auth email.
 * e.g. "0539523961" → "p_233539523961@verene.phone"
 *      "+233539523961" → "p_233539523961@verene.phone"
 */
export function phoneToAuthEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // 0xxxxxxxxx → 233xxxxxxxxx
  const normalized = digits.startsWith("0") ? "233" + digits.slice(1) : digits;
  return `p_${normalized}@verene.phone`;
}

/**
 * Returns true when the input looks like a phone number rather than an email.
 * Accepts: starts with 0, +, or is pure digits (with optional spaces/dashes).
 */
export function isPhoneInput(input: string): boolean {
  const cleaned = input.replace(/[\s\-()]/g, "");
  return !cleaned.includes("@") && /^[+0]?\d{6,}$/.test(cleaned);
}
