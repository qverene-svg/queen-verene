import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/initiate
 * Generates a Hubtel unified-pay checkout URL for any amount.
 *
 * Uses the same URLSearchParams approach as /api/bookings/route.ts which is
 * confirmed working in production.
 *
 * Body: {
 *   amount          — GHS float (e.g. 50.00)
 *   description     — purchase description
 *   clientReference — unique reference for this payment
 *   customerPhone?  — Ghana phone number (any format)
 *   customerEmail?  — optional
 *   customerName?   — optional
 * }
 * Returns: { paymentUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, description, clientReference, customerPhone, customerEmail, customerName } = await req.json();

    if (!amount || !description || !clientReference) {
      return NextResponse.json(
        { error: "amount, description, and clientReference are required" },
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

    // Derive callback URL from the request (works on any domain — prod, staging, local)
    const proto      = req.headers.get("x-forwarded-proto") || "https";
    const host       = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl     = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");
    const callbackUrl = `${appUrl}/api/payments/callback`;

    // Build basicAuth and phone exactly as the working booking route does
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const msisdn    = (customerPhone || "").replace(/^\+/, ""); // 233XXXXXXXXX (no +)

    // Use URLSearchParams — identical to the confirmed-working booking flow
    const params = new URLSearchParams({
      amount:              String(Number(amount)),
      purchaseDescription: description,
      clientReference,
      callbackUrl,
      merchantAccount,
      basicAuth,
      integrationType: "External",
    });

    // Optional customer fields (only add if provided — keeps URL clean)
    if (msisdn)        params.set("customerPhoneNumber", msisdn);
    if (customerEmail) params.set("customerEmail", customerEmail);
    if (customerName)  params.set("customerName", customerName);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`;

    console.log("[Payments/initiate] built URL for ref:", clientReference, "amount:", amount, "merchant:", merchantAccount.slice(0, 4) + "****");

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[Payments/initiate]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
