import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addHours } from "date-fns";

/**
 * POST /api/reminders
 *
 * Run this cron every 30 minutes (e.g. via Vercel Cron or an external service).
 *
 * On each run it checks two windows:
 *  1. SIX-HOUR REMINDER  — appointments starting in 5.5 h – 6.5 h from now
 *  2. MORNING REMINDER   — appointments starting today, >6.5 h from now,
 *                          and the current Ghana time is 06:30 – 09:00
 *
 * The reminder channel ("whatsapp" | "email") is stored in the appointment's
 * notes field as a prefix:  [meta:channel=whatsapp] ...user note...
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const now      = new Date();
    // Ghana is UTC+0 (no DST), so UTC == Ghana time
    const ghanaHour   = now.getUTCHours();
    const isMorningWindow = ghanaHour >= 6 && ghanaHour < 9;

    // Window 1: 6-hour reminder (5.5h → 6.5h)
    const sixHStart = addHours(now, 5.5);
    const sixHEnd   = addHours(now, 6.5);

    // Window 2: same-day morning reminder (>6.5h from now, today in Ghana)
    // Start of today (midnight Ghana) and end of today (23:59:59)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    const sixHalfFromNow = addHours(now, 6.5);

    let sixHAppts   : Record<string, unknown>[] = [];
    let morningAppts: Record<string, unknown>[] = [];

    // Fetch 6-hour window appointments
    const { data: sixH } = await db
      .from("appointments")
      .select("*, users:customer_id(full_name, email, phone), services:service_id(name)")
      .eq("status", "confirmed")
      .gte("start_time", sixHStart.toISOString())
      .lte("start_time", sixHEnd.toISOString());
    if (sixH) sixHAppts = sixH;

    // Fetch morning-of appointments (only during the 06:30–09:00 Ghana window)
    if (isMorningWindow) {
      const { data: morning } = await db
        .from("appointments")
        .select("*, users:customer_id(full_name, email, phone), services:service_id(name)")
        .eq("status", "confirmed")
        .gte("start_time", sixHalfFromNow.toISOString()) // >6.5h away so no overlap with 6h reminder
        .lte("start_time", todayEnd.toISOString())
        .gte("start_time", todayStart.toISOString());
      if (morning) morningAppts = morning;
    }

    let sent = 0;

    for (const appt of sixHAppts) {
      await sendReminder(appt, "sixhour");
      sent++;
    }
    for (const appt of morningAppts) {
      await sendReminder(appt, "morning");
      sent++;
    }

    return NextResponse.json({ sent, sixH: sixHAppts.length, morning: morningAppts.length });
  } catch (err) {
    console.error("[Reminders]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── Parse channel from notes field ───────────────────────────────────────────

function parseChannel(notes: string | null): "whatsapp" | "email" {
  if (!notes) return "email";
  const match = notes.match(/\[meta:channel=(\w+)\]/);
  return (match?.[1] === "whatsapp") ? "whatsapp" : "email";
}

// ── Send a reminder via the customer's chosen channel ────────────────────────

async function sendReminder(
  appt: Record<string, unknown>,
  type: "sixhour" | "morning"
) {
  const customer  = appt.users  as { full_name: string; email: string; phone: string } | null;
  const service   = appt.services as { name: string } | null;
  const notes     = appt.notes   as string | null;
  if (!customer) return;

  const channel = parseChannel(notes);

  const apptDate = new Date(appt.start_time as string).toLocaleString("en-GH", {
    weekday: "long", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const serviceName = service?.name ?? "your appointment";
  const customerName = customer.full_name;

  const sixHMsg     = `Hi ${customerName}! ⏰ Just a reminder — your *${serviceName}* appointment at *Queen Verene* is in 6 hours (${apptDate}). We look forward to seeing you! 💛`;
  const morningMsg  = `Good morning, ${customerName}! 🌅 Your *${serviceName}* appointment at *Queen Verene* is *today* at *${apptDate}*. Please arrive 10 minutes early. See you soon! 💛`;
  const message     = type === "sixhour" ? sixHMsg : morningMsg;

  const subjectMap = {
    sixhour: `⏰ Reminder: Your Verene Appointment is in 6 Hours`,
    morning: `🌅 Today's Your Appointment at Verene!`,
  };

  if (channel === "whatsapp" && customer.phone) {
    await sendWhatsApp(customer.phone, message);
  } else if (channel === "email" && customer.email) {
    await sendReminderEmail({
      to:          customer.email,
      subject:     subjectMap[type],
      customerName,
      serviceName,
      apptDate,
      type,
    });
  }
}

// ── WhatsApp via Meta Business Cloud API ─────────────────────────────────────

async function sendWhatsApp(rawPhone: string, message: string) {
  const { sendWhatsAppText } = await import("@/lib/whatsapp");
  await sendWhatsAppText(rawPhone, message);
}

// ── Email reminder via Resend ─────────────────────────────────────────────────

async function sendReminderEmail({
  to, subject, customerName, serviceName, apptDate, type,
}: {
  to: string; subject: string; customerName: string;
  serviceName: string; apptDate: string; type: "sixhour" | "morning";
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === "your_resend_api_key") return;

  const emoji   = type === "sixhour" ? "⏰" : "🌅";
  const headline = type === "sixhour"
    ? "Your appointment is in <strong style='color:#d4af37;'>6 hours</strong>"
    : "Your appointment is <strong style='color:#d4af37;'>today</strong>";

  const { Resend } = await import("resend");
  await new Resend(resendKey).emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? "qverene@gmail.com",
    to,
    subject,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:14px;overflow:hidden;max-width:560px;width:100%;">
<tr><td height="4" style="background:linear-gradient(90deg,#b22222,#d4af37,#b22222);"></td></tr>
<tr><td style="padding:28px 36px 16px;border-bottom:1px solid #222;">
  <p style="margin:0 0 2px;color:#d4af37;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:Helvetica,sans-serif;">✦ Queen ✦</p>
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VERENE</h1>
</td></tr>
<tr><td style="padding:28px 36px;">
  <p style="font-size:28px;margin:0 0 12px;">${emoji}</p>
  <h2 style="margin:0 0 8px;color:#fff;font-size:18px;font-weight:normal;">${headline}</h2>
  <p style="margin:0 0 20px;color:#ccc;font-size:14px;">Dear ${customerName},</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:10px;margin-bottom:20px;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 8px;color:#d4af37;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Helvetica,sans-serif;">Appointment Details</p>
    <p style="margin:0 0 4px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Service</p>
    <p style="margin:0 0 12px;color:#fff;font-size:14px;font-weight:bold;">${serviceName}</p>
    <p style="margin:0 0 4px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Date &amp; Time</p>
    <p style="margin:0;color:#d4af37;font-size:14px;font-weight:bold;">${apptDate}</p>
  </td></tr>
  </table>
  <p style="margin:0;color:#666;font-size:12px;line-height:1.7;">Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible. — Queen Verene Beauty Studio, Accra</p>
</td></tr>
<tr><td height="4" style="background:linear-gradient(90deg,#d4af37,#b22222,#d4af37);"></td></tr>
</table>
</td></tr>
</table>
</body></html>
    `,
  });
}
