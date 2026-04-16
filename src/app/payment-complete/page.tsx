"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Inner component (uses useSearchParams — must be inside <Suspense>) ─────────

function PaymentCompleteContent() {
  const params  = useSearchParams();
  const [status, setStatus] = useState<"success" | "failed" | "pending" | "unknown">("unknown");

  useEffect(() => {
    const s = (params.get("status") || "").toLowerCase();
    if (s === "success")      setStatus("success");
    else if (s === "failed")  setStatus("failed");
    else if (s === "pending") setStatus("pending");
    else                      setStatus("unknown");
  }, [params]);

  const ref  = params.get("clientReference") || params.get("ClientReference") || "";
  const txId = params.get("transactionId")   || params.get("TransactionId")   || "";

  const config = {
    success: {
      icon:    <CheckCircle size={52} style={{ color: "#34d399" }} />,
      title:   "Payment Successful",
      message: "Your payment has been received. We'll confirm your booking shortly.",
    },
    failed: {
      icon:    <XCircle size={52} style={{ color: "#b22222" }} />,
      title:   "Payment Failed",
      message: "Your payment could not be processed. Please try again or contact us.",
    },
    pending: {
      icon:    <Clock size={52} style={{ color: "#fbbf24" }} />,
      title:   "Payment Pending",
      message: "Your payment is being processed. We'll notify you once confirmed.",
    },
    unknown: {
      icon:    <Clock size={52} style={{ color: "rgba(255,255,255,0.25)" }} />,
      title:   "Payment Status",
      message: "Your payment is being verified. Please check your booking in your dashboard.",
    },
  }[status];

  return (
    <div style={{
      maxWidth: 480, width: "100%",
      background: "#18181b",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "40px 36px",
      textAlign: "center",
    }}>
      {/* Brand */}
      <p style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.32em",
        textTransform: "uppercase", color: "#b22222", marginBottom: 32,
      }}>
        Queen Verene
      </p>

      {/* Icon */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        {config.icon}
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 12,
      }}>
        {config.title}
      </h1>

      {/* Message */}
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
        {config.message}
      </p>

      {/* Reference details */}
      {(ref || txId) && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 28, textAlign: "left",
        }}>
          {ref && (
            <div style={{ marginBottom: txId ? 8 : 0 }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 2 }}>Reference</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>{ref}</p>
            </div>
          )}
          {txId && (
            <div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 2 }}>Transaction ID</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>{txId}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 24px", background: "#b22222", borderRadius: 12,
            color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          View My Bookings <ArrowRight size={14} />
        </Link>
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "12px 24px", background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
            color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// ── Fallback shown while params are resolving ──────────────────────────────────

function PaymentCompleteSkeleton() {
  return (
    <div style={{
      maxWidth: 480, width: "100%",
      background: "#18181b",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "40px 36px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.32em", textTransform: "uppercase", color: "#b22222", marginBottom: 32 }}>
        Queen Verene
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Clock size={52} style={{ color: "rgba(255,255,255,0.15)" }} />
      </div>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Verifying payment…</p>
    </div>
  );
}

// ── Page export (wraps inner component in Suspense) ───────────────────────────

export default function PaymentCompletePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f11",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <Suspense fallback={<PaymentCompleteSkeleton />}>
        <PaymentCompleteContent />
      </Suspense>
    </div>
  );
}
