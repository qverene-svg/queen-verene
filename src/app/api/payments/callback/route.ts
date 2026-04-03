import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Data } = body;
    if (!Data) return NextResponse.json({ status: "ignored" });

    const { ClientReference, Status, TransactionId, Amount } = Data;

    if (Status !== "Success") {
      return NextResponse.json({ status: "payment_failed" });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Fetch appointment with customer info for notifications
    const { data: appt } = await db
      .from("appointments")
      .select(`
        id, start_time,
        users:customer_id ( full_name, email, phone ),
        services:service_id ( name )
      `)
      .eq("id", ClientReference)
      .single();

    // Update appointment payment status → confirmed
    await db
      .from("appointments")
      .update({
        payment_status:         "deposit_paid",
        status:                 "confirmed",
        deposit_paid:           Math.round(Amount * 100), // GHS → pesewas
        hubtel_transaction_ref: TransactionId,
      })
      .eq("id", ClientReference);

    // Send booking-confirmation email via Resend (fire-and-forget)
    if (appt) {
      sendConfirmationEmail({
        customerName:  appt.users?.full_name  ?? "Valued Client",
        customerEmail: appt.users?.email      ?? null,
        customerPhone: appt.users?.phone      ?? null,
        serviceName:   appt.services?.name    ?? "Beauty Service",
        startTime:     appt.start_time,
        depositAmount: Amount,
      }).catch(console.error);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[Payment callback]", err);
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}

// ── Resend email confirmation ─────────────────────────────────────────────────

async function sendConfirmationEmail({
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  startTime,
  depositAmount,
}: {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceName: string;
  startTime: string;
  depositAmount: number;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "your_resend_api_key" || !customerEmail) return;

  const date = new Date(startTime).toLocaleString("en-GH", {
    weekday:  "long",
    year:     "numeric",
    month:    "long",
    day:      "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
  });

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? "hello@verene.com",
    to:      customerEmail,
    subject: `Your Verene Appointment is Confirmed ✨`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Gold top bar -->
        <tr><td height="4" style="background:linear-gradient(90deg,#b22222,#d4af37,#b22222);"></td></tr>

        <!-- Header -->
        <tr><td style="padding:36px 40px 24px;border-bottom:1px solid #222;">
          <p style="margin:0 0 2px;color:#d4af37;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:Helvetica,sans-serif;">✦ Queen ✦</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VERENE</h1>
          <p style="margin:6px 0 0;color:#666;font-size:11px;font-family:Helvetica,sans-serif;letter-spacing:1px;">Premium Beauty Studio · Accra, Ghana</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#d4af37;font-size:20px;font-weight:normal;">Booking Confirmed</h2>
          <p style="margin:0 0 24px;color:#cccccc;font-size:15px;">Dear ${customerName},</p>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            Your appointment has been confirmed and your deposit payment of
            <strong style="color:#d4af37;"> GHS ${depositAmount.toFixed(2)}</strong> has been received.
            We look forward to making you feel extraordinary!
          </p>

          <!-- Booking card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 16px;color:#d4af37;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Helvetica,sans-serif;">Appointment Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#666;font-size:12px;padding-bottom:10px;width:100px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Service</td>
                  <td style="color:#ffffff;font-size:14px;font-weight:bold;padding-bottom:10px;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:12px;padding-bottom:10px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Date & Time</td>
                  <td style="color:#ffffff;font-size:14px;font-weight:bold;padding-bottom:10px;">${date}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:12px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Deposit Paid</td>
                  <td style="color:#d4af37;font-size:16px;font-weight:bold;">GHS ${depositAmount.toFixed(2)}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.7;">
            Reminder: Please arrive 10 minutes before your appointment time.
            If you need to reschedule, contact us at least 24 hours in advance.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td style="background:#b22222;border-radius:50px;padding:14px 32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="color:#ffffff;text-decoration:none;font-family:Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                View My Appointments →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;color:#444;font-size:11px;font-family:Helvetica,sans-serif;line-height:1.6;">
            Queen Verene Beauty Studio · Accra, Ghana<br/>
            <a href="mailto:hello@verene.com" style="color:#666;text-decoration:none;">hello@verene.com</a>
          </p>
        </td></tr>

        <!-- Gold bottom bar -->
        <tr><td height="4" style="background:linear-gradient(90deg,#d4af37,#b22222,#d4af37);"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}
