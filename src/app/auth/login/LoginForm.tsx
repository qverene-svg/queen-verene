"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail, phoneToAuthEmail, isPhoneInput } from "@/lib/auth/normalizeEmail";
import { BrandLogo } from "@/components/brand/BrandLogo";
import toast from "react-hot-toast";

type Mode = "login" | "forgot";

// ── Shared input style ────────────────────────────────────────────────────────

function Field({
  label, type = "text", value, onChange, placeholder, required, autoFocus,
}: {
  label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "11px 14px", borderRadius: 10, fontSize: 14,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${focused ? "#d4af37" : "rgba(255,255,255,0.14)"}`,
          color: "#fff", outline: "none",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

// ── Toggle pill (Email / Phone) ────────────────────────────────────────────────

function TogglePill({ mode, onChange }: { mode: "email" | "phone"; onChange: (m: "email" | "phone") => void }) {
  return (
    <div style={{
      display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 99,
      padding: 3, border: "1px solid rgba(255,255,255,0.10)", marginBottom: 24,
    }}>
      {(["email", "phone"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 0", borderRadius: 96, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", border: "none",
            transition: "background 0.2s, color 0.2s",
            background: mode === m ? "#fff" : "transparent",
            color: mode === m ? "#0a0a0a" : "rgba(255,255,255,0.4)",
          }}
        >
          {m === "email" ? <Mail size={12} /> : <Phone size={12} />}
          {m === "email" ? "Email" : "Phone"}
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() || "";

  // Restore returnTo from sessionStorage if missing from query
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("verene_auth_return");
      if (stored && stored.startsWith("/") && !returnTo) {
        sessionStorage.removeItem("verene_auth_return");
        router.replace(`/auth/login?returnTo=${encodeURIComponent(stored)}`);
      }
    } catch { /* ignore */ }
  }, [returnTo, router]);

  const [mode, setMode] = useState<Mode>("login");
  const [inputMode, setInputMode] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [resetSent, setResetSent]   = useState(false);

  // Auto-detect email vs phone as user types
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentifier(val);
    if (val.includes("@")) setInputMode("email");
    else if (isPhoneInput(val) && val.length > 3) setInputMode("phone");
  };

  // ── Login ──────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const authEmail = isPhoneInput(identifier)
      ? phoneToAuthEmail(identifier)
      : normalizeAuthEmail(identifier);

    const { error, data } = await supabase.auth.signInWithPassword({ email: authEmail, password });

    if (error) {
      if (error.message === "Invalid login credentials") {
        toast.error("Incorrect credentials. Check your email/phone and password.");
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please confirm your email first, then try again.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
    const userRole = (userProfile as { role: string } | null)?.role?.toLowerCase();
    if (userRole === "admin" || userRole === "manager" || userRole === "staff") {
      router.push("/admin");
      return;
    }
    if (returnTo && returnTo.startsWith("/")) { router.push(returnTo); return; }
    router.push("/dashboard");
  };

  // ── Forgot password ────────────────────────────────────────────────────────

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || isPhoneInput(identifier)) {
      toast.error("Enter the email address linked to your account.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizeAuthEmail(identifier),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );
    if (error) { toast.error(error.message); setLoading(false); return; }
    setResetSent(true);
    setLoading(false);
  };

  const regHref = returnTo
    ? `/auth/register?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/register";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 24px 40px",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <BrandLogo size={56} withWordmark />
          </div>
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div key="login-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", margin: "0 0 6px" }}>
                  Welcome back
                </h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
                  {returnTo.includes("services") || returnTo.includes("#book")
                    ? "Sign in to continue your booking."
                    : "Sign in to your client portal."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="forgot-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", margin: "0 0 6px" }}>
                  Reset Password
                </h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
                  We&apos;ll send a reset link to your email.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 24, padding: 32,
        }}>
          <AnimatePresence mode="wait">

            {/* ── Login form ── */}
            {mode === "login" && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={handleLogin}
              >
                {/* Email / Phone toggle */}
                <TogglePill mode={inputMode} onChange={(m) => { setInputMode(m); setIdentifier(""); }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <Field
                    label={inputMode === "email" ? "Email address" : "Phone number"}
                    type={inputMode === "email" ? "email" : "tel"}
                    value={identifier}
                    onChange={handleIdentifierChange}
                    placeholder={inputMode === "email" ? "you@example.com" : "0244 000 000"}
                    required
                    autoFocus
                  />
                  <div>
                    <Field
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setPassword(""); }}
                      style={{
                        marginTop: 8, background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.32)", fontSize: 11,
                        letterSpacing: "0.04em", padding: 0, float: "right",
                        transition: "color 0.18s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#d4af37"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)"; }}
                    >
                      Forgot password?
                    </button>
                    <div style={{ clear: "both" }} />
                  </div>
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full" style={{ marginTop: 28 }}>
                  Sign in
                </Button>

                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 20 }}>
                  Don&apos;t have an account?{" "}
                  <Link href={regHref} style={{ color: "#d4af37", textDecoration: "none" }}>
                    Create one
                  </Link>
                </p>
              </motion.form>
            )}

            {/* ── Forgot password form ── */}
            {mode === "forgot" && !resetSent && (
              <motion.form
                key="forgot-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleForgotPassword}
              >
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                    cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 11,
                    letterSpacing: "0.08em", padding: 0, marginBottom: 20, transition: "color 0.18s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
                >
                  <ArrowLeft size={13} /> Back to sign in
                </button>

                <div style={{ marginBottom: 24 }}>
                  <Field
                    label="Email address"
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                  <p style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                    Note: password reset is only available for email accounts.
                  </p>
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Send Reset Link
                </Button>
              </motion.form>
            )}

            {/* ── Reset sent confirmation ── */}
            {mode === "forgot" && resetSent && (
              <motion.div
                key="reset-sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "8px 0" }}
              >
                <CheckCircle2 size={40} style={{ color: "#25D366", margin: "0 auto 16px" }} />
                <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  Check your inbox
                </h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                  A password reset link has been sent to <span style={{ color: "#d4af37" }}>{identifier}</span>.
                  Click the link in the email to set a new password.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99,
                    color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "8px 20px", cursor: "pointer",
                    transition: "border-color 0.18s, color 0.18s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                >
                  Back to sign in
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
