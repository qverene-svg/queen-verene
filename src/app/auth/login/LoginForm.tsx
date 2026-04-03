"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";
import { BrandLogo } from "@/components/brand/BrandLogo";
import toast from "react-hot-toast";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() || "";
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("verene_auth_return");
      if (stored && stored.startsWith("/") && !returnTo) {
        sessionStorage.removeItem("verene_auth_return");
        router.replace(`/auth/login?returnTo=${encodeURIComponent(stored)}`);
      }
    } catch {
      /* ignore */
    }
  }, [returnTo, router]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const normalized = normalizeAuthEmail(email);
    const { error, data } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) {
      if (error.message === "Invalid login credentials") {
        toast.error(
          "Wrong email or password — or the account is not confirmed. Check your Supabase Auth → Providers → Email."
        );
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Confirm your email from the link Supabase sent, then try again.");
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
    if (returnTo && returnTo.startsWith("/")) {
      router.push(returnTo);
      return;
    }
    router.push("/dashboard");
  };

  const regHref = returnTo
    ? `/auth/register?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/register";

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
          <h1 className="font-[Playfair_Display] text-2xl text-white mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm">
            {returnTo.includes("services") || returnTo.includes("#book")
              ? "Sign in to continue your booking."
              : "Sign in to your client portal."}
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="[&_label]:!text-white/50 [&_input]:!text-white [&_input]:!border-white/20 [&_input:focus]:!border-[#d4af37]">
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" loading={loading} size="lg" className="w-full">
            Sign in
          </Button>
          <p className="text-center text-white/40 text-sm">
            Don&apos;t have an account?{" "}
            <Link href={regHref} className="text-[#d4af37] hover:text-[#f5d76e] transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
