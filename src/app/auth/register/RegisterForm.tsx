"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import toast from "react-hot-toast";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() || "";

  const [form, setForm]     = useState({ full_name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const loginHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        full_name: form.full_name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim() || null,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    if (json.autoLogin && json.token_hash && json.email) {
      // Silently sign the user in using the magic-link token the server generated
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: json.email,
        token: json.token_hash,
        type:  "magiclink",
      });
      if (error) {
        // Auto-login failed — fall back to asking them to sign in
        toast.success("Account created! Please sign in with your email.");
        router.push(loginHref);
        return;
      }
      toast.success(`Welcome, ${form.full_name.split(" ")[0]}! 🎉`);
      if (returnTo?.startsWith("/")) { router.push(returnTo); return; }
      router.push("/dashboard");
    } else {
      // Fallback: auto-login not available
      toast.success(json.message || "Account created! Please sign in.");
      router.push(loginHref);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <BrandLogo size={56} withWordmark />
          </div>
          <h1 className="font-[Playfair_Display] text-2xl text-white mb-1">Create Your Account</h1>
          <p className="text-white/40 text-sm">
            {returnTo && (returnTo.includes("services") || returnTo.includes("#book"))
              ? "Sign up to finish your booking."
              : "No password needed — we'll send a code when you sign in."}
          </p>
        </div>

        <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Akua Mensah"
              required
            />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input
              label="Phone (Ghana) — optional"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0244 000 000"
            />
            <p className="text-white/25 text-[11px] mt-1.5 leading-relaxed">
              Adding your phone lets you log in with a text message code.
            </p>
          </div>

          {/* Info banner — no password */}
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)",
          }}>
            <p style={{ fontSize: 12, color: "rgba(212,175,55,0.8)", lineHeight: 1.6, margin: 0 }}>
              ✨ No password required. Each time you sign in we&apos;ll send a one-time code to your email or phone.
            </p>
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Create Account
          </Button>

          <p className="text-center text-white/40 text-sm">
            Already have an account?{" "}
            <Link href={loginHref} className="text-[#d4af37] hover:text-[#f5d76e] transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
