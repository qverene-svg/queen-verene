"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceStep } from "./ServiceStep";
import { DateTimeStep } from "./DateTimeStep";
import { ConfirmStep } from "./ConfirmStep";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export type BookingData = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string;
  time: string;
  notes: string;
};

const STORAGE_KEY = "verene_booking_resume";

const STEPS = [
  { label: "Service",     short: "01" },
  { label: "Date & Time", short: "02" },
  { label: "Confirm",     short: "03" },
];

interface BookingFlowProps {
  /**
   * standalone (default): embedded on /services — after step 0 redirects to /dashboard
   * modal: runs inside a modal on /dashboard — proceeds through all steps in-place
   */
  mode?: "standalone" | "modal";
  /** Called when the booking is completed (modal mode only) */
  onComplete?: () => void;
}

export function BookingFlow({ mode = "standalone", onComplete }: BookingFlowProps) {
  const router  = useRouter();
  const [step,    setStep]    = useState(0);
  const [booking, setBooking] = useState<Partial<BookingData>>({});

  // Restore saved state (set by standalone mode after auth redirect)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { step?: number; booking?: Partial<BookingData> };
      sessionStorage.removeItem(STORAGE_KEY);
      if (typeof parsed.step === "number" && parsed.booking && Object.keys(parsed.booking).length > 0) {
        setStep(Math.min(Math.max(0, parsed.step), STEPS.length - 1));
        setBooking(parsed.booking);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const next = useCallback(async (data: Partial<BookingData>) => {
    const merged = { ...booking, ...data };

    if (step === 0) {
      if (mode === "standalone") {
        // Save state and redirect to client portal (dashboard) to continue booking
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 1, booking: merged }));

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not logged in → go to login first, then dashboard
          router.push("/auth/login?returnTo=" + encodeURIComponent("/dashboard?book=1"));
          return;
        }

        // Logged in → go straight to client portal to continue
        router.push("/dashboard?book=1");
        return;
      }
    }

    setBooking(merged);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [booking, step, router, mode]);

  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center mb-14">
        {STEPS.map(({ label, short }, i) => (
          <div key={label} className="flex items-center min-w-0 flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  i < step
                    ? "bg-[#b22222] text-white"
                    : i === step
                    ? "bg-[#0a0a0a] text-white ring-2 ring-offset-2 ring-[#d4af37]"
                    : "bg-white border-2 border-black/10 text-black/25"
                )}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : short}
              </div>
              <span className={cn(
                "text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap",
                i <= step ? "text-[#0a0a0a]" : "text-black/25"
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-px flex-1 mx-2 mb-6 transition-all duration-500",
                i < step ? "bg-[#b22222]" : "bg-black/10"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-black/8 shadow-sm p-8 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {step === 0 && (
              <ServiceStep onNext={next} selected={booking.serviceId} />
            )}
            {step === 1 && (
              <DateTimeStep
                onNext={next}
                onBack={back}
                selectedDate={booking.date}
                selectedTime={booking.time}
              />
            )}
            {step === 2 && (
              <ConfirmStep
                booking={booking as BookingData}
                onBack={back}
                onComplete={onComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
