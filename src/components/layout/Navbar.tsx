"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navLinks = [
  { href: "/",          label: "Home"     },
  { href: "/shop",      label: "Shop"     },
  { href: "/services",  label: "Services" },
  { href: "/dashboard", label: "Booking", matchPath: "/dashboard" },
  { href: "/jobs",      label: "Jobs"     },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center min-w-0 group">
              <BrandLogo size={40} withWordmark />
            </Link>

            <nav className="hidden md:flex flex-1 items-center justify-center flex-wrap gap-x-0.5 gap-y-1 px-2 lg:px-4 min-w-0">
              {navLinks.map((link) => {
                const isActive = pathname === (link.matchPath ?? link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-[11px] font-medium tracking-wide uppercase transition-colors",
                      link.label === "Booking"
                        ? "border border-[#c41212]/60 text-[#c41212] hover:bg-[#c41212]/10"
                        : isActive
                        ? "text-white bg-white/10"
                        : "text-white/65 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link href="/auth/login">
                <button type="button" className="p-2 rounded-lg text-white/50 hover:text-white transition-colors" aria-label="Account">
                  <User size={18} />
                </button>
              </Link>
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="!text-[10px] !tracking-widest !px-4 !py-2">
                  Book now
                </Button>
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-white/70 hover:text-white -mr-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 z-40 w-72 bg-[#0a0a0a] md:hidden flex flex-col border-l border-white/10"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
                <BrandLogo size={36} withWordmark />
                <button type="button" onClick={() => setMenuOpen(false)} className="text-white/50 hover:text-white p-2">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4 flex-1">
                {navLinks.map((link) => {
                  const isActive = pathname === (link.matchPath ?? link.href);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        "py-3 px-4 rounded-xl text-xs font-semibold tracking-wide uppercase",
                        isActive ? "text-[#d4af37] bg-white/5" : "text-white/65 hover:text-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10 flex flex-col gap-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="md" className="w-full !border-white/20 !text-white/80 hover:!bg-white hover:!text-black">
                    Login
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="primary" size="md" className="w-full">
                    Book now
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
