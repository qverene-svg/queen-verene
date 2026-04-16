/**
 * Hubtel Web Checkout SDK — unified-pay.hubtel.com/pay
 * Shared by booking, walk-in, and shop payment routes.
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
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const msisdn    = (customerPhone || "").replace(/^\+/, ""); // strip leading + only

    // Build base params — do NOT include customerPhoneNumber in the object literal
    // when it is empty. URLSearchParams always serialises every key in the object,
    // so { customerPhoneNumber: "" } produces "customerPhoneNumber=" in the URL
    // which Hubtel treats as an invalid phone and returns "Validation Errors".
    const params = new URLSearchParams({
      amount:              String(amount),
      purchaseDescription: description,
      clientReference,
      callbackUrl,
      merchantAccount,
      basicAuth,
      integrationType:     "External",
    });

    // Only add customerPhoneNumber when a real value exists
    if (msisdn) params.set("customerPhoneNumber", msisdn);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`;

    console.log("[Hubtel] URL built — ref:", clientReference, "| amount:", amount,
      "| phone:", msisdn || "(none)", "| merchant:", merchantAccount);

    return { paymentUrl, hubtelError: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Hubtel error";
    return { paymentUrl: null, hubtelError: msg };
  }
}
