"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const SHELL_EXCLUDED = ["/admin", "/auth"];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = SHELL_EXCLUDED.some((p) => pathname.startsWith(p));

  if (isExcluded) return <>{children}</>;

  return (
    <>
      <Navbar />
      {/* padding-top matches the fixed navbar height (h-16 = 4rem = 64px) */}
      <main className="w-full pt-16" style={{ paddingTop: "4rem" }}>{children}</main>
      <Footer />
    </>
  );
}
