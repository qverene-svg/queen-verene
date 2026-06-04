import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { parseAppointmentIdFromHubtelReference } from "@/lib/hubtelPayment";
import { checkHubtelTransactionStatus } from "@/lib/hubtelTransactionStatus";

/**
 * GET /api/payments/status
 * Checks Hubtel for payment status and returns { status: "paid" | "pending" | "failed" }.
 *
 * Query:
 *   clientReference      — your payment ref (appointment UUID, balance-{uuid}, walkin-*, etc.)
 *   hubtelTransactionId  — Hubtel transaction id (optional)
 *   sync                 — "1" to update the appointment when status is paid (appointment refs only)
 */
export async function GET(req: NextRequest) {
  try {
    const clientReference = req.nextUrl.searchParams.get("clientReference")?.trim() || "";
    const hubtelTransactionId = req.nextUrl.searchParams.get("hubtelTransactionId")?.trim() || "";
    const sync = req.nextUrl.searchParams.get("sync") === "1";

    if (!clientReference && !hubtelTransactionId) {
      return NextResponse.json(
        { error: "clientReference or hubtelTransactionId is required" },
        { status: 400 }
      );
    }

    const result = await checkHubtelTransactionStatus({ clientReference, hubtelTransactionId });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, status: "pending" as const },
        { status: 502 }
      );
    }

    let synced = false;
    if (sync && result.status === "paid" && clientReference) {
      synced = await syncAppointmentIfPaid(clientReference, result.amount);
    }

    return NextResponse.json({
      status: result.status,
      clientReference: result.clientReference,
      transactionId: result.transactionId,
      amount: result.amount,
      hubtelStatus: result.hubtelStatus,
      responseCode: result.responseCode,
      message: result.message,
      synced,
    });
  } catch (err) {
    console.error("[Payment status]", err);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}

/** Optional: verify caller owns the appointment when Authorization is present */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientReference = String(body.clientReference ?? "").trim();
    const hubtelTransactionId = String(body.hubtelTransactionId ?? "").trim();
    const sync = body.sync === true;

    if (!clientReference && !hubtelTransactionId) {
      return NextResponse.json(
        { error: "clientReference or hubtelTransactionId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && clientReference) {
      const appointmentId = parseAppointmentIdFromHubtelReference(clientReference);
      if (appointmentId) {
        const { data: appt } = await supabase
          .from("appointments")
          .select("id")
          .eq("id", appointmentId)
          .eq("customer_id", user.id)
          .maybeSingle();
        if (!appt) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const result = await checkHubtelTransactionStatus({ clientReference, hubtelTransactionId });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, status: "pending" as const },
        { status: 502 }
      );
    }

    let synced = false;
    if (sync && result.status === "paid" && clientReference) {
      synced = await syncAppointmentIfPaid(clientReference, result.amount);
    }

    return NextResponse.json({
      status: result.status,
      clientReference: result.clientReference,
      transactionId: result.transactionId,
      amount: result.amount,
      hubtelStatus: result.hubtelStatus,
      responseCode: result.responseCode,
      message: result.message,
      synced,
    });
  } catch (err) {
    console.error("[Payment status]", err);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}

async function syncAppointmentIfPaid(clientReference: string, amountGhs: number | null): Promise<boolean> {
  const appointmentId = parseAppointmentIdFromHubtelReference(clientReference);
  if (!appointmentId) return false;

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: appt } = await db
    .from("appointments")
    .select("id, payment_status, deposit_paid")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt) return false;
  if (appt.payment_status === "paid" || appt.payment_status === "deposit_paid") return true;

  const depositPesewas = amountGhs && amountGhs > 0
    ? Math.round(amountGhs * 100)
    : appt.deposit_paid;

  const { error } = await db
    .from("appointments")
    .update({
      payment_status: "deposit_paid",
      status: "confirmed",
      deposit_paid: depositPesewas,
    })
    .eq("id", appointmentId);

  if (error) {
    console.error("[Payment status] sync failed:", error);
    return false;
  }

  return true;
}
