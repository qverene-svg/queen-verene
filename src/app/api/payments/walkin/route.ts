import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/walkin
 * Generates a Hubtel unified-pay checkout URL for a walk-in customer.
 * Uses the same URL-building approach as /api/bookings/route.ts (confirmed working).
 *
 * Body: { amount (GHS), description, clientReference, customerPhone?, customerName? }
 * Returns: { paymentUrl }
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

    const clientId        = process.env.HUBTEL_CLIENT_ID;
    const clientSecret    = process.env.HUBTEL_CLIENT_SECRET;
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

    if (!clientId || !clientSecret || clientId === "your_hubtel_client_id") {
      return NextResponse.json({ error: "Hubtel credentials not configured" }, { status: 503 });
    }
    if (!merchantAccount) {
      return NextResponse.json({ error: "HUBTEL_MERCHANT_ACCOUNT_NUMBER not set" }, { status: 503 });
    }

    const proto      = req.headers.get("x-forwarded-proto") || "https";
    const host       = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl     = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");
    const callbackUrl = `${appUrl}/api/payments/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const msisdn    = (customerPhone || "").replace(/^\+/, "");

    // Identical to the working booking URL builder
    const params = new URLSearchParams({
      amount:              String(amount),
      purchaseDescription: description,
      customerPhoneNumber: msisdn,
      clientReference,
      callbackUrl,
      merchantAccount,
      basicAuth,
      integrationType:     "External",
    });

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`;
    console.log("[walkin/payment] ref:", clientReference, "amount:", amount, "merchant:", merchantAccount);

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[walkin/payment]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
