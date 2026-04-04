"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home",     href: "/"          },
  { label: "Shop",     href: "/shop"      },
  { label: "Services", href: "/services"  },
  { label: "Booking",  href: "/dashboard", highlight: true },
  { label: "Jobs",     href: "/jobs"      },
];

export function FloatingPageNav() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .fpn-link { padding: 6px 10px; font-size: 9px; }
        @media (min-width: 480px) { .fpn-link { padding: 8px 16px; font-size: 11px; } }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ display: "flex", justifyContent: "center", width: "100%", padding: "16px 8px 8px" }}
      >
        <nav
          style={{
            display: "flex", alignItems: "center", gap: 2,
            borderRadius: 999, padding: "4px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            background: "rgba(10,10,10,0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.10)",
            maxWidth: "calc(100vw - 1rem)",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive    = pathname === link.href;
            const isHighlight = link.highlight;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "fpn-link rounded-full font-semibold tracking-[0.1em] uppercase transition-all duration-300 whitespace-nowrap",
                  isHighlight
                    ? "border border-[#d4af37]/70 text-[#f5d76e] hover:bg-[#d4af37]/15 hover:border-[#d4af37]"
                    : isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
}
