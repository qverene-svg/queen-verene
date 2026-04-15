import { NextRequest, NextResponse } from "next/server";

/**
 * Hubtel Unified Pay rejects many characters in clientReference (e.g. `/`, spaces, em dashes).
 * Base64 basicAuth contains `+` and `/` — must use encodeURIComponent per field, not raw
 * URLSearchParams.toString(), or `+` can be misread as space when Hubtel parses the query.
 */
function hubtelSafeClientReference(raw: string): string {
  const s = String(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const out = s.slice(0, 80);
  return out || "ref";
}

/** ASCII-ish description for purchaseDescription (Hubtel validation is strict). */
function hubtelSafePurchaseDescription(raw: string): string {
  const s = String(raw)
    .replace(/[\u2013\u2014\u2212]/g, "-") // en dash, em dash, minus
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, 200) || "Verene payment";
}

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

    const safeRef = hubtelSafeClientReference(clientReference);
    const safeDesc = hubtelSafePurchaseDescription(description);
    const enc = encodeURIComponent;

    const q: string[] = [
      `amount=${enc(String(Number(amount).toFixed(2)))}`,
      `purchaseDescription=${enc(safeDesc)}`,
      `clientReference=${enc(safeRef)}`,
      `callbackUrl=${enc(`${appUrl}/api/payments/callback`)}`,
      `merchantAccount=${enc(merchantAccount)}`,
      `basicAuth=${enc(basicAuth)}`,
      `integrationType=${enc("External")}`,
    ];
    if (msisdn) q.push(`customerPhoneNumber=${enc(msisdn)}`);

    const paymentUrl = `https://unified-pay.hubtel.com/pay?${q.join("&")}`;
    console.log("[Payments/initiate] ref (sanitized):", safeRef, "len:", safeRef.length, "amount:", amount);

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[Payments/initiate]", err);
    return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
  }
}
