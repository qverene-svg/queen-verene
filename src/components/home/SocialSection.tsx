"use client";

import { motion } from "framer-motion";

import { WHATSAPP_BUSINESS_NUMBER, formatGhanaPhoneDisplay, businessWhatsAppHref } from "@/lib/contact";

const INSTAGRAM_URL = "https://www.instagram.com/Queenverene_beauty/";
const TIKTOK_URL    = "https://www.tiktok.com/@Queen.Verene";
const FACEBOOK_URL  = "https://www.facebook.com/Queen-Verene-Hair";
const WHATSAPP_URL  = businessWhatsAppHref();

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const SOCIALS = [
  {
    label:   "Instagram",
    handle:  "@Queenverene_beauty",
    href:    INSTAGRAM_URL,
    Icon:    InstagramIcon,
    grad:    "linear-gradient(135deg,#833ab4,#E1306C,#F56040)",
    hoverBg: "rgba(225,48,108,0.12)",
  },
  {
    label:   "TikTok",
    handle:  "@Queen.Verene",
    href:    TIKTOK_URL,
    Icon:    TikTokIcon,
    grad:    "linear-gradient(135deg,#010101,#69C9D0)",
    hoverBg: "rgba(105,201,208,0.10)",
  },
  {
    label:   "Facebook",
    handle:  "Queen-Verene Hair",
    href:    FACEBOOK_URL,
    Icon:    FacebookIcon,
    grad:    "linear-gradient(135deg,#2d4f9e,#4267B2)",
    hoverBg: "rgba(66,103,178,0.12)",
  },
  {
    label:   "WhatsApp",
    handle:  formatGhanaPhoneDisplay(WHATSAPP_BUSINESS_NUMBER),
    href:    WHATSAPP_URL,
    Icon:    WhatsAppIcon,
    grad:    "linear-gradient(135deg,#128C7E,#25D366)",
    hoverBg: "rgba(37,211,102,0.10)",
  },
];

export function SocialSection() {
  return (
    <section style={{ padding: "40px 20px", background: "#0a0a0a", position: "relative", overflow: "hidden" }}>
      <style>{`
        .ss-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 480px) {
          .ss-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .ss-grid { grid-template-columns: repeat(4, 1fr); }
          .ss-section { padding: 40px 40px !important; }
        }
      `}</style>
      {/* Subtle ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 65%)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <p style={{ color: "#d4af37", fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 6 }}>
            Follow Along
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: "clamp(22px,5vw,28px)", color: "#fff", margin: "0 0 6px" }}>
            Find Us Online
          </h2>
          <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, maxWidth: 340, margin: "0 auto", lineHeight: 1.6 }}>
            Stay connected for inspiration, behind-the-scenes looks, and exclusive offers.
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(212,175,55,0.25),transparent)", marginBottom: 20 }} />

        {/* Responsive grid: 1-col mobile → 2-col tablet → 4-col desktop */}
        <div className="ss-grid">
          {SOCIALS.map(({ label, handle, href, Icon, grad, hoverBg }, i) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ scale: 1.025, y: -2 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 12, cursor: "pointer", textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)",
                transition: "background 0.25s, border-color 0.25s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.13)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              {/* Icon bubble */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: grad, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}>
                <Icon size={20} />
              </div>

              {/* Text */}
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", margin: 0, lineHeight: 1 }}>
                  {label}
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {handle}
                </p>
              </div>

              {/* Arrow */}
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.25)", fontSize: 12, flexShrink: 0 }}>→</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
