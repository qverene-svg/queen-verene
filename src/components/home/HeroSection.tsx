"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home",     href: "/"          },
  { label: "Shop",     href: "/shop"      },
  { label: "Services", href: "/services"  },
  { label: "Booking",  href: "/dashboard", highlight: true },
  { label: "Jobs",     href: "/jobs"      },
];

export function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => setLoaded(true), []);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: [0.25, 0.4, 0.25, 1] as const },
  });

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden bg-black">

      {/* ── Background ─────────────────────────────── */}
      <div className="absolute inset-0">
        <motion.img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: loaded ? 1 : 0, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          onLoad={() => setLoaded(true)}
        />
        {/* Dark overlay — heavier at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/80" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ── Gold top rule ───────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-20" />

      {/* ── Main content — vertically centered ──────── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 sm:px-8 text-center pt-24 pb-40">

        {/* Eyebrow */}
        <motion.div {...fade(0.3)} className="flex items-center gap-2.5 mb-6">
          <div className="h-px w-8 bg-[#d4af37]/60" />
          <Scissors size={13} className="text-[#d4af37] rotate-45 shrink-0" />
          <span className="text-[#d4af37] text-[11px] font-bold tracking-[0.35em] uppercase">
            Queen Verene Beauty Studio
          </span>
          <Scissors size={13} className="text-[#d4af37] -rotate-45 shrink-0" />
          <div className="h-px w-8 bg-[#d4af37]/60" />
        </motion.div>

        {/* Headline — fluid, never clips */}
        <motion.h1
          {...fade(0.55)}
          className="font-bold leading-[1.08] tracking-tight mb-6 max-w-4xl"
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
          }}
        >
          <span className="block text-white">Where Beauty</span>
          <span className="block" style={{
            background: "linear-gradient(135deg,#d4af37 0%,#f5d76e 45%,#d4af37 75%,#b8960c 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Meets Elegance
          </span>
        </motion.h1>

        {/* Gold divider */}
        <motion.div {...fade(0.7)} className="flex items-center gap-3 mb-8">
          <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4af37]/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/70" />
          <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4af37]/50" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          {...fade(0.85)}
          className="text-white/65 max-w-lg mx-auto leading-relaxed mb-10"
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
          }}
        >
          Braiding, pedicures, wigs, makeup, and hair care —<br className="hidden sm:block" />
          curated for the discerning Ghanaian woman.
        </motion.p>

        {/* CTA button */}
        <motion.div {...fade(1.0)} className="flex justify-center">
          <motion.button
            onClick={() => router.push("/services")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden rounded-full text-white font-semibold shadow-2xl hover:shadow-[#b22222]/40 w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg,#8b1a1a,#b22222)",
              fontFamily: "var(--font-montserrat), sans-serif",
              padding: "14px 40px",
              fontSize: "0.8rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              View Our Services <ArrowRight size={15} />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#b22222] to-[#cc2929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </motion.div>
      </div>

      {/* ── Floating bottom nav ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-max max-w-[calc(100vw-2rem)]"
      >
        <nav className={cn(
          "flex items-center gap-1 rounded-full px-3 py-2 shadow-2xl",
          "bg-black/50 backdrop-blur-md border border-white/[0.12]"
        )}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-5 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 whitespace-nowrap",
                link.highlight
                  ? "border border-[#d4af37]/60 text-[#f5d76e] hover:bg-[#d4af37]/15"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </motion.div>

      {/* ── Scroll cue ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-[4.5rem] right-6 z-20 hidden sm:block"
      >
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-white/25 text-[9px] tracking-[0.25em] uppercase" style={{ writingMode: "vertical-rl" }}>
            Scroll
          </p>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
}
