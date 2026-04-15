"use client";
import { useState } from "react";
import { CheckCircle2, Calendar, Clock, Scissors, Smartphone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";
import type { BookingData } from "./BookingFlow";
import toast from "react-hot-toast";

/** Fixed GHS 50 deposit (in pesewas) */
const DEPOSIT_PESEWAS = 5000;

export type ReminderChannel = "sms" | "email";

interface ConfirmStepProps {
  booking: BookingData;
  onBack: () => void;
  onComplete?: () => void;
}

export function ConfirmStep({ booking, onBack, onComplete }: ConfirmStepProps) {
  const [name,            setName]            = useState("");
  const [phone,           setPhone]           = useState("");
  const [email,           setEmail]           = useState("");
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);

  const deposit = DEPOSIT_PESEWAS;

  // Derived: which contact methods the customer has filled in
  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;
  const hasBoth  = hasPhone && hasEmail;

  // Automatically pick channel when only one contact is given
  const effectiveChannel: ReminderChannel | null = hasBoth
    ? reminderChannel
    : hasPhone
    ? "sms"
    : hasEmail
    ? "email"
    : null;

  const handlePay = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!hasPhone && !hasEmail) {
      toast.error("Please enter a phone number or email address.");
      return;
    }
    if (hasBoth && !reminderChannel) {
      toast.error("Please choose how you'd like to receive reminders.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...booking,
          customerName:    name.trim(),
          customerPhone:   phone.trim() || null,
          customerEmail:   email.trim() || null,
          reminderChannel: effectiveChannel,
          deposit,
        }),
      });
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : `Server error (${res.status})`;
        throw new Error(msg);
      }

      if (data.paymentUrl) {
        // Redirect to Hubtel checkout page
        toast.success("Redirecting to payment…");
        window.location.href = data.paymentUrl as string;
      } else {
        // Payment gateway not reachable — booking is saved but payment pending
        console.warn("[ConfirmStep] paymentUrl was null. Server response:", data);
        toast.error(
          "Booking saved, but we could not redirect you to payment. Please contact us to complete your GHS 50 deposit.",
          { duration: 10000 }
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-14">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#b22222]/10 mb-5">
          <CheckCircle2 size={32} className="text-[#b22222]" />
        </div>
        <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a] mb-2">Booking Confirmed!</h2>
        <p className="text-[#0a0a0a]/60 max-w-md mx-auto text-sm leading-relaxed">
          Thank you, {name}. You&apos;ll receive a confirmation{" "}
          {effectiveChannel === "sms" ? "by SMS" : "by email"} shortly. We can&apos;t wait to see you!
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a] mb-1.5">Confirm &amp; Pay Deposit</h2>
      <p className="text-sm text-[#0a0a0a]/50 mb-6">
        Review your booking and pay the <strong>GHS 50 deposit</strong> to secure your slot.
      </p>

      {/* Booking summary */}
      <div className="bg-[#0a0a0a] rounded-2xl p-5 mb-6 text-white">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#d4af37] mb-3">Booking Summary</p>
        <div className="space-y-2.5">
          {[
            { icon: Scissors, label: "Service", value: booking.serviceName },
            { icon: Calendar, label: "Date",    value: booking.date },
            { icon: Clock,    label: "Time",    value: booking.time },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={13} className="text-[#d4af37] shrink-0" />
              <span className="text-white/40 text-xs w-14">{label}</span>
              <span className="text-white text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-white/35 text-[10px]">Total price</p>
            <p className="text-white text-base font-semibold">{formatCurrency(booking.servicePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/35 text-[10px]">Deposit due today</p>
            <p className="text-[#d4af37] text-lg font-bold">{formatCurrency(deposit)}</p>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="space-y-4 mb-5">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#0a0a0a]/40">Your Details</p>

        <Input
          label="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Akua Mensah"
        />

        {/* Contact — at least one required */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Mobile number (SMS)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0244 000 000"
              type="tel"
            />
            <p className="text-[10px] text-[#0a0a0a]/35 mt-1 ml-0.5">Ghana number with or without +233</p>
          </div>
          <div>
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
            />
            <p className="text-[10px] text-[#0a0a0a]/35 mt-1 ml-0.5">For receipt &amp; reminders</p>
          </div>
        </div>

        {/* Contact required hint */}
        {!hasPhone && !hasEmail && (
          <p className="text-[11px] text-[#b22222]/80 font-medium">
            Please enter at least a phone number or email address.
          </p>
        )}
      </div>

      {/* Reminder channel selector — only shows when both are given */}
      <AnimatePresence>
        {hasBoth && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-[#f9f7f2] border border-[#d4af37]/30 rounded-xl p-4">
              <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#0a0a0a]/60 mb-3">
                How would you like to receive reminders?
              </p>
              <div className="flex gap-3 flex-wrap">
                <ChannelButton
                  active={reminderChannel === "sms"}
                  onClick={() => setReminderChannel("sms")}
                  icon={<Smartphone size={14} />}
                  label="SMS"
                  sub="Text my number"
                />
                <ChannelButton
                  active={reminderChannel === "email"}
                  onClick={() => setReminderChannel("email")}
                  icon={<Mail size={14} />}
                  label="Email"
                  sub="Send to my inbox"
                />
              </div>
              <p className="text-[10px] text-[#0a0a0a]/40 mt-3">
                You&apos;ll receive a confirmation now, a reminder on the morning of your appointment, and one 6 hours before.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single contact channel info */}
      {!hasBoth && effectiveChannel && (
        <div className="mb-5 flex items-center gap-2 text-[11px] text-[#0a0a0a]/50">
          {effectiveChannel === "sms"
            ? <><Smartphone size={12} className="text-[#d4af37]" /> Reminders will be sent via <strong>SMS</strong></>
            : <><Mail size={12} className="text-[#b22222]" /> Reminders will be sent via <strong>email</strong></>
          }
          <span className="ml-1 text-[#0a0a0a]/35">— confirmation now, morning of, and 6h before.</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto">Back</Button>
        <Button
          onClick={handlePay}
          loading={loading}
          size="lg"
          disabled={!name.trim() || (!hasPhone && !hasEmail) || (hasBoth && !reminderChannel)}
          className="w-full sm:w-auto"
        >
          Make Payment — GHS 50 Deposit
        </Button>
      </div>
    </div>
  );
}

// ── Channel toggle button ─────────────────────────────────────────────────────

function ChannelButton({
  active, onClick, icon, label, sub,
}: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all duration-200 flex-1 min-w-[140px]",
        active
          ? "bg-[#0a0a0a] border-[#0a0a0a] text-white shadow-sm"
          : "bg-white border-black/10 text-[#0a0a0a]/60 hover:border-[#0a0a0a]/30"
      )}
    >
      <span className={active ? "text-[#d4af37]" : "text-[#0a0a0a]/40"}>{icon}</span>
      <div>
        <p className="text-xs font-bold">{label}</p>
        <p className={cn("text-[10px]", active ? "text-white/50" : "text-[#0a0a0a]/35")}>{sub}</p>
      </div>
      {active && (
        <span className="ml-auto w-4 h-4 rounded-full bg-[#d4af37] flex items-center justify-center shrink-0">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}
