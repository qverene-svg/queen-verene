import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/utils";
import { addMinutes } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      serviceId,
      staffId,
      date,
      time,
      notes,
      servicePrice,
      serviceDuration,
      serviceName,
      deposit,
      customerName,
      customerPhone,
      customerEmail,
      reminderChannel, // "sms" | "email" (legacy "whatsapp" treated as "sms")
    } = body;

    if (!serviceId || !date || !time || !customerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!customerPhone && !customerEmail) {
      return NextResponse.json({ error: "A phone number or email address is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Upsert customer
    let customerId: string | null = null;
    if (customerEmail) {
      const { data: existingUser } = await db
        .from("users")
        .select("id")
        .eq("email", customerEmail)
        .single();
      customerId = existingUser?.id || null;
    }

    // Build start/end times
    const startTime = new Date(`${date}T${time}:00`);
    const endTime   = addMinutes(startTime, serviceDuration || 60);

    // Encode reminder metadata into notes field — [meta:channel=sms|email]
    const hasPhone = Boolean(customerPhone?.trim());
    const hasEmail = Boolean(customerEmail?.trim());
    const raw = (reminderChannel as string | undefined) ?? (hasPhone ? "sms" : "email");
    const normalized = raw === "whatsapp" ? "sms" : raw;
    const channel: "sms" | "email" =
      hasPhone && hasEmail ? (normalized === "email" ? "email" : "sms") : hasPhone ? "sms" : "email";
    const metaPrefix = `[meta:channel=${channel}] `;
    const notesWithMeta = metaPrefix + (notes || "");

    // Insert appointment
    const { data: appointment, error } = await db
      .from("appointments")
      .insert({
        id:                      crypto.randomUUID(),
        customer_id:             customerId,
        staff_id:                staffId || null,
        service_id:              serviceId,
        start_time:              startTime.toISOString(),
        end_time:                endTime.toISOString(),
        status:                  "pending",
        payment_status:          "unpaid",
        total_price:             servicePrice,
        deposit_paid:            0,
        notes:                   notesWithMeta,
        hubtel_transaction_ref:  null,
      })
      .select()
      .single();

    if (error) throw error;

    // Initiate Hubtel payment
    const paymentUrl = await initiateHubtelPayment({
      amount:           deposit / 100, // pesewas → GHS
      customerName,
      customerPhone:    customerPhone ? formatPhone(customerPhone) : "",
      customerEmail:    customerEmail || "",
      description:      `Verene Appointment Deposit — ${serviceName || "Beauty Service"}`,
      callbackUrl:      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      returnUrl:        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      cancellationUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/services`,
      clientReference:  appointment.id,
    });

    // Send immediate booking-received message via chosen channel (fire-and-forget)
    if (channel === "sms" && customerPhone) {
      sendBookingSms({
        customerName,
        customerPhone: formatPhone(customerPhone),
        appointment,
        serviceName: serviceName || "your service",
      }).catch(console.error);
    } else if (channel === "email" && customerEmail) {
      sendBookingReceivedEmail({
        customerName,
        customerEmail,
        serviceName: serviceName || "Beauty Service",
        startTime: appointment.start_time,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, appointmentId: appointment.id, paymentUrl });
  } catch (err) {
    console.error("[Booking API]", err);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}

// ── Hubtel ────────────────────────────────────────────────────────────────────

async function initiateHubtelPayment({
  amount, customerName, customerPhone, customerEmail,
  description, callbackUrl, returnUrl, cancellationUrl, clientReference,
}: {
  amount: number; customerName: string; customerPhone: string; customerEmail: string;
  description: string; callbackUrl: string; returnUrl: string;
  cancellationUrl: string; clientReference: string;
}): Promise<string | null> {
  const clientId        = process.env.HUBTEL_CLIENT_ID;
  const clientSecret    = process.env.HUBTEL_CLIENT_SECRET;
  const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

  if (!clientId || !clientSecret || clientId === "your_hubtel_client_id") return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
    body: JSON.stringify({
      totalAmount: amount, description, callbackUrl, returnUrl, cancellationUrl,
      merchantAccountNumber: merchantAccount, clientReference,
      customerName, customerMsisdn: customerPhone, customerEmail,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.checkoutUrl || null;
}

// ── Hubtel SMS (booking received) ─────────────────────────────────────────────

async function sendBookingSms({
  customerName, customerPhone, appointment, serviceName,
}: {
  customerName: string; customerPhone: string;
  appointment: { start_time: string; id: string }; serviceName: string;
}) {
  const date = new Date(appointment.start_time).toLocaleString("en-GH", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const message = `Hi ${customerName}! Your Queen Verene booking for ${serviceName} on ${date} has been received. Complete your GHS 50 deposit to confirm. You'll get SMS reminders on the morning of your appointment and 6 hours before. Queen Verene Beauty Studio, Accra.`;

  const { sendHubtelSms } = await import("@/lib/hubtelSms");
  await sendHubtelSms(customerPhone, message);
}

// ── Email: booking received (before payment) ──────────────────────────────────

async function sendBookingReceivedEmail({
  customerName, customerEmail, serviceName, startTime,
}: {
  customerName: string; customerEmail: string; serviceName: string; startTime: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "your_resend_api_key") return;

  const date = new Date(startTime).toLocaleString("en-GH", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? "qverene@gmail.com",
    to:      customerEmail,
    subject: "Your Verene Booking Request — Complete Your Deposit ✨",
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:14px;overflow:hidden;max-width:560px;width:100%;">
<tr><td height="4" style="background:linear-gradient(90deg,#b22222,#d4af37,#b22222);"></td></tr>
<tr><td style="padding:32px 36px 20px;border-bottom:1px solid #222;">
  <p style="margin:0 0 2px;color:#d4af37;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:Helvetica,sans-serif;">✦ Queen ✦</p>
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VERENE</h1>
</td></tr>
<tr><td style="padding:28px 36px;">
  <h2 style="margin:0 0 8px;color:#d4af37;font-size:18px;font-weight:normal;">Booking Received</h2>
  <p style="margin:0 0 16px;color:#ccc;font-size:14px;">Dear ${customerName},</p>
  <p style="margin:0 0 20px;color:#aaa;font-size:13px;line-height:1.7;">
    We've received your booking request for <strong style="color:#fff;">${serviceName}</strong>
    on <strong style="color:#d4af37;">${date}</strong>.
  </p>
  <p style="margin:0 0 20px;color:#aaa;font-size:13px;line-height:1.7;">
    Please complete your <strong style="color:#d4af37;">GHS 50 deposit</strong> via the link you received to confirm your slot.
  </p>
  <p style="margin:0;color:#666;font-size:12px;">You'll receive a reminder the morning of your appointment and 6 hours before. — Queen Verene Beauty Studio, Accra</p>
</td></tr>
<tr><td height="4" style="background:linear-gradient(90deg,#d4af37,#b22222,#d4af37);"></td></tr>
</table>
</td></tr>
</table>
</body></html>
    `,
  });
}
