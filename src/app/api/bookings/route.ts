import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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
    const userClient = await createClient();
    const {
      data: { user: authUser },
    } = await userClient.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Prefer authenticated user so dashboard bookings always link correctly.
    let customerId: string | null = authUser?.id ?? null;
    if (!customerId && customerEmail) {
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
    const metaPrefix = `[meta:${new URLSearchParams({
      channel,
      name: customerName,
      phone: customerPhone?.trim() ?? "",
      email: customerEmail?.trim() ?? "",
    }).toString()}] `;
    const notesWithMeta = metaPrefix + (notes || "");

    // Insert appointment — only include columns that are guaranteed to exist
    const insertPayload: Record<string, unknown> = {
      id:             crypto.randomUUID(),
      customer_id:    customerId,
      staff_id:       staffId || null,
      service_id:     serviceId,
      start_time:     startTime.toISOString(),
      end_time:       endTime.toISOString(),
      status:         "pending",
      payment_status: "unpaid",
      total_price:    servicePrice,
      deposit_paid:   0,
      notes:          notesWithMeta,
    };

    const { data: appointment, error } = await db
      .from("appointments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[Booking API] Supabase insert error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Database error: ${error.message || "Could not save booking"}` },
        { status: 500 }
      );
    }

    // Initiate Hubtel payment
    const { paymentUrl, hubtelError } = await initiateHubtelPayment({
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

    if (hubtelError) {
      console.error("[Booking API] Hubtel payment error:", hubtelError);
    }

    // ── Immediate "booking received" notification ──────────────────────────────
    // Send right away so the customer knows their booking was received.
    // A second "confirmed" notification fires via /api/payments/callback after payment.
    if (paymentUrl) {
      const apptTime = new Date(`${date}T${time}:00`);
      const formattedDate = apptTime.toLocaleString("en-GH", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const depositGhs = (deposit / 100).toFixed(2);
      const pendingMsg = `Hi ${customerName}! Your Verene booking for ${serviceName || "your service"} on ${formattedDate} is received. Please complete your GHS ${depositGhs} deposit to confirm your slot.`;

      if (channel === "sms" && customerPhone) {
        import("@/lib/hubtelSms")
          .then(({ sendHubtelSms }) => sendHubtelSms(formatPhone(customerPhone), pendingMsg))
          .catch((e) => console.error("[Booking] pending SMS failed:", e));
      } else if (channel === "email" && customerEmail) {
        sendPendingBookingEmail({
          customerName,
          customerEmail,
          serviceName: serviceName || "Beauty Service",
          startTime: apptTime.toISOString(),
          depositAmount: deposit / 100,
          paymentUrl,
        }).catch((e) => console.error("[Booking] pending email failed:", e));
      }
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
}): Promise<{ paymentUrl: string | null; hubtelError: string | null }> {
  const clientId        = process.env.HUBTEL_CLIENT_ID;
  const clientSecret    = process.env.HUBTEL_CLIENT_SECRET;
  const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

  if (!clientId || !clientSecret || clientId === "your_hubtel_client_id") {
    return { paymentUrl: null, hubtelError: "Hubtel credentials not configured" };
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    // Hubtel expects merchant account number without '+' prefix
    const merchantAccountNumber = (merchantAccount || "").replace(/^\+/, "");
    // Strip '+' from phone too — Hubtel prefers 233XXXXXXXXX format
    const msisdn = (customerPhone || "").replace(/^\+/, "");
    const requestBody = {
      totalAmount: amount, description, callbackUrl, returnUrl, cancellationUrl,
      merchantAccountNumber, clientReference,
      customerName, customerMsisdn: msisdn, customerEmail,
    };
    console.log("[Hubtel] Initiating payment:", JSON.stringify(requestBody));
    const res = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log("[Hubtel] Status:", res.status, "Response:", JSON.stringify(data));

    if (!res.ok) {
      const msg = data?.message || data?.error || data?.Message || `HTTP ${res.status}`;
      return { paymentUrl: null, hubtelError: msg };
    }

    // Try all known field names across different Hubtel API versions
    const url =
      data?.data?.checkoutUrl      ||
      data?.data?.paylinkUrl        ||
      data?.data?.paylink_url       ||
      data?.data?.url               ||
      data?.data?.redirectUrl       ||
      data?.data?.authorizationUrl  ||
      data?.data?.CheckoutUrl       ||
      data?.data?.PaymentUrl        ||
      data?.checkoutUrl             ||
      data?.paylinkUrl              ||
      data?.redirectUrl             ||
      data?.authorizationUrl        ||
      data?.url                     ||
      // Deep scan: find the first string value that looks like a URL in the response
      (() => {
        const scan = (obj: unknown): string | null => {
          if (typeof obj === "string" && obj.startsWith("http") && obj.length > 20) return obj;
          if (obj && typeof obj === "object") {
            for (const v of Object.values(obj as Record<string, unknown>)) {
              const found = scan(v);
              if (found) return found;
            }
          }
          return null;
        };
        const found = scan(data);
        if (found) console.log("[Hubtel] URL found via deep scan:", found);
        return found;
      })() ||
      null;

    if (!url) {
      console.error("[Hubtel] Could not find a checkout URL. Top-level keys:", Object.keys(data || {}));
      if (data?.data && typeof data.data === "object") {
        console.error("[Hubtel] data.data keys:", Object.keys(data.data));
      }
    }

    return { paymentUrl: url, hubtelError: url ? null : "No checkout URL in Hubtel response" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Hubtel error";
    return { paymentUrl: null, hubtelError: msg };
  }
}

// ── Pending booking email ──────────────────────────────────────────────────────

async function sendPendingBookingEmail({
  customerName,
  customerEmail,
  serviceName,
  startTime,
  depositAmount,
  paymentUrl,
}: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  startTime: string;
  depositAmount: number;
  paymentUrl: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "your_resend_api_key") return;

  const date = new Date(startTime).toLocaleString("en-GH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "hello@verene.com",
    to: customerEmail,
    subject: `Complete Your Verene Booking — Payment Required`,
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
          <p style="margin:6px 0 0;color:#666;font-size:11px;font-family:Helvetica,sans-serif;letter-spacing:1px;">Premium Beauty Studio · Accra, Ghana</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#d4af37;font-size:20px;font-weight:normal;">Booking Received</h2>
          <p style="margin:0 0 24px;color:#cccccc;font-size:15px;">Dear ${customerName},</p>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            Your appointment request has been received! Please complete your deposit payment of
            <strong style="color:#d4af37;"> GHS ${depositAmount.toFixed(2)}</strong> to confirm your slot.
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
                  <td style="color:#666;font-size:12px;padding-bottom:10px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Date & Time</td>
                  <td style="color:#ffffff;font-size:14px;font-weight:bold;padding-bottom:10px;">${date}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:12px;font-family:Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;">Deposit Due</td>
                  <td style="color:#d4af37;font-size:16px;font-weight:bold;">GHS ${depositAmount.toFixed(2)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr><td style="background:#b22222;border-radius:50px;padding:14px 32px;">
              <a href="${paymentUrl}" style="color:#ffffff;text-decoration:none;font-family:Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                Pay Deposit Now →
              </a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;color:#555;font-size:12px;line-height:1.6;font-family:Helvetica,sans-serif;">
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            <a href="${paymentUrl}" style="color:#d4af37;word-break:break-all;">${paymentUrl}</a>
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
}

