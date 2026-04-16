/**
 * Hubtel Web Checkout SDK — unified-pay.hubtel.com/pay
 *
 * This is the EXACT code extracted from /api/bookings/route.ts which is
 * confirmed working in production. Used by booking, walk-in, and shop payments.
 *
 * Docs: https://github.com/hubtel/hubtel-web-merchant-checkout-sdk
 *
 * NOTE: merchantAccount must be the short numeric Hubtel merchant account ID
 * (e.g. "11684"), NOT a phone number. Find it in Hubtel portal → Settings → Account.
 */
export async function buildHubtelCheckoutUrl({
  amount,
  description,
  clientReference,
  customerPhone,
  callbackUrl,
}: {
  amount: number;
  description: string;
  clientReference: string;
  customerPhone: string;
  callbackUrl: string;
}): Promise<{ paymentUrl: string | null; hubtelError: string | null }> {
  const clientId        = process.env.HUBTEL_CLIENT_ID;
  const clientSecret    = process.env.HUBTEL_CLIENT_SECRET;
  const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

  if (!clientId || !clientSecret || clientId === "your_hubtel_client_id") {
    return { paymentUrl: null, hubtelError: "Hubtel credentials not configured" };
  }
  if (!merchantAccount) {
    return { paymentUrl: null, hubtelError: "HUBTEL_MERCHANT_ACCOUNT_NUMBER not set" };
  }

  try {
    // ── Exact copy of the working booking payment code ─────────────────────────
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const msisdn    = (customerPhone || "").replace(/^\+/, ""); // 233XXXXXXXXX (no +)

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
    console.log("[Hubtel] Checkout URL built (merchantAccount:", merchantAccount, ")");
    return { paymentUrl, hubtelError: null };
    // ──────────────────────────────────────────────────────────────────────────
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Hubtel error";
    return { paymentUrl: null, hubtelError: msg };
  }
}
