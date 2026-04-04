"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import toast from "react-hot-toast";

// ── Shared field ──────────────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, required,
  rightElement,
}: {
  label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: rightElement ? "11px 44px 11px 14px" : "11px 14px",
            borderRadius: 10, fontSize: 14,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${focused ? "#d4af37" : "rgba(255,255,255,0.14)"}`,
            color: "#fff", outline: "none", transition: "border-color 0.2s",
          }}
        />
        {rightElement && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Strength indicator ────────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter((rx) => rx.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#e53e3e", "#dd6b20", "#d4af37", "#25D366"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : "rgba(255,255,255,0.1)",
            transition: "background 0.25s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 10, color: colors[score] || "transparent", textAlign: "right" }}>
        {labels[score]}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase puts the recovery token in the URL hash; detect the session
  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires with event "PASSWORD_RECOVERY" when the page
    // is opened via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });

    // Also check if already in a valid session (e.g. reloaded the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); setLoading(false); return; }

    setDone(true);
    setTimeout(() => router.push("/auth/login"), 3000);
  };

  // ── Waiting for recovery session ─────────────────────────────────────────

  if (!sessionReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(212,175,55,0.3)", borderTopColor: "#d4af37", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Verifying reset link…</p>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          If nothing happens,{" "}
          <Link href="/auth/login" style={{ color: "#d4af37", textDecoration: "none" }}>go back to sign in</Link>.
        </p>
      </div>
    );
  }

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
          <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 24, color: "#fff", margin: "0 0 6px" }}>
            {done ? "Password Updated" : "Set New Password"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
            {done ? "Redirecting you to sign in…" : "Choose a strong password for your account."}
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 24, padding: 32,
        }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <CheckCircle2 size={48} style={{ color: "#25D366", margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6 }}>
                Your password has been reset successfully. Taking you back to sign in…
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* New password */}
              <div>
                <Field
                  label="New Password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  rightElement={
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 0, display: "flex" }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <StrengthBar password={password} />
              </div>

              {/* Confirm password */}
              <div>
                <Field
                  label="Confirm Password"
                  type={showCf ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  rightElement={
                    <button type="button" onClick={() => setShowCf(!showCf)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 0, display: "flex" }}>
                      {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {confirm && password !== confirm && (
                  <p style={{ marginTop: 6, fontSize: 11, color: "#e53e3e" }}>Passwords don&apos;t match</p>
                )}
                {confirm && password === confirm && confirm.length >= 8 && (
                  <p style={{ marginTop: 6, fontSize: 11, color: "#25D366" }}>✓ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 8}
                style={{
                  marginTop: 4, padding: "13px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: loading ? "wait" : "pointer",
                  background: password.length >= 8 && password === confirm ? "#b22222" : "rgba(255,255,255,0.08)",
                  color: password.length >= 8 && password === confirm ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "background 0.25s, color 0.25s",
                }}
              >
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
