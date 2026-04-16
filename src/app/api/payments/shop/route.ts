import { NextRequest, NextResponse } from "next/server";
import { buildHubtelCheckoutUrl } from "@/lib/hubtelCheckout";
import { formatPhone } from "@/lib/utils";

/**
 * POST /api/payments/shop
 * Shop product payments — same flow as the working booking route.
 * Requires customerPhone (collected by the shop checkout modal).
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, description, clientReference, customerPhone, fulfillment } = await req.json();

    if (!amount || !description || !clientReference || !customerPhone) {
      return NextResponse.json(
        { error: "amount, description, clientReference and customerPhone are required" },
        { status: 400 }
      );
    }

    const proto       = req.headers.get("x-forwarded-proto") || "https";
    const host        = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl      = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");
    const callbackUrl = `${appUrl}/api/payments/callback`;

    const formattedPhone = formatPhone(customerPhone);
    const deliveryTag = fulfillment === "delivery" ? " (Delivery)" : " (Pick up)";

    const { paymentUrl, hubtelError } = await buildHubtelCheckoutUrl({
      amount,
      description: `${description}${deliveryTag}`,
      clientReference,
      customerPhone: formattedPhone,
      callbackUrl,
    });

    if (hubtelError || !paymentUrl) {
      return NextResponse.json({ error: hubtelError || "Could not generate payment link" }, { status: 503 });
    }

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[shop/payment]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
