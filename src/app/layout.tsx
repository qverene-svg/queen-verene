import type { Metadata } from "next";
import { Montserrat, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import "./cascade-fix.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { Toaster } from "react-hot-toast";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: { default: "Verene | Premium Beauty Studio — Accra, Ghana", template: "%s | Verene" },
  description:
    "Book luxury beauty services — braiding, pedicure, manicure, wig making, makeup, and hair care. Ghana's premier beauty destination.",
  keywords: ["beauty salon accra", "braiding ghana", "luxury beauty", "wig making", "makeup artist ghana"],
  openGraph: {
    title: "Verene | Premium Beauty Studio",
    description: "Where Beauty Meets Elegance. Book your appointment today.",
    type: "website",
  },
};

/**
 * Critical layout CSS injected directly into HTML.
 *
 * WHY: The WSL dev-server file-watcher does not detect changes made from
 * Windows, so globals.css / cascade-fix.css may not be recompiled until
 * the server is restarted. Tailwind v4's CSS bundle therefore lacks .mx-auto
 * and other utility rules, leaving the unlayered  `* { margin: 0 }`  reset
 * from the original globals.css as the only margin rule — which left-aligns
 * every centered container.
 *
 * Injecting these rules as a <style> tag is compiled on-demand (TSX) so they
 * are always fresh. Once the dev server is restarted these are redundant but
 * harmless.
 */
const CRITICAL_CSS = `
  /* ── Reset: :where() has 0 specificity → any class can override it ─────── */
  :where(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Centering ──────────────────────────────────────────────────────────── */
  .mx-auto  { margin-left: auto; margin-right: auto; }
  .ml-auto  { margin-left: auto; }
  .mr-auto  { margin-right: auto; }
  .my-auto  { margin-top: auto; margin-bottom: auto; }

  /* ── Width & max-width ──────────────────────────────────────────────────── */
  .w-full   { width: 100%; }
  .max-w-none { max-width: none; }
  .max-w-xs   { max-width: 20rem; }
  .max-w-sm   { max-width: 24rem; }
  .max-w-md   { max-width: 28rem; }
  .max-w-lg   { max-width: 32rem; }
  .max-w-xl   { max-width: 36rem; }
  .max-w-2xl  { max-width: 42rem; }
  .max-w-3xl  { max-width: 48rem; }
  .max-w-4xl  { max-width: 56rem; }
  .max-w-5xl  { max-width: 64rem; }
  .max-w-6xl  { max-width: 72rem; }
  .max-w-7xl  { max-width: 80rem; }

  /* ── Display ────────────────────────────────────────────────────────────── */
  .block        { display: block; }
  .inline-block { display: inline-block; }
  .inline-flex  { display: inline-flex; }
  .flex         { display: flex; }
  .grid         { display: grid; }
  .hidden       { display: none; }

  /* ── Flex helpers ───────────────────────────────────────────────────────── */
  .flex-col        { flex-direction: column; }
  .flex-row        { flex-direction: row; }
  .flex-1          { flex: 1 1 0%; }
  .flex-wrap       { flex-wrap: wrap; }
  .items-center    { align-items: center; }
  .items-start     { align-items: flex-start; }
  .justify-center  { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-end     { justify-content: flex-end; }

  /* ── Positioning ────────────────────────────────────────────────────────── */
  .relative { position: relative; }
  .absolute { position: absolute; }
  .fixed    { position: fixed; }
  .sticky   { position: sticky; }

  /* ── Text alignment ─────────────────────────────────────────────────────── */
  .text-center { text-align: center; }
  .text-left   { text-align: left; }
  .text-right  { text-align: right; }

  /* ── Height ─────────────────────────────────────────────────────────────── */
  .h-screen   { height: 100vh; }
  .min-h-screen { min-height: 100vh; }
  .h-full     { height: 100%; }
  .h-auto     { height: auto; }

  /* ── Overflow ────────────────────────────────────────────────────────────── */
  .overflow-hidden  { overflow: hidden; }
  .overflow-y-auto  { overflow-y: auto; }
  .overflow-x-auto  { overflow-x: auto; }
  .overflow-auto    { overflow: auto; }

  /* ── Flex shrink / grow ─────────────────────────────────────────────────── */
  .shrink-0   { flex-shrink: 0; }
  .grow       { flex-grow: 1; }

  /* ── Min-width ───────────────────────────────────────────────────────────── */
  .min-w-0    { min-width: 0; }

  /* ── Gap ────────────────────────────────────────────────────────────────── */
  .gap-0  { gap: 0; }
  .gap-1  { gap: 0.25rem; }
  .gap-2  { gap: 0.5rem; }
  .gap-3  { gap: 0.75rem; }
  .gap-4  { gap: 1rem; }
  .gap-5  { gap: 1.25rem; }
  .gap-6  { gap: 1.5rem; }
  .gap-8  { gap: 2rem; }
  .gap-10 { gap: 2.5rem; }
  .gap-12 { gap: 3rem; }

  /* ── Space Y ─────────────────────────────────────────────────────────────── */
  .space-y-1 > * + * { margin-top: 0.25rem; }
  .space-y-2 > * + * { margin-top: 0.5rem; }
  .space-y-3 > * + * { margin-top: 0.75rem; }
  .space-y-4 > * + * { margin-top: 1rem; }
  .space-y-5 > * + * { margin-top: 1.25rem; }
  .space-y-6 > * + * { margin-top: 1.5rem; }
  .space-y-8 > * + * { margin-top: 2rem; }

  /* ── Grid ────────────────────────────────────────────────────────────────── */
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .col-span-1  { grid-column: span 1 / span 1; }
  .col-span-2  { grid-column: span 2 / span 2; }
  .col-span-3  { grid-column: span 3 / span 3; }
  .col-span-4  { grid-column: span 4 / span 4; }

  /* ── Padding ────────────────────────────────────────────────────────────── */
  .p-0    { padding: 0; }
  .pt-0   { padding-top: 0; }
  .pt-4   { padding-top: 1rem; }
  .pt-6   { padding-top: 1.5rem; }
  .pt-8   { padding-top: 2rem; }
  .pt-10  { padding-top: 2.5rem; }
  .pt-12  { padding-top: 3rem; }
  .pt-16  { padding-top: 4rem; }
  .pt-20  { padding-top: 5rem; }
  .pt-24  { padding-top: 6rem; }
  .pt-28  { padding-top: 7rem; }
  .pb-4   { padding-bottom: 1rem; }
  .pb-6   { padding-bottom: 1.5rem; }
  .pb-8   { padding-bottom: 2rem; }
  .pb-10  { padding-bottom: 2.5rem; }
  .pb-16  { padding-bottom: 4rem; }
  .pb-20  { padding-bottom: 5rem; }
  .pb-24  { padding-bottom: 6rem; }
  .pb-28  { padding-bottom: 7rem; }
  .py-4   { padding-top: 1rem;   padding-bottom: 1rem; }
  .py-6   { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .py-8   { padding-top: 2rem;   padding-bottom: 2rem; }
  .py-10  { padding-top: 2.5rem; padding-bottom: 2.5rem; }
  .py-12  { padding-top: 3rem;   padding-bottom: 3rem; }
  .py-16  { padding-top: 4rem;   padding-bottom: 4rem; }
  .py-20  { padding-top: 5rem;   padding-bottom: 5rem; }
  .py-24  { padding-top: 6rem;   padding-bottom: 6rem; }
  .px-4   { padding-left: 1rem;  padding-right: 1rem; }
  .px-5   { padding-left: 1.25rem; padding-right: 1.25rem; }
  .px-6   { padding-left: 1.5rem; padding-right: 1.5rem; }
  .px-8   { padding-left: 2rem;  padding-right: 2rem; }
  .px-10  { padding-left: 2.5rem; padding-right: 2.5rem; }
  .p-4    { padding: 1rem; }
  .p-5    { padding: 1.25rem; }
  .p-6    { padding: 1.5rem; }
  .p-8    { padding: 2rem; }
  .p-10   { padding: 2.5rem; }

  /* ── Anchor scroll offset (accounts for 64px fixed navbar) ─────────────── */
  [id] { scroll-margin-top: 4.5rem; }

  /* ── Large-screen (≥1024 px) responsive overrides — admin sidebar fix ───── */
  @media (min-width: 1024px) {
    .lg\:static           { position: static !important; }
    .lg\:translate-x-0   { transform: translateX(0) !important; }
    .lg\:z-auto          { z-index: auto !important; }
    .lg\:shrink-0        { flex-shrink: 0 !important; }
    .lg\:hidden          { display: none !important; }
    .lg\:flex            { display: flex !important; }
    .lg\:col-span-2      { grid-column: span 2 / span 2 !important; }
    .lg\:col-span-3      { grid-column: span 3 / span 3 !important; }
    .lg\:col-span-4      { grid-column: span 4 / span 4 !important; }
    .lg\:grid-cols-4     { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .lg\:grid-cols-5     { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
    .lg\:px-8            { padding-left: 2rem !important; padding-right: 2rem !important; }
    .lg\:px-10           { padding-left: 2.5rem !important; padding-right: 2.5rem !important; }
  }

  /* ── Medium-screen (≥768 px) ─────────────────────────────────────────────── */
  @media (min-width: 768px) {
    .md\:flex            { display: flex !important; }
    .md\:hidden          { display: none !important; }
    .md\:grid-cols-2     { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .md\:grid-cols-3     { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .md\:px-12           { padding-left: 3rem !important; padding-right: 3rem !important; }
    .md\:items-end       { align-items: flex-end !important; }
    .md\:flex-row        { flex-direction: row !important; }
    .md\:flex-col        { flex-direction: column !important; }
  }

  /* ── Small-screen (≥640 px) ─────────────────────────────────────────────── */
  @media (min-width: 640px) {
    .sm\:flex            { display: flex !important; }
    .sm\:hidden          { display: none !important; }
    .sm\:block           { display: block !important; }
    .sm\:flex-row        { flex-direction: row !important; }
    .sm\:grid-cols-2     { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .sm\:px-6            { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
    .sm\:inline          { display: inline !important; }
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${playfairDisplay.variable} ${montserrat.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#f9f7f2] text-[#0a0a0a] antialiased">
        {/* Inline critical CSS — ensures layout utilities are never missing
            regardless of CSS bundle compilation state */}
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <SiteShell>{children}</SiteShell>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0a0a0a",
              color: "#f9f7f2",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "13px",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#d4af37", secondary: "#0a0a0a" } },
            error: { iconTheme: { primary: "#b22222", secondary: "#f9f7f2" } },
          }}
        />
      </body>
    </html>
  );
}
