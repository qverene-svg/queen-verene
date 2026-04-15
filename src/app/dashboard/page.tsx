"use client";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, XCircle, LogOut, Plus, X, Sparkles, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import toast from "react-hot-toast";

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  total_price: number;
  deposit_paid: number;
  notes: string | null;
  services: { name: string; category: string } | null;
  staff_profiles: { users: { full_name: string } | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: "crimson" | "gold" | "green" | "gray" }> = {
  pending:   { label: "Pending",   variant: "gold"    },
  confirmed: { label: "Confirmed", variant: "green"   },
  completed: { label: "Completed", variant: "gray"    },
  cancelled: { label: "Cancelled", variant: "crimson" },
};

// Inner component that uses useSearchParams (needs Suspense boundary)
function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [userName,      setUserName]      = useState("");
  const [loading,       setLoading]       = useState(true);
  const [cancelTarget,  setCancelTarget]  = useState<string | null>(null);
  const [bookingOpen,   setBookingOpen]   = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [activeTab,     setActiveTab]     = useState<"appointments" | "payments">("appointments");

  // Load user + appointments
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("users").select("full_name").eq("id", user.id).single();
      if (profile) setUserName((profile as { full_name: string }).full_name);

      const { data } = await supabase
        .from("appointments")
        .select("*, services(name, category), staff_profiles(users(full_name))")
        .eq("customer_id", user.id)
        .order("start_time", { ascending: false });
      if (data) setAppointments(data as Appointment[]);
      setLoading(false);
    });
  }, [router]);

  // Auto-open booking modal when ?book=1 in URL
  useEffect(() => {
    if (searchParams.get("book") === "1") {
      setBookingOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("book");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("appointments") as any).update({ status: "cancelled" }).eq("id", cancelTarget);
    setAppointments((prev) => prev.map((a) => a.id === cancelTarget ? { ...a, status: "cancelled" } : a));
    setCancelTarget(null);
    setConfirmCancel(false);
    toast.success("Appointment cancelled.");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const refreshAppointments = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, services(name, category), staff_profiles(users(full_name))")
      .eq("customer_id", user.id)
      .order("start_time", { ascending: false });
    if (data) setAppointments(data as Appointment[]);
  };

  const handleBookingComplete = () => {
    setBookingOpen(false);
    refreshAppointments();
  };

  const upcoming = appointments.filter((a) => a.status !== "completed" && a.status !== "cancelled");
  const past     = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");
  const firstName = userName ? userName.split(" ")[0] : null;

  // Payment history: appointments that have deposit or are paid
  const paymentHistory = appointments.filter((a) => a.deposit_paid > 0 || a.payment_status !== "unpaid");
  const totalPaid      = paymentHistory.reduce((sum, a) => sum + (a.deposit_paid || 0), 0);

  return (
    <div className="min-h-screen bg-[#f9f7f2]">

      {/* ── Floating Nav ── */}
      <div className="bg-[#0a0a0a] pt-16">
        <FloatingPageNav />
      </div>

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {bookingOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setBookingOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
            >
              <div className="w-full max-w-3xl max-h-[92vh] bg-[#f9f7f2] rounded-t-3xl sm:rounded-3xl overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 bg-[#0a0a0a] px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
                  <div>
                    <p className="text-[#d4af37] text-[10px] font-semibold tracking-[0.3em] uppercase">Client Portal</p>
                    <h2 className="text-white font-[Playfair_Display] text-lg">Book an Appointment</h2>
                  </div>
                  <button onClick={() => setBookingOpen(false)}
                    className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <BookingFlow mode="modal" onComplete={handleBookingComplete} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cancel confirm ── */}
      <AnimatePresence>
        {confirmCancel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmCancel(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
                <h3 className="font-[Playfair_Display] text-xl text-[#0a0a0a] mb-2">Cancel Appointment</h3>
                <p className="text-sm text-[#0a0a0a]/60 mb-6">
                  Are you sure? Deposits may not be refunded per our cancellation policy.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setConfirmCancel(false)} className="flex-1">Keep it</Button>
                  <Button onClick={handleCancel} className="flex-1 !bg-[#b22222]">Yes, Cancel</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Page content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BrandLogo size={36} withWordmark={false} />
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#b22222]">Client Portal</span>
            </div>
            <h1 className="font-[Playfair_Display] text-3xl text-[#0a0a0a]">
              {firstName ? `Welcome back, ${firstName}` : "Your Dashboard"}
            </h1>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[#0a0a0a]/45 hover:text-[#b22222] transition-colors mt-1">
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

        {/* Book new appointment CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-[#0a0a0a] rounded-2xl p-6 mb-8"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#b22222]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-[#d4af37]/15 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#d4af37]" />
                <p className="text-[#d4af37] text-[10px] font-semibold tracking-[0.3em] uppercase">Ready for your next visit?</p>
              </div>
              <p className="text-white font-[Playfair_Display] text-xl">Book a New Appointment</p>
              <p className="text-white/40 text-xs mt-1">GHS 50 deposit to secure your slot</p>
            </div>
            <button onClick={() => setBookingOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#b22222] hover:bg-[#cc2929] text-white rounded-full text-sm font-semibold tracking-wider uppercase transition-colors shrink-0">
              <Plus size={15} />
              Book Now
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-black/[0.04] rounded-xl p-1 w-fit">
          {(["appointments", "payments"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200",
                activeTab === tab ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#0a0a0a]/40 hover:text-[#0a0a0a]/70"
              )}>
              {tab === "appointments" ? "Appointments" : "Payment History"}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ── */}
        {activeTab === "appointments" && (
          <>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-black/5 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-black/5 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <section className="mb-10">
                    <h2 className="font-[Playfair_Display] text-xl text-[#0a0a0a] mb-5">Upcoming Appointments</h2>
                    <div className="space-y-4">
                      {upcoming.map((appt, i) => (
                        <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                          <AppointmentCard appt={appt} onCancel={() => { setCancelTarget(appt.id); setConfirmCancel(true); }} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {past.length > 0 && (
                  <section>
                    <h2 className="font-[Playfair_Display] text-xl text-[#0a0a0a] mb-5">Past Appointments</h2>
                    <div className="space-y-4">
                      {past.map((appt, i) => (
                        <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                          <AppointmentCard appt={appt} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {appointments.length === 0 && (
                  <div className="text-center py-24 text-[#0a0a0a]/40">
                    <Calendar size={44} className="mx-auto mb-5 opacity-25" />
                    <p className="font-[Playfair_Display] text-2xl mb-2">No appointments yet</p>
                    <p className="text-sm mb-8">Book your first experience with Queen Verene.</p>
                    <button onClick={() => setBookingOpen(true)}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-[#b22222] text-white rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-[#cc2929] transition-colors">
                      <Plus size={15} />
                      Book First Appointment
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Payment History Tab ── */}
        {activeTab === "payments" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

            {/* Summary card */}
            {paymentHistory.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-white/35 text-[10px] tracking-[0.25em] uppercase font-semibold mb-1">Total Paid</p>
                  <p className="text-white font-[Playfair_Display] text-3xl">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-white/35 text-[10px] tracking-[0.25em] uppercase font-semibold mb-1">Transactions</p>
                  <p className="text-white font-[Playfair_Display] text-3xl">{paymentHistory.length}</p>
                </div>
                <div className="flex-1">
                  <p className="text-white/35 text-[10px] tracking-[0.25em] uppercase font-semibold mb-1">Last Payment</p>
                  <p className="text-white font-[Playfair_Display] text-lg">
                    {paymentHistory[0] ? format(new Date(paymentHistory[0].start_time), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-black/5 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-black/5 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-20 text-[#0a0a0a]/40">
                <CreditCard size={44} className="mx-auto mb-5 opacity-25" />
                <p className="font-[Playfair_Display] text-2xl mb-2">No payments yet</p>
                <p className="text-sm">Deposits will appear here once you complete a booking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((appt, i) => (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <PaymentRow appt={appt} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, onCancel }: { appt: Appointment; onCancel?: () => void }) {
  const badge    = STATUS_BADGE[appt.status] ?? { label: appt.status, variant: "gray" as const };
  const canCancel = (appt.status === "pending" || appt.status === "confirmed") && !!onCancel;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.06] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <p className="font-[Playfair_Display] text-lg text-[#0a0a0a] leading-tight">
              {appt.services?.name || "Service"}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-[#0a0a0a]/45 mb-3">
            with {appt.staff_profiles?.users?.full_name || "Your Stylist"}
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-sm text-[#0a0a0a]/65">
              <Calendar size={13} className="text-[#b22222] shrink-0" />
              {format(new Date(appt.start_time), "EEEE, MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[#0a0a0a]/65">
              <Clock size={13} className="text-[#b22222] shrink-0" />
              {format(new Date(appt.start_time), "h:mm a")}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-[Playfair_Display] text-xl text-[#0a0a0a]">{formatCurrency(appt.total_price)}</p>
          <p className="text-xs text-[#0a0a0a]/35 mt-0.5">
            Deposit: {formatCurrency(appt.deposit_paid)}
          </p>
          {canCancel && (
            <button onClick={onCancel}
              className="mt-3 flex items-center gap-1 text-xs text-[#b22222]/60 hover:text-[#b22222] transition-colors ml-auto">
              <XCircle size={12} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ appt }: { appt: Appointment }) {
  const isPaid    = appt.payment_status === "paid" || appt.deposit_paid > 0;
  const isPending = appt.payment_status === "unpaid";

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.06] flex items-center gap-4">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        isPaid ? "bg-emerald-50" : isPending ? "bg-amber-50" : "bg-black/5"
      )}>
        {isPaid
          ? <CheckCircle2 size={18} className="text-emerald-500" />
          : isPending
          ? <AlertCircle size={18} className="text-amber-500" />
          : <CreditCard size={18} className="text-black/30" />
        }
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#0a0a0a] truncate">
          {appt.services?.name || "Beauty Service"}
        </p>
        <p className="text-xs text-[#0a0a0a]/40 mt-0.5">
          {format(new Date(appt.start_time), "MMM d, yyyy · h:mm a")}
        </p>
      </div>

      {/* Amount + status */}
      <div className="text-right shrink-0">
        <p className="font-[Playfair_Display] text-base text-[#0a0a0a] font-semibold">
          {formatCurrency(appt.deposit_paid)}
        </p>
        <p className={cn(
          "text-[10px] font-bold tracking-wide uppercase mt-0.5",
          isPaid    ? "text-emerald-500" :
          isPending ? "text-amber-500"   : "text-black/30"
        )}>
          {isPaid ? "Paid" : isPending ? "Pending" : appt.payment_status}
        </p>
      </div>
    </div>
  );
}

// Suspense wrapper (required for useSearchParams in Next.js App Router)
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9f7f2] flex items-center justify-center">
          <p className="text-[#0a0a0a]/30 text-sm tracking-widest uppercase">Loading…</p>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
