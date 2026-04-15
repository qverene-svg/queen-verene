"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail, isPhoneInput } from "@/lib/auth/normalizeEmail";
import { BrandLogo } from "@/components/brand/BrandLogo";
import toast from "react-hot-toast";

// ── Input style helpers ────────────────────────────────────────────────────────

function Field({
  label, type = "text", value, onChange, placeholder, required, autoFocus, hint,
}: {
  label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; autoFocus?: boolean; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={required} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "11px 14px", borderRadius: 10, fontSize: 14,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${focused ? "#d4af37" : "rgba(255,255,255,0.14)"}`,
          color: "#fff", outline: "none", transition: "border-color 0.2s",
        }}
      />
      {hint && <p style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

// ── Email / Phone toggle ───────────────────────────────────────────────────────

function TogglePill({ mode, onChange }: { mode: "email" | "phone"; onChange: (m: "email" | "phone") => void }) {
  return (
    <div style={{
      display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 99,
      padding: 3, border: "1px solid rgba(255,255,255,0.10)", marginBottom: 24,
    }}>
      {(["email", "phone"] as const).map((m) => (
        <button key={m} type="button" onClick={() => onChange(m)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "7px 0", borderRadius: 96, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", border: "none",
          transition: "background 0.2s, color 0.2s",
          background: mode === m ? "#fff" : "transparent",
          color: mode === m ? "#0a0a0a" : "rgba(255,255,255,0.4)",
        }}>
          {m === "email" ? <Mail size={12} /> : <Phone size={12} />}
          {m === "email" ? "Email" : "Phone"}
        </button>
      ))}
    </div>
  );
}

// ── OTP digit boxes ────────────────────────────────────────────────────────────

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !refs[i].current?.value && i > 0) {
      refs[i - 1].current?.focus();
    }
  };
  const handleInput = (i: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("");
    onChange(next.replace(/ /g, "").padEnd(6, "").slice(0, 6));
    if (digit && i < 5) setTimeout(() => refs[i + 1].current?.focus(), 0);
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted.padEnd(6, "").slice(0, 6)); refs[Math.min(pasted.length, 5)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "8px 0" }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          style={{
            width: 44, height: 52, textAlign: "center", fontSize: 20, fontWeight: 700,
            borderRadius: 10, border: `1.5px solid ${value[i] ? "#d4af37" : "rgba(255,255,255,0.15)"}`,
            background: value[i] ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.05)",
            color: "#fff", outline: "none", transition: "border-color 0.18s, background 0.18s",
            boxSizing: "border-box",
          }}
        />
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
      if (stored?.startsWith("/") && !returnTo) {
        sessionStorage.removeItem("verene_auth_return");
        router.replace(`/auth/login?returnTo=${encodeURIComponent(stored)}`);
      }
    } catch { /* ignore */ }
  }, [returnTo, router]);

  const [step,       setStep]       = useState<"enter" | "verify">("enter");
  const [inputMode,  setInputMode]  = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [otp,        setOtp]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [resending,  setResending]  = useState(false);
  const [sentTo,     setSentTo]     = useState(""); // display label

  // Auto-detect email vs phone
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentifier(val);
    if (val.includes("@")) setInputMode("email");
    else if (isPhoneInput(val) && val.length > 3) setInputMode("phone");
  };

  const regHref = returnTo
    ? `/auth/register?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/register";

  // ── Step 1: send code ──────────────────────────────────────────────────────

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    if (inputMode === "email") {
      // Supabase built-in email OTP
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizeAuthEmail(identifier),
        options: { shouldCreateUser: false },
      });
      if (error) {
        // If user doesn't exist Supabase returns a generic error; give a clear message
        if (error.message.toLowerCase().includes("not found") || error.status === 422 || error.status === 400) {
          toast.error("No account found for this email. Please register first.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }
      setSentTo(normalizeAuthEmail(identifier));
      setStep("verify");
      setOtp("");
    } else {
      // Custom phone OTP via Hubtel SMS
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not send code.");
        setLoading(false);
        return;
      }
      setSentTo(identifier);
      setStep("verify");
      setOtp("");
    }

    setLoading(false);
  };

  // ── Step 2: verify code ────────────────────────────────────────────────────

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 6) { toast.error("Enter the full 6-digit code."); return; }
    setLoading(true);

    const supabase = createClient();

    if (inputMode === "email") {
      const { error, data } = await supabase.auth.verifyOtp({
        email: normalizeAuthEmail(identifier),
        token: code,
        type:  "email",
      });
      if (error) {
        toast.error("Invalid or expired code. Request a new one.");
        setLoading(false);
        return;
      }
      await afterSignIn(data.user?.id, supabase);
    } else {
      // Exchange our custom phone OTP for a magic-link token
      const res = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, otp: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Invalid or expired code.");
        setLoading(false);
        return;
      }
      // Sign in with the magic-link token the server generated
      const { error, data } = await supabase.auth.verifyOtp({
        email:      json.email,
        token:      json.token_hash,
        type:       "magiclink",
      });
      if (error) {
        toast.error("Could not sign in. Please try again.");
        setLoading(false);
        return;
      }
      await afterSignIn(data.user?.id, supabase);
    }
  };

  // ── After sign-in: check role and redirect ─────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterSignIn = async (userId: string | undefined, supabase: any) => {
    if (!userId) { toast.error("Sign-in failed. Please try again."); setLoading(false); return; }
    const { data: profile } = await supabase.from("users").select("role").eq("id", userId).single();
    const role = (profile as { role: string } | null)?.role?.toLowerCase();
    if (role === "admin" || role === "manager" || role === "staff") {
      router.push("/admin");
      return;
    }
    if (returnTo?.startsWith("/")) { router.push(returnTo); return; }
    router.push("/dashboard");
  };

  // ── Resend ─────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    setResending(true);
    setOtp("");
    if (inputMode === "email") {
      const supabase = createClient();
      await supabase.auth.signInWithOtp({
        email: normalizeAuthEmail(identifier),
        options: { shouldCreateUser: false },
      });
    } else {
      await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier }),
      });
    }
    toast.success("New code sent!");
    setResending(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 24px 40px",
    }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <BrandLogo size={56} withWordmark />
          </div>
          <AnimatePresence mode="wait">
            {step === "enter" ? (
              <motion.div key="t1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", margin: "0 0 6px" }}>
                  Welcome back
                </h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
                  {returnTo?.includes("services") || returnTo?.includes("#book")
                    ? "Sign in to continue your booking."
                    : "Enter your email or phone to receive a login code."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="t2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", margin: "0 0 6px" }}>
                  Enter your code
                </h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
                  We sent a 6-digit code to{" "}
                  <span style={{ color: "#d4af37" }}>{sentTo}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 24, padding: 32 }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: Enter email or phone ── */}
            {step === "enter" && (
              <motion.form key="enter" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} onSubmit={handleSendCode}>
                <TogglePill mode={inputMode} onChange={(m) => { setInputMode(m); setIdentifier(""); }} />

                <div style={{ marginBottom: 24 }}>
                  <Field
                    label={inputMode === "email" ? "Email address" : "Phone number"}
                    type={inputMode === "email" ? "email" : "tel"}
                    value={identifier}
                    onChange={handleIdentifierChange}
                    placeholder={inputMode === "email" ? "you@example.com" : "0244 000 000"}
                    hint={inputMode === "phone" ? "Ghana number — with or without +233" : undefined}
                    required
                    autoFocus
                  />
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Send Code
                </Button>

                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 20 }}>
                  Don&apos;t have an account?{" "}
                  <Link href={regHref} style={{ color: "#d4af37", textDecoration: "none" }}>Create one</Link>
                </p>
              </motion.form>
            )}

            {/* ── Step 2: Enter OTP ── */}
            {step === "verify" && (
              <motion.form key="verify" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} onSubmit={handleVerify}>

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => { setStep("enter"); setOtp(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                    cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 11,
                    letterSpacing: "0.08em", padding: 0, marginBottom: 20, transition: "color 0.18s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
                >
                  <ArrowLeft size={13} /> Change {inputMode === "email" ? "email" : "phone"}
                </button>

                {/* OTP boxes */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 12, textAlign: "center" }}>
                    Enter 6-digit code
                  </label>
                  <OtpBoxes value={otp} onChange={setOtp} />
                  <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>
                    {inputMode === "email"
                      ? "Check your email inbox (and spam folder)"
                      : "Check your SMS messages"}
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  className="w-full"
                  disabled={otp.replace(/\D/g, "").length < 6}
                >
                  Verify & Sign In
                </Button>

                {/* Resend */}
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: "none", border: "none", cursor: resending ? "not-allowed" : "pointer",
                      color: "rgba(255,255,255,0.35)", fontSize: 12,
                      display: "inline-flex", alignItems: "center", gap: 5, transition: "color 0.18s",
                    }}
                    onMouseEnter={(e) => { if (!resending) (e.currentTarget as HTMLElement).style.color = "#d4af37"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
                  >
                    <RefreshCw size={11} style={{ animation: resending ? "spin 1s linear infinite" : "none" }} />
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                </div>

              </motion.form>
            )}

          </AnimatePresence>
        </div>

        {/* Staff note */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
          Staff &amp; admin?{" "}
          <Link href="/admin" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Use the staff login →</Link>
        </p>

      </motion.div>
    </div>
  );
}
