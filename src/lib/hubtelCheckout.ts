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
  returnUrl,
}: {
  amount: number;
  description: string;
  clientReference: string;
  customerPhone: string;
  callbackUrl: string;
  returnUrl?: string;
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
    const msisdn = (customerPhone || "").replace(/^\+/, "").replace(/[^\d]/g, "");
    const safeRef = sanitizeClientReference(clientReference);
    const safeDesc = sanitizePurchaseDescription(description);
    const enc = encodeURIComponent;
    const q: string[] = [
      `amount=${enc(String(Number(amount).toFixed(2)))}`,
      `purchaseDescription=${enc(safeDesc)}`,
      `clientReference=${enc(safeRef)}`,
      `callbackUrl=${enc(callbackUrl)}`,
      `merchantAccount=${enc(merchantAccount)}`,
      `basicAuth=${enc(basicAuth)}`,
      `integrationType=${enc("External")}`,
    ];
    if (msisdn) q.push(`customerPhoneNumber=${enc(msisdn)}`);
    if (returnUrl) q.push(`returnUrl=${enc(returnUrl)}`);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${q.join("&")}`;

    console.log("[Hubtel] URL built — ref:", safeRef, "| amount:", amount,
      "| phone:", msisdn || "(none)", "| merchant:", merchantAccount);

    return { paymentUrl, hubtelError: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Hubtel error";
    return { paymentUrl: null, hubtelError: msg };
  }
}

function sanitizeClientReference(raw: string): string {
  const value = String(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return value.slice(0, 80) || "ref";
}

function sanitizePurchaseDescription(raw: string): string {
  const value = String(raw)
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value.slice(0, 200) || "Verene payment";
}
