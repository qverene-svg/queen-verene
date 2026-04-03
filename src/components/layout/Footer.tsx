import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const INSTAGRAM_URL  = "https://www.instagram.com/Queenverene_beauty/";
const FACEBOOK_URL   = "https://www.facebook.com/Queen-Verene-Hair";
const TIKTOK_URL     = "https://www.tiktok.com/@Queen.Verene";
const WHATSAPP_URL   = "https://wa.me/233539523961";
const PRIMARY_PHONE  = "+233539523961";    // WhatsApp · main line
const SECONDARY_PHONE = "+233269892224";   // additional call number

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const footerLinks = {
  Services: [
    { label: "Hair Braiding",      href: "/services" },
    { label: "Pedicure & Manicure", href: "/services" },
    { label: "Wig Making & Revamp", href: "/services" },
    { label: "Makeup",             href: "/services" },
    { label: "Hair Styling",       href: "/services" },
  ],
  Company: [
    { label: "Shop",              href: "/shop"      },
    { label: "Jobs",              href: "/jobs"      },
    { label: "Book Appointment",  href: "/dashboard" },
    { label: "Client Portal",     href: "/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer style={{ background: "#0a0a0a", color: "#fff" }}>
      {/* Crimson top rule */}
      <div style={{ height: 2, background: "#b22222" }} />

      {/* Responsive grid: 2-col mobile → 4-col desktop */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: start;
        }
        @media (min-width: 900px) {
          .footer-grid {
            grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
            gap: 48px;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 28px 40px" }}>
        <div className="footer-grid">

          {/* ── Brand ── */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <BrandLogo size={44} withWordmark wordmarkClassName="text-white" />
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, maxWidth: 220, marginBottom: 14 }}>
              Premium beauty services in Ghana. Where every woman is treated like royalty.
            </p>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.9 }}>
              <span style={{ display: "block" }}>Instagram · @Queenverene_beauty</span>
              <span style={{ display: "block" }}>TikTok · @Queen.Verene</span>
              <span style={{ display: "block" }}>Facebook · Queen-Verene Hair</span>
            </div>
            {/* Social icons */}
            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              {[
                { href: INSTAGRAM_URL, label: "Instagram", Icon: InstagramIcon, hover: "#E1306C" },
                { href: TIKTOK_URL,    label: "TikTok",    Icon: TikTokIcon,    hover: "#fff"    },
                { href: FACEBOOK_URL,  label: "Facebook",  Icon: FacebookIcon,  hover: "#4267B2" },
                { href: WHATSAPP_URL,  label: "WhatsApp",  Icon: WhatsAppIcon,  hover: "#25D366" },
              ].map(({ href, label, Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.45)",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = hover; (e.currentTarget as HTMLElement).style.borderColor = hover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Services ── */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4af37", marginBottom: 16 }}>
              Services
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {footerLinks.Services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textDecoration: "none", transition: "color 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company ── */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4af37", marginBottom: 16 }}>
              Company
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {footerLinks.Company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textDecoration: "none", transition: "color 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact ── */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4af37", marginBottom: 16 }}>
              Contact
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                <MapPin size={13} style={{ marginTop: 2, flexShrink: 0, color: "#b22222" }} />
                <span>Accra, Ghana</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <Phone size={13} style={{ flexShrink: 0, color: "#b22222" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <a href={`tel:${PRIMARY_PHONE}`}
                    style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                  >
                    +233 53 952 3961
                  </a>
                  <a href={`tel:${SECONDARY_PHONE}`}
                    style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 12, transition: "color 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
                  >
                    +233 26 989 2224
                  </a>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <Mail size={13} style={{ flexShrink: 0, color: "#b22222" }} />
                <a href="mailto:qverene@gmail.com"
                  style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.18s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  qverene@gmail.com
                </a>
              </li>
            </ul>
            {/* Business hours card */}
            <div style={{
              marginTop: 20, padding: "14px 16px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)",
            }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 8 }}>
                Business Hours
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Mon – Sat: 9:00 AM – 7:00 PM</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Sunday: 11:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "18px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
            © {new Date().getFullYear()} Queen Verene. All rights reserved.
          </p>
          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>
            Crafted with elegance for the modern Ghanaian woman.
          </p>
        </div>
      </div>
    </footer>
  );
}
