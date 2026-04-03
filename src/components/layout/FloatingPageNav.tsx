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
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
      className="flex justify-center w-full px-4 pt-4 pb-2"
    >
      <nav
        className="flex items-center gap-1 rounded-full px-2 py-2 shadow-xl w-max max-w-[calc(100vw-2rem)]"
        style={{
          background: "rgba(10,10,10,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.10)",
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
                "px-4 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 whitespace-nowrap",
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
  );
}
