"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Recharts from "recharts";
import {
  Users, Calendar, TrendingUp, DollarSign, Package, Briefcase,
  LogOut, Scissors, LayoutDashboard, Eye, EyeOff, Search, Bell,
  Menu, X, ExternalLink, TrendingDown, ShoppingCart,
  Pencil, Trash2, Check, XCircle, UserCog, CalendarPlus,
  Phone, Mail, CreditCard, Clock, StickyNote, Info, Send, Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { AdminServicesPanel } from "@/components/admin/AdminServicesPanel";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { AdminCareersPanel } from "@/components/admin/AdminCareersPanel";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AdminBookingPanel } from "@/components/admin/AdminBookingPanel";
import { AdminWalkinPaymentPanel } from "@/components/admin/AdminWalkinPaymentPanel";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen  = "login" | "checking" | "dashboard";
type NavItem = "Overview" | "Services" | "Shop" | "Careers" | "Users" | "New Booking" | "Walk-in Pay";

type Appointment = {
  id: string;
  serviceName: string;
  client: string;
  time: string;
  status: string;
  amount: number;
  // extended fields
  paymentStatus: string;
  depositPaid: number;
  phone: string;
  email: string;
  customerNotes: string;
  endTime: string;
};
type EditingAppt = { id: string; serviceName: string; client: string; time: string; status: string; amount: number };

const ALLOWED_ROLES = new Set(["admin", "manager", "staff"]);
function isAllowedStaffRole(role?: string | null) {
  return !!role && ALLOWED_ROLES.has(role.toLowerCase());
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    confirmed: { bg: "rgba(52,211,153,0.12)", text: "#34d399", dot: "#34d399" },
    pending:   { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", dot: "#fbbf24" },
    cancelled: { bg: "rgba(248,113,113,0.12)", text: "#f87171", dot: "#f87171" },
    completed: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", dot: "#60a5fa" },
  };
  const s = styles[status] ?? { bg: "rgba(0,0,0,0.06)", text: "rgba(0,0,0,0.4)", dot: "rgba(0,0,0,0.3)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <span style={{ textTransform: "capitalize" }}>{status}</span>
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, delta, up }: {
  label: string; value: string; icon: React.ElementType; delta: number; up: boolean;
}) {
  return (
    <div style={{
      background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s",
    }}
      className="hover:border-black/[0.14]"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(178,34,34,0.13)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color: "#e05252" }} />
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700,
          borderRadius: 999, padding: "3px 9px",
          background: up ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
          color: up ? "#34d399" : "#f87171",
        }}>
          {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {delta}%
        </span>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4, fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { value: number }[];
  label?: string; formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181b", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, padding: "8px 12px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#fff", fontWeight: 600 }}>{formatter ? formatter(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [screen,    setScreen]    = useState<Screen>("checking");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [role,      setRole]      = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavItem>("Overview");
  const [sideOpen,  setSideOpen]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState<EditingAppt | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canManage = role === "admin" || role === "manager";
  const isAdmin   = role === "admin";

  // Booking details drawer
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  // Initiate payment modal
  const [payInitAppt, setPayInitAppt] = useState<Appointment | null>(null);
  const [payLinkLoading, setPayLinkLoading] = useState(false);
  const [payLink, setPayLink] = useState<string | null>(null);
  const [payCopied, setPayCopied] = useState(false);

  type NavDef = { icon: React.ElementType; label: NavItem; restricted: boolean };
  const NAV_ITEMS: NavDef[] = [
    { icon: LayoutDashboard, label: "Overview", restricted: false      },
    { icon: Scissors,        label: "Services", restricted: !canManage },
    { icon: Package,         label: "Shop",     restricted: !canManage },
    { icon: Briefcase,       label: "Careers",  restricted: !canManage },
    { icon: UserCog,         label: "Users",       restricted: !isAdmin   },
    { icon: CalendarPlus,    label: "New Booking", restricted: !canManage },
    { icon: Wallet,          label: "Walk-in Pay", restricted: !canManage },
  ];
  const visibleNav = NAV_ITEMS.filter((n) => !n.restricted);

  const monthlyRevenue = appointments.reduce((sum, a) => sum + a.amount, 0);
  const activeBookings = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed").length;
  const activeClients = new Set(appointments.map((a) => a.client.toLowerCase())).size;
  const avgOrder = appointments.length > 0 ? Math.round(monthlyRevenue / appointments.length) : 0;

  const revenueMap = new Map<string, number>();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = format(d, "MMM");
    revenueMap.set(key, 0);
  }
  appointments.forEach((a) => {
    const key = format(new Date(a.time), "MMM");
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + a.amount);
    }
  });
  const revenueData = Array.from(revenueMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  const peakHourMap = new Map<string, number>();
  appointments.forEach((a) => {
    const hour = format(new Date(a.time), "ha").toLowerCase();
    peakHourMap.set(hour, (peakHourMap.get(hour) ?? 0) + 1);
  });
  const peakHours = Array.from(peakHourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => Number.parseInt(a.hour, 10) - Number.parseInt(b.hour, 10));

  /** Parse [meta:channel=sms&name=X&phone=Y&email=Z] from notes field */
  const parseMeta = (notes: string): { name: string; phone: string; email: string; channel: string; cleanNotes: string } => {
    const match = notes?.match(/^\[meta:([^\]]+)\]\s*/);
    if (!match) return { name: "", phone: "", email: "", channel: "", cleanNotes: notes || "" };
    const p = new URLSearchParams(match[1]);
    return {
      name:       p.get("name")    || "",
      phone:      p.get("phone")   || "",
      email:      p.get("email")   || "",
      channel:    p.get("channel") || "",
      cleanNotes: notes.slice(match[0].length).trim(),
    };
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("appointments") as any)
      .select("id, start_time, end_time, status, total_price, payment_status, deposit_paid, notes, services(name), users:customer_id(full_name, email, phone)")
      .order("start_time", { ascending: false })
      .limit(200);

    if (error) {
      toast.error(`Could not load bookings: ${error.message}`);
      setAppointments([]);
      setAppointmentsLoading(false);
      return;
    }

    const mapped: Appointment[] = ((data as Array<Record<string, unknown>>) || []).map((row) => {
      const service = row.services as { name?: string } | null;
      const user    = row.users   as { full_name?: string; email?: string; phone?: string } | null;
      const meta    = parseMeta(String(row.notes ?? ""));
      return {
        id:            String(row.id ?? ""),
        serviceName:   service?.name || "Service",
        client:        user?.full_name || meta.name || "Client",
        time:          String(row.start_time ?? new Date().toISOString()),
        endTime:       String(row.end_time   ?? ""),
        status:        String(row.status     ?? "pending"),
        amount:        Number(row.total_price ?? 0),
        paymentStatus: String(row.payment_status ?? "unpaid"),
        depositPaid:   Number(row.deposit_paid   ?? 0),
        phone:         user?.phone  || meta.phone  || "",
        email:         user?.email  || meta.email  || "",
        customerNotes: meta.cleanNotes,
      };
    });
    setAppointments(mapped);
    setAppointmentsLoading(false);
  };

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setScreen("login"); return; }
      const { data: p } = await sb.from("users").select("role").eq("id", session.user.id).single();
      const profile = p as { role: string } | null;
      if (!profile || !isAllowedStaffRole(profile.role)) { setScreen("login"); return; }
      setRole(profile.role.toLowerCase());
      setScreen("dashboard");
      loadAppointments();
    });
  }, []);

  useEffect(() => { if (role === "staff") setActiveNav("Overview"); }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sb = createClient();
    const { error: authErr, data } = await sb.auth.signInWithPassword({
      email: normalizeAuthEmail(email), password,
    });
    if (authErr) {
      toast.error(authErr.message === "Invalid login credentials"
        ? "Wrong email or password."
        : authErr.message);
      setLoading(false); return;
    }
    const { data: profile, error: pErr } = await sb.from("users").select("role").eq("id", data.user.id).single();
    if (pErr || !profile) {
      toast.error("Profile not found. Run the INSERT SQL in Supabase.");
      await sb.auth.signOut(); setLoading(false); return;
    }
    const p = profile as { role: string };
    if (!isAllowedStaffRole(p.role)) {
      toast.error(`Role "${p.role}" is not allowed.`);
      await sb.auth.signOut(); setLoading(false); return;
    }
    setRole(p.role.toLowerCase()); setScreen("dashboard"); setLoading(false);
    loadAppointments();
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    setRole(null); setEmail(""); setPassword(""); setScreen("login");
  };

  const openPayInitModal = (appt: Appointment) => {
    setPayInitAppt(appt);
    setPayLink(null);
    setPayCopied(false);
  };

  const closePayInitModal = () => {
    setPayInitAppt(null);
    setPayLink(null);
    setPayCopied(false);
    setPayLinkLoading(false);
  };

  const handleGeneratePayLink = async () => {
    if (!payInitAppt) return;
    setPayLinkLoading(true);
    const remaining = (payInitAppt.amount - payInitAppt.depositPaid) / 100;
    try {
      const res = await fetch("/api/payments/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: remaining,
          description: `Verene Balance Payment - ${payInitAppt.serviceName}`,
          clientReference: `balance-${payInitAppt.id}`,
          customerPhone: payInitAppt.phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || "Failed to generate payment link.");
        setPayLinkLoading(false);
        return;
      }
      setPayLink(json?.checkoutUrl || json?.url || json?.paymentUrl || JSON.stringify(json));
    } catch {
      toast.error("Network error while generating payment link.");
    }
    setPayLinkLoading(false);
  };

  const handleCopyPayLink = () => {
    if (!payLink) return;
    navigator.clipboard.writeText(payLink).then(() => {
      setPayCopied(true);
      setTimeout(() => setPayCopied(false), 2000);
    });
  };

  // ── Checking ──────────────────────────────────────────────────────────────
  if (screen === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f11", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <BrandLogo size={52} withWordmark wordmarkClassName="text-white" />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase" }} className="animate-pulse">Loading…</p>
        </motion.div>
      </div>
    );
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (screen === "login") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f11", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ width: "100%", maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <BrandLogo size={52} withWordmark wordmarkClassName="text-white" />
          </div>

          {/* Card */}
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", marginBottom: 6 }}>Staff Access</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 28 }}>Sign in with your staff credentials.</p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@verene.com"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(178,34,34,0.55)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(178,34,34,0.55)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "rgba(178,34,34,0.5)" : "#b22222",
                  color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                  transition: "background 0.2s", marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = "#cc2929"; }}
                onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = "#b22222"; }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p style={{ marginTop: 24, textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 12 }}>
              Staff accounts are managed in Supabase Auth.
            </p>
          </div>

          <Link href="/"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, color: "rgba(255,255,255,0.22)", fontSize: 12, textDecoration: "none", transition: "color 0.2s" }}
            className="hover:!text-white/60"
          >
            <ExternalLink size={11} /> Back to site
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    // Root: full-viewport flex row — ALL structural styles inline to bypass Tailwind cache
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "#0f0f11", color: "#fff", fontFamily: "var(--font-montserrat),sans-serif" }}>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSideOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.35)" }} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }} animate={{ x: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
        style={{
          width: 240, flexShrink: 0, background: "#111113",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        className={cn(
          "max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:z-50",
          sideOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {/* Logo row */}
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <BrandLogo size={30} withWordmark />
        </div>

        {/* Workspace */}
        <div style={{ padding: "20px 20px 8px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Workspace</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 }}>Queen Verene Studio</p>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "8px 12px 16px", overflowY: "auto" }}>
          {visibleNav.map(({ icon: Icon, label }) => {
            const active = activeNav === label;
            return (
              <button key={label} type="button"
                onClick={() => { setActiveNav(label); setSideOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                  background: active ? "#b22222" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                  boxShadow: active ? "0 4px 16px rgba(178,34,34,0.25)" : "none",
                }}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; } }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Quick links */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>Quick Links</p>
          {[{ href: "/", label: "View Site" }, { href: "/dashboard", label: "Client Portal" }].map((l) => (
            <Link key={l.href} href={l.href}
              style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.35)", fontSize: 12, padding: "5px 0", textDecoration: "none", transition: "color 0.18s" }}
              className="hover:!text-black/65">
              <ExternalLink size={11} />{l.label}
            </Link>
          ))}
        </div>
      </motion.aside>

      {/* ── Right column ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Top header ── */}
        <motion.header
          initial={{ y: -64 }} animate={{ y: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
          style={{
            height: 64, flexShrink: 0, background: "#111113",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 12, padding: "0 24px",
          }}
        >
          {/* Mobile hamburger */}
          <button type="button" onClick={() => setSideOpen(!sideOpen)} aria-label="Toggle sidebar"
            style={{ display: "none", padding: 6, background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", borderRadius: 8 }}
            className="max-lg:!flex">
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 280, width: "100%", display: "flex" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", pointerEvents: "none" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              className="max-sm:hidden"
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Bell */}
            <button type="button" aria-label="Notifications"
              style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.35)", transition: "all 0.18s" }}
              className="hover:!text-black hover:!border-black/20">
              <Bell size={15} />
            </button>

            {/* Role badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
              padding: "3px 10px", borderRadius: 999, border: "1px solid",
              ...(role === "admin"   ? { borderColor: "rgba(178,34,34,0.4)",   background: "rgba(178,34,34,0.1)",   color: "#b22222" } :
                 role === "manager" ? { borderColor: "rgba(212,175,55,0.4)",   background: "rgba(212,175,55,0.1)",  color: "#d4af37" } :
                                      { borderColor: "rgba(0,0,0,0.10)",       background: "rgba(255,255,255,0.05)",      color: "rgba(255,255,255,0.45)" }),
            }}
              className="max-sm:hidden"
            >
              {role}
            </span>

            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#b22222,#8b1a1a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {role ? role.slice(0, 2).toUpperCase() : "AD"}
            </div>

            {/* Sign out */}
            <button type="button" onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "color 0.18s" }}
              className="hover:!text-black">
              <LogOut size={13} />
              <span className="max-sm:hidden">Sign out</span>
            </button>
          </div>
        </motion.header>

        {/* ── Scrollable main ── */}
        <main style={{ flex: 1, overflowY: "auto", background: "#0f0f11" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 48px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── Overview panel ── */}
                {activeNav === "Overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                    {/* Page title row */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b22222", marginBottom: 4 }}>Admin Panel</p>
                        <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 28, color: "#fff", margin: 0 }}>Business Overview</h1>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
                        {new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>

                    {/* KPI grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
                      {[
                        { label: "Revenue (last 6 months)", value: formatCurrency(monthlyRevenue), icon: DollarSign, delta: 0, up: true },
                        { label: "Total Bookings", value: String(appointments.length), icon: Calendar, delta: 0, up: true },
                        { label: "Active Clients", value: String(activeClients), icon: Users, delta: 0, up: true },
                        { label: "Avg Order Value", value: formatCurrency(avgOrder), icon: ShoppingCart, delta: 0, up: true },
                      ].map((m, i) => (
                        <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                          <KpiCard {...m} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Charts (managers+) */}
                    {canManage && (
                      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }} className="max-lg:!grid-cols-1">
                        {/* Revenue chart */}
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Revenue</p>
                              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 3 }}>Monthly Revenue</p>
                            </div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", borderRadius: 999, padding: "3px 10px" }}>
                              <TrendingUp size={10} /> {activeBookings} active
                            </span>
                          </div>
                          <Recharts.ResponsiveContainer width="100%" height={190}>
                            <Recharts.AreaChart data={revenueData}>
                              <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor="#b22222" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="#b22222" stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                              <Recharts.XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.35)" }} axisLine={false} tickLine={false} />
                              <Recharts.YAxis tick={{ fontSize: 11, fill: "rgba(0,0,0,0.35)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                              <Recharts.Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                              <Recharts.Area type="monotone" dataKey="revenue" stroke="#b22222" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: "#b22222", r: 3, strokeWidth: 0 }} />
                            </Recharts.AreaChart>
                          </Recharts.ResponsiveContainer>
                        </motion.div>

                        {/* Peak hours chart */}
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Bookings</p>
                          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 3, marginBottom: 20 }}>Peak Hours</p>
                          <Recharts.ResponsiveContainer width="100%" height={190}>
                            <Recharts.BarChart data={peakHours} barSize={10}>
                              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                              <Recharts.XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} axisLine={false} tickLine={false} />
                              <Recharts.YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} axisLine={false} tickLine={false} />
                              <Recharts.Tooltip content={<ChartTooltip />} />
                              <Recharts.Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} />
                            </Recharts.BarChart>
                          </Recharts.ResponsiveContainer>
                        </motion.div>
                      </div>
                    )}

                    {/* Bookings table */}
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
                      style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                      {/* Table header */}
                      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                            {role === "staff" ? "Your Appointments" : "Bookings"}
                          </p>
                          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 3 }}>Recent Bookings</p>
                        </div>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                          {appointmentsLoading ? "Loading live bookings..." : `${appointments.length} live booking(s)`}
                        </span>
                      </div>

                      {/* Table */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              {["ID", "Service", "Client", "Date & Time", "Status", "Amount", "Actions"].map((h) => (
                                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.filter(a =>
                              !search || a.client.toLowerCase().includes(search.toLowerCase()) || a.serviceName.toLowerCase().includes(search.toLowerCase())
                            ).map((appt, i) => {
                              const isEditing = editingId === appt.id;
                              const isDeleteConfirm = deleteConfirmId === appt.id;
                              const inlineInput = (val: string, field: keyof EditingAppt, type = "text") => (
                                <input
                                  type={type}
                                  value={val}
                                  onChange={(e) => setEditDraft((d) => d ? { ...d, [field]: e.target.value } : d)}
                                  style={{
                                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.4)",
                                    borderRadius: 6, color: "#fff", fontSize: 12, padding: "4px 8px",
                                    outline: "none", width: "100%", minWidth: 80,
                                  }}
                                />
                              );
                              return (
                                <motion.tr key={appt.id}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 + i * 0.05 }}
                                  style={{
                                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                                    background: isEditing ? "rgba(212,175,55,0.04)" : isDeleteConfirm ? "rgba(248,113,113,0.04)" : "transparent",
                                    transition: "background 0.15s",
                                  }}
                                >
                                  <td style={{ padding: "12px 20px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>{appt.id}</td>

                                  {/* Service */}
                                  <td style={{ padding: "12px 20px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", maxWidth: 160 }}>
                                    {isEditing && editDraft ? inlineInput(editDraft.serviceName, "serviceName") : appt.serviceName}
                                  </td>

                                  {/* Client */}
                                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                                    {isEditing && editDraft ? inlineInput(editDraft.client, "client") : appt.client}
                                  </td>

                                  {/* Date */}
                                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.45)", fontSize: 12, whiteSpace: "nowrap" }}>
                                    {isEditing && editDraft
                                      ? inlineInput(editDraft.time.slice(0, 16), "time", "datetime-local")
                                      : format(new Date(appt.time), "MMM d · h:mm a")}
                                  </td>

                                  {/* Status */}
                                  <td style={{ padding: "12px 20px" }}>
                                    {isEditing && editDraft ? (
                                      <select
                                        value={editDraft.status}
                                        onChange={(e) => setEditDraft((d) => d ? { ...d, status: e.target.value } : d)}
                                        style={{ background: "#1a1a1e", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 6, color: "#0a0a0a", fontSize: 12, padding: "4px 8px", outline: "none" }}
                                      >
                                        {["confirmed","pending","cancelled","completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    ) : <StatusPill status={appt.status} />}
                                  </td>

                                  {/* Amount */}
                                  <td style={{ padding: "12px 20px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                                    {isEditing && editDraft
                                      ? inlineInput(String(editDraft.amount), "amount", "number")
                                      : formatCurrency(appt.amount)}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                                    {isDeleteConfirm ? (
                                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <span style={{ fontSize: 11, color: "#f87171", marginRight: 4 }}>Delete?</span>
                                        <button
                                          onClick={async () => {
                                            const sb = createClient();
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const { error } = await (sb.from("appointments") as any).delete().eq("id", appt.id);
                                            if (error) {
                                              toast.error(error.message);
                                              return;
                                            }
                                            setAppointments((a) => a.filter((x) => x.id !== appt.id));
                                            setDeleteConfirmId(null);
                                            toast.success("Booking deleted.");
                                          }}
                                          style={{ padding: "4px 10px", borderRadius: 6, background: "#b22222", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                          Yes
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(null)}
                                          style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>
                                          No
                                        </button>
                                      </div>
                                    ) : isEditing ? (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                          onClick={async () => {
                                            if (!editDraft) return;
                                            const sb = createClient();
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const { error } = await (sb.from("appointments") as any)
                                              .update({
                                                start_time: new Date(editDraft.time).toISOString(),
                                                status: editDraft.status,
                                                total_price: Number(editDraft.amount),
                                              })
                                              .eq("id", appt.id);
                                            if (error) {
                                              toast.error(error.message);
                                              return;
                                            }
                                            setAppointments((a) => a.map((x) => x.id === appt.id ? { ...x, ...editDraft, amount: Number(editDraft.amount) } : x));
                                            setEditingId(null); setEditDraft(null);
                                            toast.success("Booking updated.");
                                          }}
                                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                          <Check size={13} />
                                        </button>
                                        <button onClick={() => { setEditingId(null); setEditDraft(null); }}
                                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                          <XCircle size={13} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                          onClick={() => setDetailAppt(appt)}
                                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                          title="View full details"
                                        >
                                          <Info size={12} />
                                        </button>
                                        {canManage && (
                                          <button
                                            onClick={() => openPayInitModal(appt)}
                                            style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(52,211,153,0.22)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(52,211,153,0.1)"; }}
                                            title="Initiate payment"
                                          >
                                            <Send size={12} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => { setEditingId(appt.id); setEditDraft({ ...appt }); }}
                                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }}
                                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.22)"; }}
                                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.1)"; }}
                                          title="Edit booking"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirmId(appt.id)}
                                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }}
                                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.2)"; }}
                                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.08)"; }}
                                          title="Delete booking"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeNav === "Services" && canManage && <AdminServicesPanel />}
                {activeNav === "Shop"     && canManage && <AdminProductsPanel />}
                {activeNav === "Careers"  && canManage && <AdminCareersPanel />}
                {activeNav === "Users"       && isAdmin   && <AdminUsersPanel />}
                {activeNav === "New Booking" && canManage && (
                  <AdminBookingPanel
                    onSuccess={() => {
                      loadAppointments();          // refresh Overview table
                      setTimeout(() => setActiveNav("Overview"), 3200); // switch after success banner
                    }}
                  />
                )}
                {activeNav === "Walk-in Pay" && canManage && <AdminWalkinPaymentPanel />}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Booking Detail Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {detailAppt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailAppt(null)}
              style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 70,
                width: "min(480px, 100vw)", background: "#18181b",
                borderLeft: "1px solid rgba(0,0,0,0.09)",
                display: "flex", flexDirection: "column", overflowY: "auto",
              }}
            >
              {/* Drawer header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#b22222", marginBottom: 2 }}>Booking Details</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>#{detailAppt.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setDetailAppt(null)}
                  style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Status row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatusPill status={detailAppt.status} />
                  {/* Payment status pill */}
                  {(() => {
                    const ps = detailAppt.paymentStatus;
                    const psColors: Record<string, { bg: string; text: string }> = {
                      deposit_paid: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
                      paid:         { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
                      unpaid:       { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
                      refunded:     { bg: "rgba(96,165,250,0.12)", text: "#60a5fa" },
                    };
                    const c = psColors[ps] ?? { bg: "rgba(0,0,0,0.05)", text: "rgba(0,0,0,0.35)" };
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        <CreditCard size={10} />
                        <span style={{ textTransform: "capitalize" }}>{ps.replace("_", " ")}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Service & time */}
                <div style={{ background: "#0f0f11", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 14 }}>Appointment</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <DetailRow icon={<Scissors size={13} />} label="Service" value={detailAppt.serviceName} />
                    <DetailRow icon={<Calendar size={13} />} label="Date" value={format(new Date(detailAppt.time), "EEEE, d MMMM yyyy")} />
                    <DetailRow icon={<Clock size={13} />} label="Time"
                      value={`${format(new Date(detailAppt.time), "h:mm a")}${detailAppt.endTime ? ` → ${format(new Date(detailAppt.endTime), "h:mm a")}` : ""}`}
                    />
                    <DetailRow icon={<DollarSign size={13} />} label="Total Price" value={formatCurrency(detailAppt.amount)} />
                    <DetailRow icon={<CreditCard size={13} />} label="Deposit Paid"
                      value={detailAppt.depositPaid > 0 ? formatCurrency(detailAppt.depositPaid) : "Not yet paid"}
                      valueColor={detailAppt.depositPaid > 0 ? "#34d399" : "#fbbf24"}
                    />
                  </div>
                </div>

                {/* Client info */}
                <div style={{ background: "#0f0f11", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 14 }}>Client</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <DetailRow icon={<Users size={13} />} label="Name" value={detailAppt.client || "—"} />
                    {detailAppt.phone && (
                      <DetailRow icon={<Phone size={13} />} label="Phone" value={detailAppt.phone}
                        action={<a href={`tel:${detailAppt.phone}`} style={{ color: "#60a5fa", fontSize: 10 }}>Call</a>}
                      />
                    )}
                    {detailAppt.email && (
                      <DetailRow icon={<Mail size={13} />} label="Email" value={detailAppt.email}
                        action={<a href={`mailto:${detailAppt.email}`} style={{ color: "#60a5fa", fontSize: 10 }}>Email</a>}
                      />
                    )}
                    {!detailAppt.phone && !detailAppt.email && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>No contact info on file</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {detailAppt.customerNotes && (
                  <div style={{ background: "#0f0f11", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <StickyNote size={13} style={{ color: "rgba(255,255,255,0.28)" }} />
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Notes</p>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{detailAppt.customerNotes}</p>
                  </div>
                )}

                {/* Actions */}
                {canManage && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => { setEditingId(detailAppt.id); setEditDraft({ ...detailAppt }); setDetailAppt(null); }}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#d4af37", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Pencil size={13} /> Edit Booking
                    </button>
                    <button
                      onClick={() => { setDeleteConfirmId(detailAppt.id); setDetailAppt(null); }}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Initiate Payment Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {payInitAppt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePayInitModal}
              style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                zIndex: 90, width: "min(460px, calc(100vw - 32px))",
                background: "#18181b", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.15)", overflow: "hidden",
              }}
            >
              {/* Modal header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={16} style={{ color: "#34d399" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b22222" }}>Admin</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Initiate Payment</p>
                  </div>
                </div>
                <button onClick={closePayInitModal}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={15} />
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Booking summary */}
                <div style={{ background: "#0f0f11", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 4 }}>Booking Summary</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Client</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{payInitAppt.client}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Service</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{payInitAppt.serviceName}</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Price</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{formatCurrency(payInitAppt.amount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Deposit Paid</span>
                    <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
                      {payInitAppt.depositPaid > 0 ? `− ${formatCurrency(payInitAppt.depositPaid)}` : "—"}
                    </span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Amount Owed</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#b22222" }}>
                      {formatCurrency(payInitAppt.amount - payInitAppt.depositPaid)}
                    </span>
                  </div>
                </div>

                {/* Contact info hint */}
                {(payInitAppt.phone || payInitAppt.email) && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {payInitAppt.phone && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "5px 10px" }}>
                        <Phone size={11} /> {payInitAppt.phone}
                      </span>
                    )}
                    {payInitAppt.email && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "5px 10px" }}>
                        <Mail size={11} /> {payInitAppt.email}
                      </span>
                    )}
                  </div>
                )}

                {/* Generated link */}
                {payLink && (
                  <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#34d399" }}>Payment Link Generated</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", wordBreak: "break-all", fontFamily: "monospace", lineHeight: 1.5 }}>{payLink}</p>
                    <button
                      onClick={handleCopyPayLink}
                      style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.35)", background: payCopied ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.08)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 6 }}>
                      {payCopied ? <Check size={13} /> : null}
                      {payCopied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                )}

                {/* Generate button */}
                {!payLink && (
                  <button
                    onClick={handleGeneratePayLink}
                    disabled={payLinkLoading}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                      background: payLinkLoading ? "rgba(178,34,34,0.5)" : "#b22222",
                      color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      cursor: payLinkLoading ? "not-allowed" : "pointer", transition: "background 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { if (!payLinkLoading) (e.currentTarget as HTMLButtonElement).style.background = "#cc2929"; }}
                    onMouseLeave={(e) => { if (!payLinkLoading) (e.currentTarget as HTMLButtonElement).style.background = "#b22222"; }}
                  >
                    <Send size={14} />
                    {payLinkLoading ? "Generating…" : "Generate Payment Link"}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({ icon, label, value, valueColor, action }: {
  icon: React.ReactNode; label: string; value: string;
  valueColor?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ color: "rgba(255,255,255,0.3)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, color: valueColor || "#0a0a0a", fontWeight: 500, wordBreak: "break-word" }}>{value}</p>
      </div>
      {action && <span style={{ flexShrink: 0, marginTop: 14 }}>{action}</span>}
    </div>
  );
}
