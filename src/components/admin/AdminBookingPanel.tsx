"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus, User, Phone, Mail, Scissors,
  Calendar, Clock, MessageSquare, Smartphone, Check, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: string;
}

interface StaffMember {
  id: string;
  users: { full_name: string } | null;
}

// Generate 30-min slots from 08:00 to 19:30
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 19; h++) {
  for (const m of [0, 30]) {
    if (h === 19 && m === 30) break;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// Min date = today
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminBookingPanel({ onSuccess }: { onSuccess?: () => void }) {
  const [services,  setServices]  = useState<Service[]>([]);
  const [staff,     setStaff]     = useState<StaffMember[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,   setSuccess]   = useState(false);

  // Form fields
  const [customerName,  setCustomerName]  = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reminderCh,    setReminderCh]    = useState<"sms" | "email" | "">("");
  const [serviceId,     setServiceId]     = useState("");
  const [staffId,       setStaffId]       = useState("");
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("");
  const [notes,         setNotes]         = useState("");

  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    const sb = createClient();
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("services") as any).select("id, name, price, duration_minutes, category").eq("is_active", true).order("name"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("staff_profiles") as any).select("id, users(full_name)"),
    ]).then(([svcRes, staffRes]) => {
      if (svcRes.data)  setServices(svcRes.data as Service[]);
      if (staffRes.data) setStaff(staffRes.data as StaffMember[]);
      setLoading(false);
    });
  }, []);

  const hasPhone = customerPhone.trim().length > 0;
  const hasEmail = customerEmail.trim().length > 0;
  const hasBoth  = hasPhone && hasEmail;

  // Auto-pick channel when only one contact method is present
  const effectiveChannel = hasBoth
    ? reminderCh
    : hasPhone ? "sms"
    : hasEmail ? "email"
    : "";

  const canSubmit =
    customerName.trim() &&
    (hasPhone || hasEmail) &&
    (!hasBoth || reminderCh) &&
    serviceId &&
    date &&
    time;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        serviceName:     selectedService?.name,
        servicePrice:    selectedService?.price,
        serviceDuration: selectedService?.duration_minutes,
        staffId:         staffId || null,
        date,
        time,
        customerName:    customerName.trim(),
        customerPhone:   customerPhone.trim() || null,
        customerEmail:   customerEmail.trim() || null,
        reminderChannel: effectiveChannel,
        notes:           notes.trim() || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not create booking");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    // Notify parent immediately so Overview refreshes in background
    onSuccess?.();
    setTimeout(() => {
      // Reset form
      setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
      setReminderCh(""); setServiceId(""); setStaffId("");
      setDate(""); setTime(""); setNotes("");
      setSuccess(false);
    }, 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6,
  };
  const sectionStyle: React.CSSProperties = {
    background: "#18181b", borderRadius: 14, padding: "20px 24px",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b22222", marginBottom: 4 }}>Admin Panel</p>
        <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 28, color: "#fff", margin: 0 }}>Create Booking</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 }}>
          Book an appointment on behalf of a customer. The customer will receive a confirmation immediately — no payment required.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)" }}>Loading services…</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Customer Info ── */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <User size={14} style={{ color: "#d4af37" }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Customer Details</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Akua Mensah" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input
                  type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0244 000 000" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 4 }}>Ghana number — with or without +233</p>
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="akua@example.com" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
              </div>
            </div>

            {/* Contact hint */}
            {!hasPhone && !hasEmail && (
              <p style={{ marginTop: 12, fontSize: 11, color: "#f87171" }}>At least one contact method (phone or email) is required.</p>
            )}

            {/* Reminder channel selector — only shows when both are provided */}
            <AnimatePresence>
              {hasBoth && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
                      Send confirmation via
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      {(["sms", "email"] as const).map((ch) => (
                        <button
                          key={ch} type="button" onClick={() => setReminderCh(ch)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                            borderRadius: 10, border: "1px solid",
                            borderColor: reminderCh === ch ? "#d4af37" : "rgba(255,255,255,0.1)",
                            background: reminderCh === ch ? "rgba(212,175,55,0.12)" : "transparent",
                            color: reminderCh === ch ? "#d4af37" : "rgba(255,255,255,0.45)",
                            cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.18s",
                          }}
                        >
                          {ch === "sms" ? <Smartphone size={13} /> : <Mail size={13} />}
                          {ch === "sms" ? "SMS" : "Email"}
                          {reminderCh === ch && <Check size={11} style={{ marginLeft: 2 }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Single contact info */}
            {!hasBoth && effectiveChannel && (
              <p style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                {effectiveChannel === "sms" ? <Smartphone size={11} style={{ color: "#d4af37" }} /> : <Mail size={11} style={{ color: "#d4af37" }} />}
                Confirmation will be sent via <strong style={{ color: "rgba(255,255,255,0.55)" }}>{effectiveChannel === "sms" ? "SMS" : "email"}</strong>
              </p>
            )}
          </div>

          {/* ── Service & Staff ── */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Scissors size={14} style={{ color: "#d4af37" }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Service & Staff</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              <div>
                <label style={labelStyle}>Service *</label>
                <select
                  required value={serviceId} onChange={(e) => setServiceId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer", color: serviceId ? "#fff" : "rgba(255,255,255,0.3)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                >
                  <option value="" style={{ color: "#0a0a0a" }}>Select a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: "#0a0a0a" }}>
                      {s.name} — {formatCurrency(s.price)} · {s.duration_minutes}min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stylist (optional)</label>
                <select
                  value={staffId} onChange={(e) => setStaffId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                >
                  <option value="" style={{ color: "#0a0a0a" }}>Any available stylist</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id} style={{ color: "#0a0a0a" }}>
                      {st.users?.full_name || "Staff"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service summary */}
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", display: "flex", gap: 20 }}
              >
                <div>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>Price</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#d4af37" }}>{formatCurrency(selectedService.price)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>Duration</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{selectedService.duration_minutes} min</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Date & Time ── */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Calendar size={14} style={{ color: "#d4af37" }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Date & Time</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input
                  required type="date" value={date} min={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <select
                  required value={time} onChange={(e) => setTime(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer", color: time ? "#fff" : "rgba(255,255,255,0.3)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                >
                  <option value="" style={{ color: "#0a0a0a" }}>Select time…</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t} style={{ color: "#0a0a0a" }}>
                      {format(new Date(`2000-01-01T${t}:00`), "h:mm a")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <MessageSquare size={14} style={{ color: "#d4af37" }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Notes (optional)</p>
            </div>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests, preferences, or notes for the stylist…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
            />
          </div>

          {/* ── Booking summary preview ── */}
          {customerName && serviceId && date && time && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "#0a0a0a", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(178,34,34,0.2)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#d4af37", marginBottom: 14 }}>Booking Preview</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Customer",  value: customerName },
                  { label: "Service",   value: selectedService?.name || "—" },
                  { label: "Date",      value: date ? format(new Date(date + "T12:00"), "EEE, d MMM yyyy") : "—" },
                  { label: "Time",      value: time ? format(new Date(`2000-01-01T${time}:00`), "h:mm a") : "—" },
                  { label: "Contact",   value: effectiveChannel === "sms" ? customerPhone : customerEmail },
                  { label: "Notify via", value: effectiveChannel ? effectiveChannel.toUpperCase() : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                This booking will be immediately confirmed. No payment is required from the customer.
              </p>
            </motion.div>
          )}

          {/* ── Submit ── */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", background: "rgba(52,211,153,0.1)", borderRadius: 12, border: "1px solid rgba(52,211,153,0.25)" }}
              >
                <Check size={20} style={{ color: "#34d399", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Booking Created!</p>
                  <p style={{ fontSize: 12, color: "rgba(52,211,153,0.6)", marginTop: 2 }}>
                    Confirmation {effectiveChannel === "sms" ? "SMS" : "email"} sent to {customerName}.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "13px 32px", borderRadius: 12, border: "none", cursor: (!canSubmit || submitting) ? "not-allowed" : "pointer",
                    background: (!canSubmit || submitting) ? "rgba(178,34,34,0.4)" : "#b22222",
                    color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    transition: "background 0.2s",
                  }}
                >
                  <CalendarPlus size={15} />
                  {submitting ? "Creating booking…" : "Create Booking"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
                    setReminderCh(""); setServiceId(""); setStaffId("");
                    setDate(""); setTime(""); setNotes("");
                  }}
                  style={{ padding: "13px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </form>
      )}
    </div>
  );
}
