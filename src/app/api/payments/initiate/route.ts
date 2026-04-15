import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/initiate
 * Generates a Hubtel unified-pay checkout URL for any amount.
 * Used for:
 *  - Remaining balance payments (dashboard)
 *  - Shop item payments
 *  - Admin-initiated customer payment links
 *
 * Body: { amount (GHS float), description, clientReference, customerPhone?, customerEmail?, customerName? }
 * Returns: { paymentUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, description, clientReference, customerPhone, customerEmail } = await req.json();

    if (!amount || !description || !clientReference) {
      return NextResponse.json({ error: "amount, description, and clientReference are required" }, { status: 400 });
    }

    const clientId        = process.env.HUBTEL_CLIENT_ID;
    const clientSecret    = process.env.HUBTEL_CLIENT_SECRET;
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

    if (!clientId || !clientSecret || clientId === "your_hubtel_client_id" || !merchantAccount) {
      return NextResponse.json({ error: "Hubtel payment is not configured" }, { status: 503 });
    }

    // Derive callback URL from the request origin
    const proto  = req.headers.get("x-forwarded-proto") || "https";
    const host   = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://www.queenverene.com");

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const msisdn    = (customerPhone || "").replace(/^\+/, "");

    const params = new URLSearchParams({
      amount:               String(Number(amount).toFixed(2)),
      purchaseDescription:  description,
      clientReference,
      callbackUrl:          `${appUrl}/api/payments/callback`,
      merchantAccount,
      basicAuth,
      integrationType:      "External",
    });

    // Add phone only if provided (optional for unified-pay)
    if (msisdn) params.set("customerPhoneNumber", msisdn);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`;
    console.log("[Payments/initiate] URL built for ref:", clientReference, "amount:", amount);

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[Payments/initiate]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
