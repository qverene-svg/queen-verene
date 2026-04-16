import { NextRequest, NextResponse } from "next/server";
import { buildHubtelCheckoutUrl } from "@/lib/hubtelCheckout";
import { formatPhone } from "@/lib/utils";

/**
 * POST /api/payments/walkin
 * Walk-in and admin-initiated balance payments.
 * Uses the identical Hubtel checkout code as /api/bookings/route.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, description, clientReference, customerPhone } = await req.json();

    if (!amount || !description || !clientReference) {
      return NextResponse.json(
        { error: "amount, description and clientReference are required" },
        { status: 400 }
      );
    }

    const proto       = req.headers.get("x-forwarded-proto") || "https";
    const host        = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl      = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");
    const callbackUrl = `${appUrl}/api/payments/callback`;

    // Format phone exactly as the booking route does before passing to Hubtel
    const formattedPhone = customerPhone ? formatPhone(customerPhone) : "";

    const { paymentUrl, hubtelError } = await buildHubtelCheckoutUrl({
      amount,
      description,
      clientReference,
      customerPhone: formattedPhone,
      callbackUrl,
    });

    if (hubtelError || !paymentUrl) {
      return NextResponse.json({ error: hubtelError || "Could not generate payment link" }, { status: 503 });
    }

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[walkin/payment]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
