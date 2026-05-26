import type { SupabaseClient } from "@supabase/supabase-js";

/** Generate a 6-digit numeric OTP */
export function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

/** Exchange a verified identity for a Supabase session token (server-side only). */
export async function createLoginSessionToken(
  supabase: SupabaseClient,
  email: string
): Promise<{ email: string; token_hash: string } | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("[Auth OTP] generateLink error:", error);
    return null;
  }

  return { email, token_hash: data.properties.hashed_token };
}
