import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/utils";

/** Generate a 6-digit numeric OTP */
function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

/**
 * POST /api/auth/send-phone-otp
 * Looks up the user by phone number, generates a 6-digit OTP,
 * stores it in phone_otps, and sends it via Hubtel SMS.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const normalized = formatPhone(phone.trim());
    // Extract the last 9 significant digits to match various stored formats
    const digits9 = normalized.replace(/\D/g, "").slice(-9);

    // Search across common Ghana phone formats in the users table
    const { data: users } = await db
      .from("users")
      .select("id, email, full_name, phone")
      .or(`phone.eq.${normalized},phone.eq.0${digits9},phone.ilike.%${digits9}`);

    const user = users?.[0];
    if (!user) {
      return NextResponse.json(
        { error: "No account found for this phone number. Please register first." },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store OTP (older expired ones are left; we filter by expiry on verify)
    await db.from("phone_otps").insert({
      phone: normalized,
      email: user.email,
      otp,
      expires_at: expiresAt,
    });

    // Send via Hubtel SMS
    const { sendHubtelSms } = await import("@/lib/hubtelSms");
    const message = `Your Queen Verene login code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    const sent = await sendHubtelSms(normalized, message);

    if (!sent) {
      console.error("[Phone OTP] SMS failed to send to", normalized);
      return NextResponse.json(
        { error: "Could not send SMS. Please check your number and try again." },
        { status: 500 }
      );
    }

    console.log(`[Phone OTP] Code sent to ${normalized} (user: ${user.email})`);
    return NextResponse.json({ success: true, name: user.full_name });
  } catch (err) {
    console.error("[Phone OTP]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
