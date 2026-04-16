"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, User, Phone, DollarSign, FileText,
  Copy, Check, ExternalLink, Smartphone, RefreshCw, QrCode,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentResult {
  paymentUrl: string;
  customerName: string;
  amount: number;
  description: string;
  phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
  transition: "border-color 0.18s",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6,
};
const sectionStyle: React.CSSProperties = {
  background: "#18181b", borderRadius: 14, padding: "20px 24px",
  border: "1px solid rgba(255,255,255,0.07)",
};

function Field({
  label, type = "text", value, onChange, placeholder, prefix, required,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  prefix?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && " *"}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && (
          <span style={{
            position: "absolute", left: 12, fontSize: 13, fontWeight: 700,
            color: "rgba(255,255,255,0.4)", pointerEvents: "none",
          }}>{prefix}</span>
        )}
        <input
          type={type} value={value} required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputStyle,
            paddingLeft: prefix ? 32 : 14,
            borderColor: focused ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.09)",
          }}
        />
      </div>
    </div>
  );
}

// ── QR Code (via public API — no package needed) ──────────────────────────────

function QrDisplay({ url }: { url: string }) {
  const [show, setShow] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(url)}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
          background: show ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${show ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 9, color: show ? "#d4af37" : "rgba(255,255,255,0.5)",
          fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
        }}
      >
        <QrCode size={13} />
        {show ? "Hide QR Code" : "Show QR Code"}
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc} alt="Payment QR Code"
                style={{ width: 220, height: 220, borderRadius: 12, background: "#fff", padding: 4 }}
              />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                Customer scans with phone camera to open the payment page
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Match Hubtel / initiate route: ASCII description, no fancy punctuation (avoids validation errors). */
function hubtelSafeWalkinDescription(raw: string): string {
  return raw
    .replace(/[\u2013\u2014\u2212]/g, "-") // en dash, em dash, minus
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Hubtel-safe reference: letters, digits, hyphens only (initiate also sanitizes server-side). */
function hubtelSafeWalkinClientReference(): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `walkin-${id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
}

function hubtelSafeWalkinPhone(raw: string): string | undefined {
  const t = raw.trim().replace(/\s+/g, "");
  if (!t) return undefined;
  return t.replace(/^\+/, "");
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AdminWalkinPaymentPanel() {
  const [customerName, setCustomerName] = useState("");
  const [phone,        setPhone]        = useState("");
  const [amountGhs,    setAmountGhs]    = useState("");
  const [description,  setDescription]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [smsSending,   setSmsSending]   = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [result,       setResult]       = useState<PaymentResult | null>(null);

  const canSubmit = customerName.trim() && amountGhs && Number(amountGhs) > 0 && description.trim();

  // ── Generate payment link ──────────────────────────────────────────────────

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);

    const amount = Number(amountGhs);
    const descSafe = hubtelSafeWalkinDescription(description.trim()) || "Walk-in payment";
    const ref = hubtelSafeWalkinClientReference();
    const phoneSafe = hubtelSafeWalkinPhone(phone);

    const res = await fetch("/api/payments/initiate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description:     descSafe,
        clientReference: ref,
        customerPhone:   phoneSafe,
        customerName:    customerName.trim(),
        returnUrl:       `${window.location.origin}/payment-complete`,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.paymentUrl) {
      toast.error(json.error || "Could not generate payment link");
      setLoading(false);
      return;
    }

    setResult({
      paymentUrl:   json.paymentUrl,
      customerName: customerName.trim(),
      amount,
      description:  descSafe,
      phone:        phone.trim(),
    });
    setLoading(false);
    toast.success("Payment link ready!");
  };

  // ── Copy link ──────────────────────────────────────────────────────────────

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.paymentUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Send link via SMS ──────────────────────────────────────────────────────

  const handleSendSms = async () => {
    if (!result?.phone || !result.paymentUrl) return;
    setSmsSending(true);
    const res = await fetch("/api/payments/send-link-sms", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone:       result.phone,
        name:        result.customerName,
        amount:      result.amount,
        description: result.description,
        paymentUrl:  result.paymentUrl,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not send SMS");
    } else {
      toast.success(`Payment link sent to ${result.phone}`);
    }
    setSmsSending(false);
  };

  // ── Reset form ─────────────────────────────────────────────────────────────

  const handleReset = () => {
    setResult(null);
    setCustomerName(""); setPhone(""); setAmountGhs(""); setDescription("");
    setCopied(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 700 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b22222", marginBottom: 4 }}>Admin Panel</p>
        <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 28, color: "#fff", margin: 0 }}>
          Walk-in Payment
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 }}>
          Generate a Hubtel checkout link for a walk-in customer. Share it, copy it, or send it straight to their phone.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Payment link result ── */}
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Summary card */}
            <div style={{ ...sectionStyle, borderColor: "rgba(52,211,153,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={15} style={{ color: "#34d399" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#34d399", margin: 0 }}>Payment Link Ready</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Share with the customer to complete payment</p>
                </div>
              </div>

              {/* Details row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "Customer",    value: result.customerName },
                  { label: "Amount",      value: `GHS ${result.amount.toFixed(2)}` },
                  { label: "Service",     value: result.description },
                  ...(result.phone ? [{ label: "Phone", value: result.phone }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* URL box */}
              <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16, wordBreak: "break-all" }}>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Payment URL</p>
                <p style={{ fontSize: 11, color: "#d4af37", margin: 0, lineHeight: 1.6 }}>{result.paymentUrl}</p>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {/* Copy */}
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                    background: copied ? "rgba(52,211,153,0.12)" : "#b22222",
                    border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "transparent"}`,
                    borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                {/* Open Hubtel */}
                <button
                  onClick={() => window.open(result.paymentUrl, "_blank")}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  <ExternalLink size={13} />
                  Open Checkout
                </button>

                {/* Send SMS */}
                {result.phone && (
                  <button
                    onClick={handleSendSms}
                    disabled={smsSending}
                    style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                      background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)",
                      borderRadius: 10, color: "#d4af37", fontSize: 12, fontWeight: 700,
                      cursor: smsSending ? "not-allowed" : "pointer", opacity: smsSending ? 0.6 : 1, transition: "all 0.18s",
                    }}
                  >
                    {smsSending
                      ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Smartphone size={13} />}
                    {smsSending ? "Sending…" : `Send to ${result.phone}`}
                  </button>
                )}
              </div>

              {/* QR Code */}
              <QrDisplay url={result.paymentUrl} />
            </div>

            {/* New payment button */}
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 22px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", width: "fit-content", transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <RefreshCw size={13} /> New Payment
            </button>
          </motion.div>
        ) : (

          /* ── Input form ── */
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onSubmit={handleGenerate}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Customer details */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <User size={14} style={{ color: "#d4af37" }} />
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Customer Details</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field
                  label="Customer Name" value={customerName}
                  onChange={setCustomerName} placeholder="Akua Mensah" required
                />
                <Field
                  label="Phone Number (optional)" type="tel" value={phone}
                  onChange={setPhone} placeholder="0244 000 000"
                />
              </div>
              {phone && (
                <p style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Phone size={10} /> Payment link will be sent to this number via SMS after generation
                </p>
              )}
            </div>

            {/* Payment details */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <CreditCard size={14} style={{ color: "#d4af37" }} />
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Payment Details</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field
                  label="Amount (GHS)" type="number" prefix="GH₵"
                  value={amountGhs} onChange={setAmountGhs}
                  placeholder="0.00" required
                />
                <div>
                  <label style={labelStyle}>Service / Description *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    <input
                      required value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Classic Pedicure, Wig Installation…"
                      style={{ ...inputStyle }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {customerName && amountGhs && Number(amountGhs) > 0 && description && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "16px 20px", background: "rgba(178,34,34,0.07)", border: "1px solid rgba(178,34,34,0.18)", borderRadius: 12 }}
              >
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Payment Preview</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>GHS {Number(amountGhs).toFixed(2)}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>from {customerName} · {description}</span>
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 32px", borderRadius: 12, border: "none",
                background: (!canSubmit || loading) ? "rgba(178,34,34,0.4)" : "#b22222",
                color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: (!canSubmit || loading) ? "not-allowed" : "pointer",
                transition: "background 0.2s", width: "fit-content",
              }}
            >
              {loading
                ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                : <><DollarSign size={14} /> Generate Payment Link</>
              }
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
