"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Recharts from "recharts";
import {
  Users, Calendar, TrendingUp, DollarSign, Package, Briefcase,
  LogOut, Scissors, LayoutDashboard, Eye, EyeOff, Search, Bell,
  Menu, X, ExternalLink, TrendingDown, ShoppingCart,
  Pencil, Trash2, Check, XCircle,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { AdminServicesPanel } from "@/components/admin/AdminServicesPanel";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { AdminCareersPanel } from "@/components/admin/AdminCareersPanel";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ── Demo data ─────────────────────────────────────────────────────────────────

const REVENUE_DATA = [
  { month: "Jan", revenue: 180000 },
  { month: "Feb", revenue: 240000 },
  { month: "Mar", revenue: 320000 },
  { month: "Apr", revenue: 280000 },
  { month: "May", revenue: 410000 },
  { month: "Jun", revenue: 360000 },
];

const PEAK_HOURS = [
  { hour: "9am", count: 5  }, { hour: "10am", count: 8  },
  { hour: "11am", count: 12 }, { hour: "12pm", count: 7  },
  { hour: "1pm",  count: 4  }, { hour: "2pm",  count: 9  },
  { hour: "3pm",  count: 11 }, { hour: "4pm",  count: 14 },
  { hour: "5pm",  count: 10 },
];

const DEMO_APPOINTMENTS = [
  { id: "BK001", serviceName: "Ghana Braiding",     client: "Akosua Mensah",  time: "2025-06-12T09:00:00", status: "confirmed", amount: 45000 },
  { id: "BK002", serviceName: "Bridal Makeup",       client: "Ama Owusu",      time: "2025-06-12T11:00:00", status: "confirmed", amount: 80000 },
  { id: "BK003", serviceName: "Wig Installation",    client: "Efua Darko",     time: "2025-06-12T13:30:00", status: "pending",   amount: 35000 },
  { id: "BK004", serviceName: "Luxury Mani & Pedi",  client: "Abena Asante",   time: "2025-06-11T14:00:00", status: "confirmed", amount: 12000 },
  { id: "BK005", serviceName: "Deep Hair Treatment", client: "Serwa Boateng",  time: "2025-06-11T10:00:00", status: "cancelled", amount: 18000 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen  = "login" | "checking" | "dashboard";
type NavItem = "Overview" | "Services" | "Shop" | "Careers";

type Appointment = typeof DEMO_APPOINTMENTS[number] & { serviceName: string; client: string; time: string; status: string; amount: number };
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
  const s = styles[status] ?? { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.4)", dot: "rgba(255,255,255,0.3)" };
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
      className="hover:border-white/[0.14]"
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
    <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "8px 12px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
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
  const [appointments, setAppointments] = useState(DEMO_APPOINTMENTS);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState<EditingAppt | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canManage = role === "admin" || role === "manager";

  type NavDef = { icon: React.ElementType; label: NavItem; restricted: boolean };
  const NAV_ITEMS: NavDef[] = [
    { icon: LayoutDashboard, label: "Overview", restricted: false      },
    { icon: Scissors,        label: "Services", restricted: !canManage },
    { icon: Package,         label: "Shop",     restricted: !canManage },
    { icon: Briefcase,       label: "Careers",  restricted: !canManage },
  ];
  const visibleNav = NAV_ITEMS.filter((n) => !n.restricted);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setScreen("login"); return; }
      const { data: p } = await sb.from("users").select("role").eq("id", session.user.id).single();
      const profile = p as { role: string } | null;
      if (!profile || !isAllowedStaffRole(profile.role)) { setScreen("login"); return; }
      setRole(profile.role.toLowerCase());
      setScreen("dashboard");
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
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    setRole(null); setEmail(""); setPassword(""); setScreen("login");
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
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.65)" }} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }} animate={{ x: 0 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
        style={{
          width: 240, flexShrink: 0, background: "#111113",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          // On mobile: fixed overlay; handled via sideOpen state + transform below
        }}
        // On mobile screens we overlay; on desktop it stays in flow
        className={cn(
          "max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:z-50",
          sideOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {/* Logo row */}
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <BrandLogo size={30} withWordmark wordmarkClassName="text-white" />
        </div>

        {/* Workspace */}
        <div style={{ padding: "20px 20px 8px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Workspace</p>
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
                  color: active ? "#fff" : "rgba(255,255,255,0.38)",
                  fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                  boxShadow: active ? "0 4px 16px rgba(178,34,34,0.25)" : "none",
                }}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)"; } }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Quick links */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>Quick Links</p>
          {[{ href: "/", label: "View Site" }, { href: "/dashboard", label: "Client Portal" }].map((l) => (
            <Link key={l.href} href={l.href}
              style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.28)", fontSize: 12, padding: "5px 0", textDecoration: "none", transition: "color 0.18s" }}
              className="hover:!text-white/65">
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
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.22)", pointerEvents: "none" }} />
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
              className="hover:!text-white hover:!border-white/20">
              <Bell size={15} />
            </button>

            {/* Role badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
              padding: "3px 10px", borderRadius: 999, border: "1px solid",
              ...(role === "admin"   ? { borderColor: "rgba(178,34,34,0.4)",   background: "rgba(178,34,34,0.1)",   color: "#f87171" } :
                 role === "manager" ? { borderColor: "rgba(212,175,55,0.4)",   background: "rgba(212,175,55,0.1)",  color: "#d4af37" } :
                                      { borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }),
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
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "rgba(255,255,255,0.28)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "color 0.18s" }}
              className="hover:!text-white">
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
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>
                        {new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>

                    {/* KPI grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
                      {[
                        { label: "Monthly Revenue",  value: "GHS 3,600", icon: DollarSign,  delta: 12, up: true  },
                        { label: "Total Bookings",   value: "46",         icon: Calendar,    delta: 8,  up: true  },
                        { label: "Active Clients",   value: "128",        icon: Users,       delta: 5,  up: true  },
                        { label: "Avg Order Value",  value: "GHS 78",     icon: ShoppingCart,delta: 3,  up: false },
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
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Revenue · 2025</p>
                              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 3 }}>Monthly Revenue</p>
                            </div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", borderRadius: 999, padding: "3px 10px" }}>
                              <TrendingUp size={10} /> 12.5%
                            </span>
                          </div>
                          <Recharts.ResponsiveContainer width="100%" height={190}>
                            <Recharts.AreaChart data={REVENUE_DATA}>
                              <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor="#b22222" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#b22222" stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                              <Recharts.XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.28)" }} axisLine={false} tickLine={false} />
                              <Recharts.YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.28)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
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
                            <Recharts.BarChart data={PEAK_HOURS} barSize={10}>
                              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                              <Recharts.XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)" }} axisLine={false} tickLine={false} />
                              <Recharts.YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)" }} axisLine={false} tickLine={false} />
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
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>
                          Demo data — connect Supabase for live records
                        </span>
                      </div>

                      {/* Table */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              {["ID", "Service", "Client", "Date & Time", "Status", "Amount", "Actions"].map((h) => (
                                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", whiteSpace: "nowrap" }}>{h}</th>
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
                                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,175,55,0.4)",
                                    borderRadius: 6, color: "#fff", fontSize: 12, padding: "4px 8px",
                                    outline: "none", width: "100%", minWidth: 80,
                                  }}
                                />
                              );
                              return (
                                <motion.tr key={appt.id}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 + i * 0.05 }}
                                  style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                                    background: isEditing ? "rgba(212,175,55,0.04)" : isDeleteConfirm ? "rgba(248,113,113,0.05)" : "transparent",
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
                                  <td style={{ padding: "12px 20px", color: "rgba(255,255,255,0.38)", fontSize: 12, whiteSpace: "nowrap" }}>
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
                                        style={{ background: "#1a1a1e", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 6, color: "#fff", fontSize: 12, padding: "4px 8px", outline: "none" }}
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
                                          onClick={() => { setAppointments((a) => a.filter((x) => x.id !== appt.id)); setDeleteConfirmId(null); toast.success("Booking deleted."); }}
                                          style={{ padding: "4px 10px", borderRadius: 6, background: "#b22222", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                          Yes
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(null)}
                                          style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>
                                          No
                                        </button>
                                      </div>
                                    ) : isEditing ? (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                          onClick={() => {
                                            if (!editDraft) return;
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

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
