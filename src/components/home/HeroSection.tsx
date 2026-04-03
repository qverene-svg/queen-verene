"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Floating nav (MCP magic — adapted for Queen Verene) ──────────────────────

const NAV_LINKS = [
  { label: "Home",     href: "/"          },
  { label: "Shop",     href: "/shop"      },
  { label: "Services", href: "/services"  },
  { label: "Booking",  href: "/dashboard", highlight: true },
  { label: "Jobs",     href: "/jobs"      },
];

function FloatingNav() {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.5 }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-max max-w-[calc(100vw-2rem)]"
    >
      <nav className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.14] px-2 py-2 shadow-2xl">
        {NAV_LINKS.map((link) => {
          const isActive    = pathname === link.href;
          const isHighlight = link.highlight;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 whitespace-nowrap",
                isHighlight
                  ? "border border-[#d4af37]/70 text-[#f5d76e] hover:bg-[#d4af37]/15 hover:border-[#d4af37]"
                  : isActive
                  ? "bg-white/20 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

interface LuxuryBeautyHeroProps {
  headline?: string;
  subtitle?: string;
  primaryCTA?: { text: string; href?: string; onClick?: () => void };
  backgroundImage?: string;
  className?: string;
}

function LuxuryBeautyHero({
  headline = "Where Beauty\nMeets Elegance",
  subtitle = "Braiding, pedicures, wigs, makeup, and hair care — curated for the discerning Ghanaian woman.",
  primaryCTA   = { text: "Experience our Services", href: "/services" },
  backgroundImage = "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop",
  className = "",
}: LuxuryBeautyHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => { setIsLoaded(true); }, []);

  const fadeUp = {
    hidden:  { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 1.2, delay: 0.3 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
  };

  const handlePrimary = () => { if (primaryCTA.onClick) primaryCTA.onClick(); else if (primaryCTA.href) router.push(primaryCTA.href); };

  const [line1, line2] = headline.split("\n");

  return (
    <div className={cn(
      "relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black",
      className
    )}>
      {/* Gold top rule */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-20" />

      {/* Background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt="Verene Beauty Studio"
            className="w-full h-full object-cover"
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop";
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">

          {/* Headline */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold mb-8 tracking-tight leading-none"
              style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>
              {line2 ? (
                <>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/80">
                    {line1}
                  </span>
                  <span className="block" style={{
                    background: "linear-gradient(135deg, #d4af37 0%, #f5d76e 40%, #d4af37 70%, #b8960c 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    {line2}
                  </span>
                </>
              ) : (
                <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/80">
                  {headline}
                </span>
              )}
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <p className="text-lg sm:text-xl md:text-2xl text-white/65 mb-12 leading-relaxed font-light tracking-wide max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
              {subtitle}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
            className="flex justify-center items-center">
            <motion.button onClick={handlePrimary} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="group relative px-8 sm:px-16 py-4 sm:py-5 bg-gradient-to-r from-[#8b1a1a] to-[#b22222] text-white rounded-full font-semibold overflow-hidden shadow-2xl hover:shadow-[#b22222]/50 w-full sm:w-auto max-w-xs sm:max-w-none"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
              <span className="relative z-10 tracking-[0.14em] uppercase text-sm sm:text-base">{primaryCTA.text}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#b22222] to-[#cc2929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* ── Floating nav (MCP magic) ── */}
      <FloatingNav />

      {/* Scroll indicator — sits below the floating nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <LuxuryBeautyHero
      headline={"Where Beauty\nMeets Elegance"}
      subtitle="Braiding, pedicures, wigs, makeup, and hair care — curated for the discerning Ghanaian woman."
      primaryCTA={{ text: "Experience our Services", href: "/services" }}
      backgroundImage="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop"
    />
  );
}
