"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { BrandLogo } from "@/components/brand/BrandLogo";
import toast from "react-hot-toast";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() || "";
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const loginHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const email = normalizeAuthEmail(form.email);
    const { error, data } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      toast.error("Sign-up did not return a user. Check Supabase logs.");
      setLoading(false);
      return;
    }

    if (!data.session) {
      if (returnTo && returnTo.startsWith("/")) {
        try {
          sessionStorage.setItem("verene_auth_return", returnTo);
        } catch {
          /* ignore */
        }
      }
      toast.success(
        "Check your email and confirm your account before signing in. (Or disable “Confirm email” under Supabase → Authentication → Providers → Email for local dev.)"
      );
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      full_name: form.full_name,
      email,
      phone: form.phone || null,
      role: "customer",
    });
    if (insertError) {
      toast.error(
        `Account created but profile save failed: ${insertError.message}. Run the SQL in supabase/schema.sql for policy "Users can insert own profile".`
      );
      setLoading(false);
      return;
    }

    toast.success("Account created! Welcome to Queen Verene.");
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 pt-20">
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
              : "Join the Queen Verene experience."}
          </p>
        </div>

        <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Akua Mensah" required />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Phone (Ghana)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0244 000 000" />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
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
