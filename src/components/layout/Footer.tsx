import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  WHATSAPP_BUSINESS_NUMBER,
  CALL_NUMBER,
  formatGhanaPhoneDisplay,
  businessWhatsAppHref,
} from "@/lib/contact";

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
              <li style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
                <Phone size={13} style={{ marginTop: 2, flexShrink: 0, color: "#b22222" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 3 }}>
                      WhatsApp
                    </span>
                    <a href={businessWhatsAppHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.18s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                    >
                      {formatGhanaPhoneDisplay(WHATSAPP_BUSINESS_NUMBER)}
                    </a>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 3 }}>
                      Call
                    </span>
                    <a href={`tel:${CALL_NUMBER}`}
                      style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.18s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                    >
                      {formatGhanaPhoneDisplay(CALL_NUMBER)}
                    </a>
                  </div>
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
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Sunday: 2:00 PM – 7:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <style>{`
        .footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        @media (min-width: 640px) {
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }
      `}</style>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="footer-bottom" style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 28px" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            © {new Date().getFullYear()} Queen Verene. All rights reserved.
          </p>
          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>
            Crafted with elegance for the modern Ghanaian woman.
          </p>
        </div>
      </div>
    </footer>
  );
}
