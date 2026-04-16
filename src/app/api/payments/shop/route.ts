import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/shop
 * Generates a Hubtel unified-pay checkout URL for a shop purchase.
 * Mirrors the confirmed-working booking route exactly:
 *  - customerPhoneNumber omitted when no phone provided (not sent as blank string)
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

    const proto       = req.headers.get("x-forwarded-proto") || "https";
    const host        = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl      = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");
    const callbackUrl = `${appUrl}/api/payments/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Convert phone to 233XXXXXXXXX if provided — omit entirely if not
    const digits = (customerPhone || "").replace(/\D/g, "");
    let msisdn = "";
    if (digits) {
      if (digits.startsWith("233"))     msisdn = digits;
      else if (digits.startsWith("0"))  msisdn = "233" + digits.slice(1);
      else                              msisdn = "233" + digits;
    }

    const params = new URLSearchParams({
      amount:              String(amount),
      purchaseDescription: description,
      clientReference,
      callbackUrl,
      merchantAccount,
      basicAuth,
      integrationType:     "External",
    });

    // Only add customerPhoneNumber when non-empty — blank value causes Hubtel validation error
    if (msisdn) params.set("customerPhoneNumber", msisdn);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`;
    console.log("[shop/payment] ref:", clientReference, "amount:", amount, "phone:", msisdn || "(none)");

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[shop/payment]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
