import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/send-link-sms
 * Sends a Hubtel payment link to a customer via SMS.
 * Admin/manager only.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { phone, name, amount, description, paymentUrl } = await req.json();
    if (!phone || !paymentUrl) {
      return NextResponse.json({ error: "phone and paymentUrl are required" }, { status: 400 });
    }

    const message =
      `Hi ${name || "there"}! Here is your Queen Verene payment link for ${description} — GHS ${Number(amount).toFixed(2)}. ` +
      `Pay here: ${paymentUrl}`;

    const { sendHubtelSms } = await import("@/lib/hubtelSms");
    const sent = await sendHubtelSms(phone, message);

    if (!sent) {
      return NextResponse.json({ error: "SMS could not be delivered. Check Hubtel SMS balance." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-link-sms]", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
