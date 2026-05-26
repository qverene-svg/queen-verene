import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { generateOtp } from "@/lib/auth/otp";

/**
 * POST /api/auth/send-email-otp
 * Looks up the user by email, generates a 6-digit OTP,
 * stores it in email_otps, and sends it via Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const normalizedEmail = normalizeAuthEmail(email.trim());
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: user } = await db
      .from("users")
      .select("id, email, full_name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this email. Please register first." },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.from("email_otps").insert({
      email: normalizedEmail,
      otp,
      expires_at: expiresAt,
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || resendKey === "your_resend_api_key") {
      console.error("[Email OTP] RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Could not send email. Please try again later." },
        { status: 500 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@verene.com";
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: "Your Queen Verene login code",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td height="4" style="background:linear-gradient(90deg,#b22222,#d4af37,#b22222);"></td></tr>
        <tr><td style="padding:36px 40px 24px;border-bottom:1px solid #222;">
          <p style="margin:0 0 2px;color:#d4af37;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:Helvetica,sans-serif;">✦ Queen ✦</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VERENE</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#d4af37;font-size:20px;font-weight:normal;">Your login code</h2>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            Hi ${user.full_name || "there"}, use this 6-digit code to sign in to your Queen Verene account.
          </p>
          <p style="margin:0 0 8px;color:#666;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Helvetica,sans-serif;">Login code</p>
          <p style="margin:0 0 24px;color:#ffffff;font-size:36px;font-weight:700;letter-spacing:0.35em;font-family:Helvetica,sans-serif;">${otp}</p>
          <p style="margin:0;color:#666;font-size:12px;line-height:1.6;font-family:Helvetica,sans-serif;">
            This code expires in 10 minutes. Do not share it with anyone.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (sendError) {
      console.error("[Email OTP] Resend error:", sendError);
      return NextResponse.json(
        { error: "Could not send email. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Email OTP] Code sent to ${normalizedEmail}`);
    return NextResponse.json({ success: true, name: user.full_name });
  } catch (err) {
    console.error("[Email OTP]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
