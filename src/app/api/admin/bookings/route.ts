import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { addMinutes } from "date-fns";

/**
 * POST /api/admin/bookings
 * Creates a confirmed booking without payment.
 * Sends a confirmation SMS or email to the customer immediately.
 * Only accessible by admin or manager roles.
 *
 * NOTE — Email sender:
 *   RESEND_FROM_EMAIL must be an address on a domain you have verified in the
 *   Resend dashboard (https://resend.com/domains).  Gmail / Yahoo / Hotmail
 *   addresses are rejected by Resend.  Use e.g. "hello@yourdomain.com".
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: profile } = await db.from("users").select("role").eq("id", user.id).single();
    const role = profile?.role?.toLowerCase();
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Forbidden — admin or manager only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      serviceId,
      serviceName,
      servicePrice,
      serviceDuration,
      staffId,
      date,
      time,
      customerName,
      customerPhone,
      customerEmail,
      reminderChannel, // "sms" | "email"
      notes,
    } = body;

    if (!serviceId || !date || !time || !customerName) {
      return NextResponse.json({ error: "serviceId, date, time, and customerName are required" }, { status: 400 });
    }
    if (!customerPhone && !customerEmail) {
      return NextResponse.json({ error: "Phone number or email is required" }, { status: 400 });
    }

    // ── Determine notification channel ──────────────────────────────────────
    const hasPhone = Boolean(customerPhone?.trim());
    const hasEmail = Boolean(customerEmail?.trim());
    const channel: "sms" | "email" =
      reminderChannel === "email" ? "email" :
      reminderChannel === "sms"   ? "sms"   :
      hasPhone ? "sms" : "email";

    // Encode contact info into notes meta (same format as customer bookings)
    const metaPrefix = `[meta:${new URLSearchParams({
      channel,
      name:  customerName,
      phone: customerPhone?.trim() ?? "",
      email: customerEmail?.trim() ?? "",
    }).toString()}] `;
    const notesWithMeta = metaPrefix + (notes || "");

    // ── Look up customer in users table (null for walk-ins) ─────────────────
    let customerId: string | null = null;
    if (customerEmail) {
      const { data: existingUser } = await db.from("users").select("id").eq("email", customerEmail).single();
      customerId = existingUser?.id || null;
    }

    // ── Build start / end times ─────────────────────────────────────────────
    const startTime = new Date(`${date}T${time}:00`);
    const endTime   = addMinutes(startTime, serviceDuration || 60);

    // ── Insert appointment ──────────────────────────────────────────────────
    // status: "confirmed" — no payment required for admin-created bookings
    const appointmentId = crypto.randomUUID();
    const { data: appointment, error } = await db
      .from("appointments")
      .insert({
        id:             appointmentId,
        customer_id:    customerId,
        staff_id:       staffId || null,
        service_id:     serviceId,
        start_time:     startTime.toISOString(),
        end_time:       endTime.toISOString(),
        status:         "confirmed",
        payment_status: "unpaid",
        total_price:    servicePrice || 0,
        deposit_paid:   0,
        notes:          notesWithMeta,
      })
      .select()
      .single();

    if (error) {
      console.error("[Admin Booking] Supabase insert error:", JSON.stringify(error));
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // ── Send confirmation notification (awaited so errors surface in logs) ──
    const apptDate = startTime.toLocaleString("en-GH", {
      weekday: "long", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const confirmMsg =
      `Hi ${customerName}! Your Verene appointment for ${serviceName || "Beauty Service"} on ${apptDate} has been confirmed. We look forward to seeing you!`;

    let notifStatus = "not_sent";

    if (channel === "sms" && customerPhone) {
      try {
        const { sendHubtelSms } = await import("@/lib/hubtelSms");
        const sent = await sendHubtelSms(customerPhone, confirmMsg);
        notifStatus = sent ? "sms_sent" : "sms_failed";
        if (!sent) console.error("[Admin Booking] SMS was not delivered — check Hubtel credentials & number format.");
      } catch (e) {
        console.error("[Admin Booking] SMS exception:", e);
        notifStatus = "sms_error";
      }
    } else if (channel === "email" && customerEmail) {
      try {
        await sendAdminBookingEmail({
          customerName,
          customerEmail,
          serviceName: serviceName || "Beauty Service",
          startTime:   startTime.toISOString(),
        });
        notifStatus = "email_sent";
      } catch (e) {
        console.error("[Admin Booking] Email exception:", e);
        notifStatus = "email_error";
      }
    }

    console.log(`[Admin Booking] Created ${appointmentId} — notification: ${notifStatus}`);
    return NextResponse.json({ success: true, appointmentId: appointment.id, notifStatus });
  } catch (err) {
    console.error("[Admin Booking]", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// ── Confirmation email ────────────────────────────────────────────────────────

async function sendAdminBookingEmail({
  customerName, customerEmail, serviceName, startTime,
}: {
  customerName: string; customerEmail: string;
  serviceName: string; startTime: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "your_resend_api_key") {
    console.warn("[Admin Booking] RESEND_API_KEY not configured — skipping email.");
    return;
  }

  // Resend requires the sender to be on a verified domain.
  // Gmail / Yahoo / Hotmail addresses will be rejected.
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@verene.com";
  const fromDomain = fromEmail.split("@")[1] ?? "";
  const freeProviders = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com"];
  if (freeProviders.includes(fromDomain.toLowerCase())) {
    console.error(
      `[Admin Booking] Cannot send via Resend from "${fromEmail}". ` +
      "Add a verified custom domain in https://resend.com/domains and update RESEND_FROM_EMAIL."
    );
    return;
  }

  const date = new Date(startTime).toLocaleString("en-GH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  const { error } = await resend.emails.send({
    from:    `Queen Verene <${fromEmail}>`,
    to:      customerEmail,
    subject: "Your Verene Appointment is Confirmed ✨",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td height="4" style="background:linear-gradient(90deg,#b22222,#d4af37,#b22222);"></td></tr>
        <tr><td style="padding:36px 40px 24px;border-bottom:1px solid #222;">
          <p style="margin:0 0 2px;color:#d4af37;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:Helvetica,sans-serif;">✦ Queen ✦</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VERENE</h1>
          <p style="margin:6px 0 0;color:#666;font-size:11px;font-family:Helvetica,sans-serif;letter-spacing:1px;">Premium Beauty Studio · Accra, Ghana</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#d4af37;font-size:20px;font-weight:normal;">Appointment Confirmed</h2>
          <p style="margin:0 0 24px;color:#cccccc;font-size:15px;">Dear ${customerName},</p>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            Your appointment has been confirmed by our team. No deposit is required — we look forward to seeing you!
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 16px;color:#d4af37;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Helvetica,sans-serif;">Appointment Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#666;font-size:12px;padding-bottom:10px;width:100px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Service</td>
                  <td style="color:#ffffff;font-size:14px;font-weight:bold;padding-bottom:10px;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:12px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Date &amp; Time</td>
                  <td style="color:#ffffff;font-size:14px;font-weight:bold;">${date}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0;color:#555;font-size:12px;line-height:1.7;font-family:Helvetica,sans-serif;">
            Please arrive 10 minutes before your appointment. If you need to reschedule, contact us at least 24 hours in advance.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;color:#444;font-size:11px;font-family:Helvetica,sans-serif;line-height:1.6;">
            Queen Verene Beauty Studio · Accra, Ghana<br/>
            <a href="mailto:qverene@gmail.com" style="color:#666;text-decoration:none;">qverene@gmail.com</a>
          </p>
        </td></tr>
        <tr><td height="4" style="background:linear-gradient(90deg,#d4af37,#b22222,#d4af37);"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}
