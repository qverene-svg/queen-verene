import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { createLoginSessionToken } from "@/lib/auth/otp";

/**
 * POST /api/auth/verify-email-otp
 * Verifies the 6-digit OTP for an email address, marks it as used,
 * and returns a Supabase session token for the client to sign in with.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const normalizedEmail = normalizeAuthEmail(email.trim());
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: records } = await db
      .from("email_otps")
      .select("id, email, otp, expires_at, used")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    const record = records?.[0];

    if (!record) {
      return NextResponse.json(
        { error: "Code not found or expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.otp !== otp.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    await db.from("email_otps").update({ used: true }).eq("id", record.id);

    const session = await createLoginSessionToken(supabase, record.email);
    if (!session) {
      return NextResponse.json(
        { error: "Could not create session. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: session.email,
      token_hash: session.token_hash,
    });
  } catch (err) {
    console.error("[Verify Email OTP]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
