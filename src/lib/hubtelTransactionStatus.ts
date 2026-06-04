/**
 * Hubtel transaction status check (Merchant Account / unified-pay).
 * Docs: https://developers.hubtel.com/documentations/merchant-account-api
 */

export type NormalizedPaymentStatus = "paid" | "pending" | "failed";

export interface HubtelStatusResult {
  status: NormalizedPaymentStatus;
  clientReference: string | null;
  transactionId: string | null;
  amount: number | null;
  hubtelStatus: string | null;
  responseCode: string | null;
  message: string | null;
  raw: unknown;
}

function getHubtelCredentials(): { authHeader: string; merchantAccount: string } | null {
  const clientId = process.env.HUBTEL_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET?.trim();
  const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER?.trim();

  if (!clientId || !clientSecret || clientId === "your_hubtel_client_id" || !merchantAccount) {
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  return { authHeader, merchantAccount };
}

/** Map Hubtel status strings to paid | pending | failed */
export function normalizeHubtelPaymentStatus(raw: string | undefined | null): NormalizedPaymentStatus {
  const s = (raw ?? "").toLowerCase().trim();
  if (["success", "paid", "completed", "successful"].includes(s)) return "paid";
  if (["failed", "refunded", "cancelled", "canceled", "declined", "error", "unsuccessful"].includes(s)) {
    return "failed";
  }
  return "pending";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return null;
}

function parseHubtelStatusBody(json: unknown): Omit<HubtelStatusResult, "raw"> {
  const root = asRecord(json) ?? {};
  const data = asRecord(root.data) ?? asRecord(root.Data) ?? root;

  const hubtelStatus =
    pickString(data, "status", "Status") ??
    pickString(root, "status", "Status");

  const responseCode = pickString(root, "responseCode", "ResponseCode", "code");
  const message = pickString(root, "message", "Message");

  let status = normalizeHubtelPaymentStatus(hubtelStatus);

  // Some responses only expose success via response code
  if (responseCode === "0000" && status === "pending" && !hubtelStatus) {
    status = "paid";
  }
  if (hubtelStatus && pickString(data, "Status", "status") === "Success") {
    status = "paid";
  }

  const amountRaw = data.amount ?? data.Amount ?? data.totalAmount ?? data.TotalAmount;
  const amount = amountRaw !== undefined && amountRaw !== null ? Number(amountRaw) : null;

  return {
    status,
    clientReference:
      pickString(data, "clientReference", "ClientReference") ??
      pickString(root, "clientReference", "ClientReference"),
    transactionId:
      pickString(data, "transactionId", "TransactionId", "hubtelTransactionId", "HubtelTransactionId") ??
      pickString(root, "transactionId", "TransactionId", "hubtelTransactionId", "HubtelTransactionId"),
    amount: Number.isFinite(amount) ? amount : null,
    hubtelStatus,
    responseCode,
    message,
  };
}

async function fetchStatusUrl(url: string, authHeader: string): Promise<{ ok: boolean; json: unknown; status: number }> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader, Accept: "application/json" },
    cache: "no-store",
  });

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  return { ok: res.ok, json, status: res.status };
}

/**
 * Query Hubtel for payment status by clientReference and/or hubtelTransactionId.
 * Tries documented endpoint variants until one returns a parseable body.
 */
export async function checkHubtelTransactionStatus({
  clientReference,
  hubtelTransactionId,
}: {
  clientReference?: string;
  hubtelTransactionId?: string;
}): Promise<HubtelStatusResult | { error: string }> {
  const creds = getHubtelCredentials();
  if (!creds) {
    return { error: "Hubtel credentials not configured" };
  }

  const ref = clientReference?.trim();
  const txId = hubtelTransactionId?.trim();
  if (!ref && !txId) {
    return { error: "clientReference or hubtelTransactionId is required" };
  }

  const base = process.env.HUBTEL_TXN_STATUS_BASE_URL?.trim() || "https://api-txnstatus.hubtel.com";
  const urls: string[] = [];

  if (ref) {
    urls.push(
      `${base}/transactions/${creds.merchantAccount}/status?clientReference=${encodeURIComponent(ref)}`,
      `${base}/transactions/status?clientReference=${encodeURIComponent(ref)}`,
    );
  }
  if (txId) {
    urls.push(
      `${base}/transactions/status?hubtelTransactionId=${encodeURIComponent(txId)}`,
      `${base}/transactions/status?HubtelTransactionId=${encodeURIComponent(txId)}`,
    );
  }

  let lastError = "Could not reach Hubtel status API";
  let lastBody: unknown = null;

  for (const url of urls) {
    try {
      const { ok, json, status } = await fetchStatusUrl(url, creds.authHeader);
      lastBody = json;

      if (status === 403 || status === 401) {
        lastError =
          "Hubtel status API access denied. Enable transaction status on your Hubtel API account.";
        continue;
      }

      if (!ok) {
        const msg = asRecord(json)?.message ?? asRecord(json)?.Message;
        lastError = msg ? String(msg) : `Hubtel status HTTP ${status}`;
        continue;
      }

      const parsed = parseHubtelStatusBody(json);
      return {
        ...parsed,
        clientReference: parsed.clientReference ?? ref ?? null,
        transactionId: parsed.transactionId ?? txId ?? null,
        raw: json,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Hubtel status request failed";
    }
  }

  return { error: lastError, raw: lastBody } as { error: string; raw?: unknown };
}
