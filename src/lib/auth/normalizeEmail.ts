/** Supabase stores emails lowercased; trim avoids accidental spaces from paste. */
export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}
