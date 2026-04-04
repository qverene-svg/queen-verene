import { BookingFlow } from "@/components/booking/BookingFlow";
import { ServicesHashScroll } from "./ServicesHashScroll";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Services & Booking" };

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#f9f7f2]">
      <ServicesHashScroll />

      {/* ── Floating Nav ─────────────────────────────────── */}
      <div className="bg-[#0a0a0a] pt-16">
        <FloatingPageNav />
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative bg-[#0a0a0a] pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #b22222 0%, transparent 60%), radial-gradient(circle at 20% 80%, #d4af37 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-[#d4af37] text-xs font-semibold tracking-[0.4em] uppercase mb-4">
            Queen Verene Hair
          </p>
          <h1 className="text-white leading-tight mb-6 font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}>
            Our Services
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-base leading-relaxed">
            Browse our full menu and book your appointment in minutes.
          </p>
          <a
            href="#book"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-[#b22222] text-white rounded-full text-sm font-semibold tracking-widest uppercase hover:bg-[#cc2929] transition-colors"
          >
            Book an Appointment
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* ── Booking Flow ────────────────────────────────────── */}
      <section id="book" className="py-24 px-6 bg-[#f9f7f2]" style={{ scrollMarginTop: "4.5rem" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[#b22222] text-xs font-semibold tracking-[0.35em] uppercase mb-2 text-center">Reserve Your Slot</p>
          <h2 className="font-[Playfair_Display] text-4xl sm:text-5xl text-[#0a0a0a] text-center mb-4">
            Book Your Appointment
          </h2>
          <p className="text-[#0a0a0a]/50 text-sm text-center max-w-md mx-auto mb-16">
            Choose your service, select a date and time, and secure your spot with a GHS 50 deposit.
          </p>
          <BookingFlow />
        </div>
      </section>

    </div>
  );
}
