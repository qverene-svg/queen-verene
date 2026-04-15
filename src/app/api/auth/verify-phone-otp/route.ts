import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/utils";

/**
 * POST /api/auth/verify-phone-otp
 * Verifies the 6-digit OTP for a phone number, marks it as used,
 * and returns a Supabase magic-link token for the client to sign in with.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    if (!phone?.trim() || !otp?.trim()) {
      return NextResponse.json({ error: "Phone and code are required." }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const normalized = formatPhone(phone.trim());

    // Find a valid, unused, non-expired OTP record
    const { data: records } = await db
      .from("phone_otps")
      .select("id, email, otp, expires_at, used")
      .eq("phone", normalized)
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

    // Mark OTP as used immediately to prevent replay
    await db.from("phone_otps").update({ used: true }).eq("id", record.id);

    // Generate a Supabase magic-link token for the user's email so the client
    // can call supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: record.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[Phone OTP] generateLink error:", linkError);
      return NextResponse.json(
        { error: "Could not create session. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: record.email,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (err) {
    console.error("[Verify Phone OTP]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
